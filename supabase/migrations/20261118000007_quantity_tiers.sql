-- תמחור לפי כמות (מדרגות) וכפל מבצעים בקופונים.
-- טבלת המדרגות עצמה מוגדרת בקוד (shared/pricing.ts) ולא כאן: השרת מחשב את הסכום, ומסד הנתונים
-- שומר על כל הזמנה את כל מה שצריך כדי לשחזר אותה גם אם המחירים ישתנו בעתיד.

-- ---------------------------------------------------------------------------
-- קופונים: כפל מבצעים. ברירת מחדל: כבוי, גם לקופונים קיימים.
--   true  – ההנחה מחושבת על מחיר המדרגה.
--   false – ההנחה מחושבת על מחיר המחירון, והלקוח מקבל את הזול מבין מחיר המדרגה למחיר הקופון.
-- ---------------------------------------------------------------------------
alter table public.coupons add column stacks_promotions boolean not null default false;

-- ---------------------------------------------------------------------------
-- הזמנות: snapshot של התמחור.
--   unit_price_agorot (קיים)  – המחיר למארז שעליו חושב סכום המוצרים בפועל
--   tier_unit_price_agorot    – מחיר המדרגה למארז
--   coupon_stacks_snapshot    – ערך כפל המבצעים של הקופון בזמן ההזמנה
--   coupon_applied            – האם הקופון שהוזן הוחל (false = מחיר החבילה היה זול יותר)
-- ---------------------------------------------------------------------------
alter table public.orders add column tier_unit_price_agorot integer check (tier_unit_price_agorot > 0);
alter table public.orders add column coupon_stacks_snapshot boolean;
alter table public.orders add column coupon_applied boolean;

-- הזמנות קיימות: מחיר אחיד, וכל קופון שנשמר עליהן הוחל
update public.orders set tier_unit_price_agorot = unit_price_agorot where tier_unit_price_agorot is null;
update public.orders set coupon_applied = true, coupon_stacks_snapshot = false
where coupon_id is not null and coupon_applied is null;

-- נתיב יצירה שלא שולח מחיר מדרגה (למשל סקריפט ישן) מקבל את המחיר שהוחל, כדי שהעמודה תמיד תהיה מלאה
create function public.orders_default_tier_price() returns trigger
language plpgsql set search_path = public as $$
begin
  new.tier_unit_price_agorot := coalesce(new.tier_unit_price_agorot, new.unit_price_agorot);
  return new;
end $$;

create trigger orders_default_tier_price before insert on public.orders
for each row execute function public.orders_default_tier_price();

alter table public.orders alter column tier_unit_price_agorot set not null;
alter table public.orders add constraint orders_coupon_applied_snapshot
  check ((coupon_id is null) = (coupon_applied is null));
alter table public.orders add constraint orders_not_applied_no_discount
  check (coupon_applied is distinct from false or discount_agorot = 0);

-- ---------------------------------------------------------------------------
-- admin_create_coupon: פרמטר חדש p_stacks_promotions
-- ---------------------------------------------------------------------------
drop function public.admin_create_coupon(text, text, numeric, boolean, timestamptz, timestamptz, uuid, text, text);

create function public.admin_create_coupon(
  p_code text,
  p_label text,
  p_discount_percent numeric,
  p_is_active boolean,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_actor_id uuid,
  p_actor_email text,
  p_action text default 'create',
  p_stacks_promotions boolean default false
)
returns setof coupons
language plpgsql security definer set search_path = public as $$
declare
  v_row coupons%rowtype;
begin
  insert into coupons (code, label, discount_percent, is_active, stacks_promotions, starts_at, expires_at, created_by, updated_by)
  values (upper(btrim(p_code)), coalesce(p_label, ''), p_discount_percent, coalesce(p_is_active, true),
          coalesce(p_stacks_promotions, false), p_starts_at, p_expires_at, p_actor_id, p_actor_id)
  returning * into v_row;

  insert into coupon_audit (coupon_id, action, actor_id, actor_email, changes)
  values (v_row.id, p_action, p_actor_id, p_actor_email, jsonb_build_object(
    'code', v_row.code, 'label', v_row.label, 'discount_percent', v_row.discount_percent,
    'is_active', v_row.is_active, 'stacks_promotions', v_row.stacks_promotions,
    'starts_at', v_row.starts_at, 'expires_at', v_row.expires_at));

  return next v_row;
end $$;

-- ---------------------------------------------------------------------------
-- admin_update_coupon: מפתח חדש stacks_promotions ב-p_patch (אותה חתימה)
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_coupon(
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
    stacks_promotions = case when p_patch ? 'stacks_promotions' then (p_patch->>'stacks_promotions')::boolean else stacks_promotions end,
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
  if v_new.stacks_promotions is distinct from v_old.stacks_promotions then
    v_changes := v_changes || jsonb_build_object('stacks_promotions', jsonb_build_array(v_old.stacks_promotions, v_new.stacks_promotions));
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
-- coupon_report: עמודות חדשות applied_orders / not_applied_orders.
-- הזמנה שבה הקוד הוזן אבל מחיר החבילה היה זול יותר נספרת תחת הקופון (והמשפיענית מקבלת עליה עמלה),
-- אבל מסומנת בנפרד ולא נספרת כהזמנה עם הנחה. סכום המוצרים: אחרי הנחה ובלי משלוח, כמו קודם.
-- ---------------------------------------------------------------------------
drop function public.coupon_report(date, date);

create function public.coupon_report(p_from date, p_to date)
returns table (
  coupon_id uuid,
  coupon_code text,
  coupon_label text,
  paid_orders bigint,
  applied_orders bigint,
  not_applied_orders bigint,
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
    count(*) filter (where paid.coupon_id is not null and paid.coupon_applied is distinct from false),
    count(*) filter (where paid.coupon_id is not null and paid.coupon_applied = false),
    sum(paid.quantity),
    sum(paid.subtotal_agorot - paid.discount_agorot),
    sum(paid.discount_agorot),
    coalesce(sum(coalesce(collected.amount,
      case when paid.manually_confirmed_at is not null then paid.total_agorot end)), 0),
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
  public.admin_create_coupon(text, text, numeric, boolean, timestamptz, timestamptz, uuid, text, text, boolean),
  public.admin_update_coupon(uuid, jsonb, uuid, text),
  public.coupon_report(date, date)
from public, anon, authenticated;

grant execute on function
  public.admin_create_coupon(text, text, numeric, boolean, timestamptz, timestamptz, uuid, text, text, boolean),
  public.admin_update_coupon(uuid, jsonb, uuid, text),
  public.coupon_report(date, date)
to service_role;
