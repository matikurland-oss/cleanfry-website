-- אישור מכירה ידני מהדשבורד: כשאין מפתחות API לטרנזילה, המנהל בודק את העסקה בממשק של טרנזילה
-- ומאשר את ההזמנה בעצמו. ההזמנה נספרת בדוחות, אבל לא נשלח מייל ללקוח.
alter table public.orders add column manually_confirmed_at timestamptz;
alter table public.orders add column manually_confirmed_by text;

-- ---------------------------------------------------------------------------
-- אישור ידני. רק הזמנה שממתינה לאימות (כלומר התקבל עליה notify מוצלח שלא אומת).
-- מועד התשלום נלקח מה-notify המוצלח, כדי שהמכירה תשויך ליום שבו קרתה בפועל.
-- ---------------------------------------------------------------------------
create function public.admin_confirm_order(p_order_id uuid, p_actor_email text)
returns setof orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_paid_at timestamptz;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.payment_status <> 'awaiting_verification' then
    raise exception 'order_not_confirmable';
  end if;

  select coalesce(min(received_at), now()) into v_paid_at
  from payment_events where order_id = p_order_id and response_code = '000';

  update orders
  set payment_status = 'paid',
      paid_at = v_paid_at,
      paid_after_expiry = v_paid_at > v_order.price_locked_until,
      manually_confirmed_at = now(),
      manually_confirmed_by = p_actor_email
  where id = p_order_id
  returning * into v_order;

  return next v_order;
end $$;

-- ---------------------------------------------------------------------------
-- טבלת הזמנות לדשבורד: הזמנות ששולמו בתקופה (לפי מועד התשלום) והזמנות שממתינות לאישור
-- (לפי מועד היצירה). p_from/p_to הם תאריכים בלוח השנה הישראלי (כולל שניהם).
-- ---------------------------------------------------------------------------
create function public.admin_orders(p_from date, p_to date)
returns setof orders
language sql stable security definer set search_path = public as $$
  with bounds as (
    select (p_from::timestamp at time zone 'Asia/Jerusalem') as start_ts,
           ((p_to + 1)::timestamp at time zone 'Asia/Jerusalem') as end_ts
  )
  select o.*
  from orders o, bounds b
  where (o.payment_status = 'paid' and o.paid_at >= b.start_ts and o.paid_at < b.end_ts)
     or (o.payment_status = 'awaiting_verification' and o.created_at >= b.start_ts and o.created_at < b.end_ts)
  order by coalesce(o.paid_at, o.created_at) desc
  limit 1000;
$$;

-- ---------------------------------------------------------------------------
-- record_payment: אם הזמנה שאושרה ידנית מאומתת בהמשך מול טרנזילה (אחרי הגדרת מפתחות), זה אותו
-- תשלום ולא תשלום כפול. אם הסכום שונה, ההזמנה מסומנת amount_mismatch ויוצאת מהדוחות.
-- ---------------------------------------------------------------------------
create or replace function public.record_payment(
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
  v_had_payment boolean;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  v_had_payment := exists (select 1 from payments where order_id = p_order_id);

  insert into payments (provider, provider_txn_index, order_id, amount_agorot, currency, status, verified_via, verified_at)
  values (p_provider, p_txn_index, p_order_id, p_amount_agorot, p_currency, 'approved', 'tranzila_api', now())
  on conflict (provider, provider_txn_index) do nothing
  returning id into v_payment_id;

  if v_payment_id is null then
    -- העסקה כבר נרשמה בעבר
    return query select false, false, v_order.payment_status;
    return;
  end if;

  if v_order.payment_status = 'paid' and v_order.manually_confirmed_at is not null and not v_had_payment then
    -- האימות של תשלום שכבר אושר ידנית
    if p_amount_agorot <> v_order.total_agorot or p_currency <> v_order.currency then
      update orders set payment_status = 'amount_mismatch' where id = p_order_id;
      return query select true, false, 'amount_mismatch'::text;
      return;
    end if;
    return query select true, false, 'paid'::text;
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
-- coupon_report: הזמנה שאושרה ידנית ואין לה עדיין תשלום רשום נספרת בסכום ההזמנה
-- ---------------------------------------------------------------------------
create or replace function public.coupon_report(p_from date, p_to date)
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
  public.admin_confirm_order(uuid, text),
  public.admin_orders(date, date),
  public.record_payment(uuid, text, text, integer, text),
  public.coupon_report(date, date)
from public, anon, authenticated;

grant execute on function
  public.admin_confirm_order(uuid, text),
  public.admin_orders(date, date),
  public.record_payment(uuid, text, text, integer, text),
  public.coupon_report(date, date)
to service_role;
