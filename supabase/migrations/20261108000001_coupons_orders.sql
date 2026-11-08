-- מערכת קופונים, הזמנות ותשלומים של CleanFry.
-- כל הגישה לטבלאות נעשית מצד השרת בלבד (פונקציות Vercel עם service_role). RLS מופעל על כל הטבלאות
-- בלי policies, כך שמפתח anon (שנמצא בדפדפן לצורך התחברות מנהל בלבד) לא יכול לקרוא או לכתוב דבר.
--
-- יחידות: סכומים באגורות (integer). discount_percent הוא אחוז רגיל: 18.00 = 18%.
-- תאריכים: timestamptz (נשמרים ב-UTC). גבולות ימים בדוחות מחושבים לפי Asia/Jerusalem.

-- ---------------------------------------------------------------------------
-- קופונים
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    check (code = upper(btrim(code)) and code ~ '^[A-Z0-9_-]{2,30}$'),
  label text not null default '' check (char_length(label) <= 100),
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent < 100),
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint coupons_dates_order check (starts_at is null or expires_at is null or starts_at < expires_at)
);

-- קוד קופון אינו ניתן לשינוי אחרי יצירה; updated_at מתעדכן אוטומטית
create function public.coupons_before_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.code is distinct from old.code then
    raise exception 'coupon_code_immutable';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger coupons_before_update before update on public.coupons
for each row execute function public.coupons_before_update();

create table public.coupon_audit (
  id bigint generated always as identity primary key,
  coupon_id uuid not null references public.coupons(id),
  action text not null check (action in ('create', 'update', 'pause', 'resume', 'import')),
  actor_id uuid,
  actor_email text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index coupon_audit_coupon_idx on public.coupon_audit (coupon_id, created_at desc);

-- ---------------------------------------------------------------------------
-- הזמנות
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  -- מצב התשלום נפרד ממצב הטיפול: ביטול הזמנה אינו הוכחה שהתשלום הוחזר
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'awaiting_verification', 'paid', 'amount_mismatch')),
  fulfillment_status text not null default 'new'
    check (fulfillment_status in ('new', 'fulfilled', 'cancelled')),
  quantity integer not null check (quantity between 1 and 10),
  delivery_method text not null check (delivery_method in ('delivery', 'pickup')),
  pickup_location text check (pickup_location in ('kfar-saba', 'tel-aviv')),
  unit_price_agorot integer not null check (unit_price_agorot > 0),
  subtotal_agorot integer not null check (subtotal_agorot > 0),
  discount_agorot integer not null default 0 check (discount_agorot >= 0),
  shipping_agorot integer not null default 0 check (shipping_agorot >= 0),
  total_agorot integer not null check (total_agorot > 0),
  currency text not null default 'ILS',
  coupon_id uuid references public.coupons(id),
  -- עותק קבוע מרגע יצירת ההזמנה: עריכת קופון לא משנה הזמנות קיימות או דוחות
  coupon_code_snapshot text,
  discount_percent_snapshot numeric(5,2),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_business_id text not null default '',
  shipping_city text not null default '',
  shipping_address text not null default '',
  shipping_apartment text not null default '',
  shipping_zip text not null default '',
  invoice_lines jsonb not null,
  created_at timestamptz not null default now(),
  price_locked_until timestamptz not null,
  paid_at timestamptz,
  paid_after_expiry boolean not null default false,
  duplicate_payment boolean not null default false,
  confirmation_email_sent_at timestamptz,
  confirmation_email_attempts integer not null default 0,
  confirmation_email_last_error text,
  constraint orders_amounts_consistent
    check (total_agorot = subtotal_agorot - discount_agorot + shipping_agorot),
  constraint orders_coupon_snapshot
    check ((coupon_id is null) = (coupon_code_snapshot is null))
);
create index orders_paid_at_idx on public.orders (paid_at) where payment_status = 'paid';
create index orders_coupon_idx on public.orders (coupon_id);
create index orders_status_idx on public.orders (payment_status, created_at);

-- ---------------------------------------------------------------------------
-- אירועי תשלום (כל notify שהתקבל, אחרי הסרת שדות רגישים) ותשלומים מאומתים
-- ---------------------------------------------------------------------------
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'tranzila',
  provider_txn_index text,
  order_id uuid references public.orders(id),
  response_code text,
  sum_raw text,
  currency_raw text,
  confirmation_code text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  attempts integer not null default 0,
  processed_at timestamptz,
  outcome text,
  processing_error text
);
create index payment_events_unprocessed_idx on public.payment_events (received_at) where processed_at is null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_txn_index text not null,
  order_id uuid not null references public.orders(id),
  amount_agorot integer not null,
  currency text not null,
  status text not null check (status in ('approved')),
  verified_via text not null check (verified_via in ('tranzila_api')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  -- אותה עסקה לעולם לא נרשמת פעמיים, גם אם ה-notify מגיע שוב או במקביל
  constraint payments_provider_txn_unique unique (provider, provider_txn_index)
);
create index payments_order_idx on public.payments (order_id);

-- החזרים: רק מבנה בשלב זה. אין עדיין מקור מאומת לנתוני החזר, והדוחות מציגים "לא זמין"
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  payment_id uuid references public.payments(id),
  amount_agorot integer not null check (amount_agorot > 0),
  provider_ref text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint refunds_provider_ref_unique unique (provider_ref)
);

-- ---------------------------------------------------------------------------
-- מנהלים והגבלת קצב
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------------
-- RLS: מופעל בלי policies = חסום לכל תפקיד שאינו service_role
-- ---------------------------------------------------------------------------
alter table public.coupons enable row level security;
alter table public.coupon_audit enable row level security;
alter table public.orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.admin_users enable row level security;
alter table public.rate_limits enable row level security;

revoke all on public.coupons, public.coupon_audit, public.orders, public.payment_events,
  public.payments, public.refunds, public.admin_users, public.rate_limits from anon, authenticated;
