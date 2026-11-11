-- משפיעניות (שותפות): משתמשת שמתחברת ל-/partner ורואה רק סיכומים מספריים של מכירות בקופונים שלה.
-- המנהל יוצר אותה, קובע לה אחוז עמלה ומשייך לה קופונים. אין לה גישה לפרטי לקוחות.
--
-- העמלה: אחוז ממכירות המוצרים אחרי ההנחה, בלי משלוח (subtotal - discount), מעוגל לאגורה בכל הזמנה.
-- המשפיענית והאחוז נשמרים על ההזמנה (snapshot), כך ששינוי אחוז או שיוך לא משנה את העבר.

-- ---------------------------------------------------------------------------
-- טבלת משפיעניות
-- ---------------------------------------------------------------------------
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  commission_percent numeric(5,2) not null check (commission_percent >= 0 and commission_percent <= 50),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid
);

alter table public.partners enable row level security;
revoke all on public.partners from anon, authenticated;

-- ---------------------------------------------------------------------------
-- שיוך קופון למשפיענית, ו-snapshot על ההזמנה
-- ---------------------------------------------------------------------------
alter table public.coupons add column partner_id uuid references public.partners(id);
create index coupons_partner_idx on public.coupons (partner_id) where partner_id is not null;

alter table public.orders add column partner_id uuid references public.partners(id);
alter table public.orders add column partner_commission_percent numeric(5,2);
alter table public.orders add constraint orders_partner_snapshot
  check ((partner_id is null) = (partner_commission_percent is null));
create index orders_partner_idx on public.orders (partner_id, paid_at) where partner_id is not null;

alter table public.coupon_audit drop constraint coupon_audit_action_check;
alter table public.coupon_audit add constraint coupon_audit_action_check
  check (action in ('create', 'update', 'pause', 'resume', 'import', 'assign_partner', 'unassign_partner'));

-- הזמנה חדשה עם קופון של משפיענית מקבלת את המשפיענית ואת האחוז שלה באותו רגע.
-- נעשה במסד הנתונים כדי שאף נתיב יצירת הזמנה לא ידלג על זה.
create function public.orders_set_partner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.coupon_id is not null and new.partner_id is null then
    select p.id, p.commission_percent into new.partner_id, new.partner_commission_percent
    from coupons c join partners p on p.id = c.partner_id
    where c.id = new.coupon_id;
  end if;
  return new;
end $$;

create trigger orders_set_partner before insert on public.orders
for each row execute function public.orders_set_partner();

-- ---------------------------------------------------------------------------
-- שיוך / ביטול שיוך של קופון. בשיוך, הזמנות קודמות בקופון שעוד לא שויכו לאף משפיענית
-- נספרות לה לפי האחוז הנוכחי שלה. הזמנות ששויכו כבר למשפיענית אחרת נשארות שלה.
-- ---------------------------------------------------------------------------
create function public.admin_set_coupon_partner(
  p_coupon_id uuid,
  p_partner_id uuid,
  p_actor_id uuid,
  p_actor_email text
)
returns setof coupons
language plpgsql security definer set search_path = public as $$
declare
  v_coupon coupons%rowtype;
  v_percent numeric(5,2);
begin
  select * into v_coupon from coupons where id = p_coupon_id for update;
  if not found then
    raise exception 'coupon_not_found';
  end if;

  if p_partner_id is not null then
    select commission_percent into v_percent from partners where id = p_partner_id;
    if not found then
      raise exception 'partner_not_found';
    end if;
  end if;

  if v_coupon.partner_id is not distinct from p_partner_id then
    return next v_coupon;
    return;
  end if;

  update coupons set partner_id = p_partner_id, updated_by = p_actor_id
  where id = p_coupon_id
  returning * into v_coupon;

  if p_partner_id is not null then
    update orders
    set partner_id = p_partner_id, partner_commission_percent = v_percent
    where coupon_id = p_coupon_id and partner_id is null;
  end if;

  insert into coupon_audit (coupon_id, action, actor_id, actor_email, changes)
  values (
    p_coupon_id,
    case when p_partner_id is null then 'unassign_partner' else 'assign_partner' end,
    p_actor_id,
    p_actor_email,
    jsonb_build_object('partner_id', p_partner_id)
  );

  return next v_coupon;
end $$;

-- ---------------------------------------------------------------------------
-- סיכום חודשי למשפיענית אחת: רק מספרים מצטברים, בלי שום פרט של לקוח או הזמנה.
-- נספרות הזמנות ששולמו (כולל אישור ידני) ולא בוטלו. חודש לפי מועד התשלום בשעון ישראל.
-- ---------------------------------------------------------------------------
create function public.partner_monthly(p_partner_id uuid)
returns table (
  month text,
  orders_count bigint,
  units bigint,
  sales_agorot bigint,
  commission_agorot bigint
)
language sql stable security definer set search_path = public as $$
  select
    to_char(o.paid_at at time zone 'Asia/Jerusalem', 'YYYY-MM'),
    count(*),
    sum(o.quantity),
    sum(o.subtotal_agorot - o.discount_agorot),
    sum(round((o.subtotal_agorot - o.discount_agorot) * o.partner_commission_percent / 100))::bigint
  from orders o
  where o.partner_id = p_partner_id
    and o.payment_status = 'paid'
    and o.fulfillment_status <> 'cancelled'
  group by 1
  order by 1 desc;
$$;

-- סיכום מצטבר לכל המשפיעניות, לטבלה בדשבורד הניהול
create function public.partner_totals()
returns table (
  partner_id uuid,
  orders_count bigint,
  units bigint,
  sales_agorot bigint,
  commission_agorot bigint
)
language sql stable security definer set search_path = public as $$
  select
    o.partner_id,
    count(*),
    sum(o.quantity),
    sum(o.subtotal_agorot - o.discount_agorot),
    sum(round((o.subtotal_agorot - o.discount_agorot) * o.partner_commission_percent / 100))::bigint
  from orders o
  where o.partner_id is not null
    and o.payment_status = 'paid'
    and o.fulfillment_status <> 'cancelled'
  group by o.partner_id;
$$;

-- ---------------------------------------------------------------------------
-- הרשאות: רק service_role רשאי להריץ
-- ---------------------------------------------------------------------------
revoke execute on function
  public.orders_set_partner(),
  public.admin_set_coupon_partner(uuid, uuid, uuid, text),
  public.partner_monthly(uuid),
  public.partner_totals()
from public, anon, authenticated;

grant execute on function
  public.admin_set_coupon_partner(uuid, uuid, uuid, text),
  public.partner_monthly(uuid),
  public.partner_totals()
to service_role;
