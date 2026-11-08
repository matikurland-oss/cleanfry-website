-- פונקציות שרת אטומיות. נקראות רק מפונקציות Vercel (service_role) דרך RPC.

-- ---------------------------------------------------------------------------
-- הגבלת קצב: מונה לחלון זמן קבוע. מחזיר true אם הבקשה מותרת.
-- ---------------------------------------------------------------------------
create function public.hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into rate_limits (key, window_start, count) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into v_count;

  -- ניקוי מזדמן של חלונות ישנים
  if random() < 0.02 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end $$;

-- ---------------------------------------------------------------------------
-- רישום תשלום מאומת — עסקה אחת: נעילת ההזמנה, הוספת התשלום (ייחודי לפי מזהה העסקה),
-- בדיקת סכום ומטבע ועדכון ההזמנה. קריאה חוזרת או מקבילה לאותה עסקה לא תרשום כפול.
-- ---------------------------------------------------------------------------
create function public.record_payment(
  p_order_id uuid,
  p_provider text,
  p_txn_index text,
  p_amount_agorot integer,
  p_currency text
)
returns table (payment_recorded boolean, order_newly_paid boolean, order_payment_status text)
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_payment_id uuid;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  insert into payments (provider, provider_txn_index, order_id, amount_agorot, currency, status, verified_via, verified_at)
  values (p_provider, p_txn_index, p_order_id, p_amount_agorot, p_currency, 'approved', 'tranzila_api', now())
  on conflict (provider, provider_txn_index) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    -- העסקה כבר נרשמה בעבר
    return query select false, false, v_order.payment_status;
    return;
  end if;

  if v_order.payment_status = 'paid' then
    -- עסקה מאושרת שנייה לאותה הזמנה: הכסף התקבל בפועל, לכן נרשם, ומסומן לבדיקה ידנית
    update orders set duplicate_payment = true where id = p_order_id;
    return query select true, false, 'paid'::text;
    return;
  end if;

  if p_amount_agorot <> v_order.total_agorot or p_currency <> v_order.currency then
    update orders set payment_status = 'amount_mismatch', paid_at = coalesce(paid_at, now())
    where id = p_order_id;
    return query select true, false, 'amount_mismatch'::text;
    return;
  end if;

  update orders
  set payment_status = 'paid',
      paid_at = now(),
      paid_after_expiry = now() > v_order.price_locked_until
  where id = p_order_id;

  return query select true, true, 'paid'::text;
end $$;

-- ---------------------------------------------------------------------------
-- ניהול קופונים עם יומן שינויים (באותה עסקה)
-- ---------------------------------------------------------------------------
create function public.admin_create_coupon(
  p_code text,
  p_label text,
  p_discount_percent numeric,
  p_is_active boolean,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_actor_id uuid,
  p_actor_email text,
  p_action text default 'create'
)
returns setof coupons
language plpgsql security definer set search_path = public as $$
declare
  v_row coupons%rowtype;
begin
  insert into coupons (code, label, discount_percent, is_active, starts_at, expires_at, created_by, updated_by)
  values (upper(btrim(p_code)), coalesce(p_label, ''), p_discount_percent, coalesce(p_is_active, true),
          p_starts_at, p_expires_at, p_actor_id, p_actor_id)
  returning * into v_row;

  insert into coupon_audit (coupon_id, action, actor_id, actor_email, changes)
  values (v_row.id, p_action, p_actor_id, p_actor_email, jsonb_build_object(
    'code', v_row.code, 'label', v_row.label, 'discount_percent', v_row.discount_percent,
    'is_active', v_row.is_active, 'starts_at', v_row.starts_at, 'expires_at', v_row.expires_at));

  return next v_row;
end $$;

-- p_patch: אובייקט עם השדות שמשתנים בלבד (label, discount_percent, is_active, starts_at, expires_at).
-- null מפורש בתאריך = הסרת התאריך. code אינו ניתן לשינוי.
create function public.admin_update_coupon(
  p_id uuid,
  p_patch jsonb,
  p_actor_id uuid,
  p_actor_email text
)
returns setof coupons
language plpgsql security definer set search_path = public as $$
declare
  v_old coupons%rowtype;
  v_new coupons%rowtype;
  v_changes jsonb := '{}'::jsonb;
  v_action text;
begin
  if p_patch ? 'code' then
    raise exception 'coupon_code_immutable';
  end if;

  select * into v_old from coupons where id = p_id for update;
  if not found then
    raise exception 'coupon_not_found';
  end if;

  update coupons set
    label = case when p_patch ? 'label' then coalesce(p_patch->>'label', '') else label end,
    discount_percent = case when p_patch ? 'discount_percent' then (p_patch->>'discount_percent')::numeric else discount_percent end,
    is_active = case when p_patch ? 'is_active' then (p_patch->>'is_active')::boolean else is_active end,
    starts_at = case when p_patch ? 'starts_at' then (p_patch->>'starts_at')::timestamptz else starts_at end,
    expires_at = case when p_patch ? 'expires_at' then (p_patch->>'expires_at')::timestamptz else expires_at end,
    updated_by = p_actor_id
  where id = p_id
  returning * into v_new;

  if v_new.label is distinct from v_old.label then
    v_changes := v_changes || jsonb_build_object('label', jsonb_build_array(v_old.label, v_new.label));
  end if;
  if v_new.discount_percent is distinct from v_old.discount_percent then
    v_changes := v_changes || jsonb_build_object('discount_percent', jsonb_build_array(v_old.discount_percent, v_new.discount_percent));
  end if;
  if v_new.is_active is distinct from v_old.is_active then
    v_changes := v_changes || jsonb_build_object('is_active', jsonb_build_array(v_old.is_active, v_new.is_active));
  end if;
  if v_new.starts_at is distinct from v_old.starts_at then
    v_changes := v_changes || jsonb_build_object('starts_at', jsonb_build_array(v_old.starts_at, v_new.starts_at));
  end if;
  if v_new.expires_at is distinct from v_old.expires_at then
    v_changes := v_changes || jsonb_build_object('expires_at', jsonb_build_array(v_old.expires_at, v_new.expires_at));
  end if;

  if v_changes <> '{}'::jsonb then
    v_action := case
      when (select count(*) from jsonb_object_keys(v_changes)) = 1 and v_changes ? 'is_active'
        then case when v_new.is_active then 'resume' else 'pause' end
      else 'update'
    end;
    insert into coupon_audit (coupon_id, action, actor_id, actor_email, changes)
    values (p_id, v_action, p_actor_id, p_actor_email, v_changes);
  end if;

  return next v_new;
end $$;

-- ---------------------------------------------------------------------------
-- דוח ביצועי קופונים. p_from/p_to הם תאריכים בלוח השנה הישראלי (כולל שניהם).
-- רכישה משויכת לתקופה לפי מועד התשלום. נספרות רק הזמנות במצב paid.
-- החזרים מוצגים עבור הרכישות שבתקופה, גם אם ההחזר בוצע מאוחר יותר.
-- ---------------------------------------------------------------------------
create function public.coupon_report(p_from date, p_to date)
returns table (
  coupon_id uuid,
  coupon_code text,
  coupon_label text,
  paid_orders bigint,
  units_sold bigint,
  product_sales_agorot bigint,
  discounts_agorot bigint,
  gross_collected_agorot bigint,
  refunds_agorot bigint
)
language sql stable security definer set search_path = public as $$
  with bounds as (
    select (p_from::timestamp at time zone 'Asia/Jerusalem') as start_ts,
           ((p_to + 1)::timestamp at time zone 'Asia/Jerusalem') as end_ts
  ),
  paid as (
    select o.*
    from orders o, bounds b
    where o.payment_status = 'paid' and o.paid_at >= b.start_ts and o.paid_at < b.end_ts
  ),
  collected as (
    select p.order_id, sum(p.amount_agorot) as amount
    from payments p join paid on paid.id = p.order_id
    where p.status = 'approved'
    group by p.order_id
  ),
  refunded as (
    select r.order_id, sum(r.amount_agorot) as amount
    from refunds r join paid on paid.id = r.order_id
    where r.verified_at is not null
    group by r.order_id
  )
  select
    paid.coupon_id,
    coalesce(max(c.code), max(paid.coupon_code_snapshot)),
    max(c.label),
    count(*),
    sum(paid.quantity),
    sum(paid.subtotal_agorot - paid.discount_agorot),
    sum(paid.discount_agorot),
    coalesce(sum(collected.amount), 0),
    coalesce(sum(refunded.amount), 0)
  from paid
  left join coupons c on c.id = paid.coupon_id
  left join collected on collected.order_id = paid.id
  left join refunded on refunded.order_id = paid.id
  group by paid.coupon_id
  order by count(*) desc;
$$;

-- ---------------------------------------------------------------------------
-- הרשאות: רק service_role רשאי להריץ
-- ---------------------------------------------------------------------------
revoke execute on function
  public.hit_rate_limit(text, integer, integer),
  public.record_payment(uuid, text, text, integer, text),
  public.admin_create_coupon(text, text, numeric, boolean, timestamptz, timestamptz, uuid, text, text),
  public.admin_update_coupon(uuid, jsonb, uuid, text),
  public.coupon_report(date, date),
  public.coupons_before_update()
from public, anon, authenticated;

grant execute on function
  public.hit_rate_limit(text, integer, integer),
  public.record_payment(uuid, text, text, integer, text),
  public.admin_create_coupon(text, text, numeric, boolean, timestamptz, timestamptz, uuid, text, text),
  public.admin_update_coupon(uuid, jsonb, uuid, text),
  public.coupon_report(date, date)
to service_role;
