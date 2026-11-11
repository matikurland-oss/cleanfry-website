-- בדיקות ברמת מסד הנתונים. להרצה מול פרויקט בדיקה בלבד (SQL Editor או psql).
-- הכול רץ בתוך טרנזקציה אחת שמתבטלת בסוף (rollback) — לא נשארים נתונים. כל השורות צריכות ok = true.
begin;
create temp table results (test text, ok boolean, detail text);

select * from admin_create_coupon('nov26', 'Shopping IL', 18, true, null, null, null, 'test', 'create');
do $$ begin
  update coupons set code = 'OTHER' where code = 'NOV26';
  insert into results values ('code immutable', false, 'update succeeded');
exception when others then insert into results values ('code immutable', sqlerrm = 'coupon_code_immutable', sqlerrm); end $$;
select * from admin_update_coupon((select id from coupons where code='NOV26'), '{"is_active": false}', null, 'test');
insert into results select 'audit pause', exists(select 1 from coupon_audit where action='pause'), null;
select * from admin_update_coupon((select id from coupons where code='NOV26'), '{"is_active": true}', null, 'test');

do $$ begin
  insert into coupons (code, discount_percent) values ('OVER25', 30);
  insert into results values ('cap 25%', false, 'insert succeeded');
exception when check_violation then insert into results values ('cap 25%', true, sqlerrm); end $$;

-- שעון חורף (UTC+2): 21:30Z = 23:30 ב-8.11 בישראל ; 22:30Z = 00:30 ב-9.11 בישראל
insert into orders (id, quantity, delivery_method, unit_price_agorot, subtotal_agorot, discount_agorot, shipping_agorot, total_agorot,
  coupon_id, coupon_code_snapshot, discount_percent_snapshot, customer_name, customer_phone, customer_email, invoice_lines, price_locked_until)
values
 ('00000000-0000-0000-0000-000000000001', 4, 'delivery', 5900, 23600, 4200, 3500, 22900, (select id from coupons where code='NOV26'), 'NOV26', 18, 'a','0501234567','a@b.co','[]', '2026-11-08T21:40:00Z'),
 ('00000000-0000-0000-0000-000000000002', 1, 'delivery', 5900, 5900, 0, 3500, 9400, null, null, null, 'b','0501234567','b@b.co','[]', '2026-11-08T22:40:00Z'),
 ('00000000-0000-0000-0000-000000000003', 1, 'delivery', 5900, 5900, 0, 3500, 9400, null, null, null, 'c','0501234567','c@b.co','[]', '2026-11-08T22:40:00Z');

insert into results select 'first record', payment_recorded and order_newly_paid, order_payment_status
  from record_payment('00000000-0000-0000-0000-000000000001', 'tranzila', 'T1', 22900, 'ILS');
insert into results select 'duplicate record', not payment_recorded and not order_newly_paid, order_payment_status
  from record_payment('00000000-0000-0000-0000-000000000001', 'tranzila', 'T1', 22900, 'ILS');
insert into results select 'mismatch', order_payment_status = 'amount_mismatch', order_payment_status
  from record_payment('00000000-0000-0000-0000-000000000003', 'tranzila', 'T3', 100, 'ILS');
insert into results select 'second txn same order', payment_recorded and not order_newly_paid, null
  from record_payment('00000000-0000-0000-0000-000000000001', 'tranzila', 'T1b', 22900, 'ILS');
insert into results select 'duplicate flagged', duplicate_payment, null from orders where id = '00000000-0000-0000-0000-000000000001';
select * from record_payment('00000000-0000-0000-0000-000000000002', 'tranzila', 'T2', 9400, 'ILS');

update orders set paid_at = '2026-11-08T21:30:00Z' where id = '00000000-0000-0000-0000-000000000001';
update orders set paid_at = '2026-11-08T22:30:00Z' where id = '00000000-0000-0000-0000-000000000002';

insert into results select 'report Nov 8 (IL) has only coupon order',
  count(*) = 1 and bool_and(coupon_code = 'NOV26' and paid_orders = 1 and units_sold = 4 and product_sales_agorot = 19400 and discounts_agorot = 4200 and gross_collected_agorot = 45800),
  string_agg(row(r.*)::text, ' | ')
  from coupon_report('2026-11-08', '2026-11-08') r;
insert into results select 'report Nov 9 (IL) has only no-coupon order',
  count(*) = 1 and bool_and(coupon_id is null and paid_orders = 1 and gross_collected_agorot = 9400),
  string_agg(row(r.*)::text, ' | ')
  from coupon_report('2026-11-09', '2026-11-09') r;
insert into results select 'mismatch not counted', not exists (select 1 from coupon_report('2026-11-01','2026-11-30') where paid_orders > 1 and coupon_id is null), null;

select * from admin_update_coupon((select id from coupons where code='NOV26'), '{"discount_percent": 30}', null, 'test');
insert into results select 'snapshot kept', discount_percent_snapshot = 18 and discount_agorot = 4200, null from orders where id = '00000000-0000-0000-0000-000000000001';

insert into results select 'rate limit', (select bool_and(x) from (select hit_rate_limit('t', 2, 60) x from generate_series(1,2)) s) and not hit_rate_limit('t', 2, 60), null;

insert into results select 'anon no table access', not has_table_privilege('anon', 'public.orders', 'select') and not has_table_privilege('authenticated', 'public.coupons', 'select'), null;
insert into results select 'anon no rpc', not has_function_privilege('anon', 'public.record_payment(uuid,text,text,integer,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.coupon_report(date,date)', 'execute'), null;

-- אישור ידני: רק הזמנה שממתינה לאימות; מועד התשלום לפי ה-notify המוצלח; נספרת בדוח בסכום ההזמנה
insert into orders (id, quantity, delivery_method, pickup_location, unit_price_agorot, subtotal_agorot, shipping_agorot, total_agorot,
  customer_name, customer_phone, customer_email, invoice_lines, price_locked_until, payment_status)
values ('00000000-0000-0000-0000-000000000004', 2, 'pickup', 'tel-aviv', 5900, 11800, 0, 11800, 'd','0501234567','d@b.co','[]',
  '2026-11-20T10:15:00Z', 'awaiting_verification');
insert into payment_events (order_id, response_code, received_at) values ('00000000-0000-0000-0000-000000000004', '000', '2026-11-20T10:05:00Z');
do $$ begin
  perform admin_confirm_order('00000000-0000-0000-0000-000000000002', 'test');
  insert into results values ('confirm paid order refused', false, 'confirm succeeded');
exception when others then insert into results values ('confirm paid order refused', sqlerrm = 'order_not_confirmable', sqlerrm); end $$;
insert into results select 'manual confirm', payment_status = 'paid' and paid_at = '2026-11-20T10:05:00Z' and not paid_after_expiry and manually_confirmed_by = 'test', null
  from admin_confirm_order('00000000-0000-0000-0000-000000000004', 'test');
insert into results select 'manual confirm in report', bool_and(paid_orders = 1 and gross_collected_agorot = 11800), string_agg(row(r.*)::text, ' | ')
  from coupon_report('2026-11-20', '2026-11-20') r;
insert into results select 'admin_orders period', count(*) = 1, string_agg(public_ref, ',') from admin_orders('2026-11-20', '2026-11-20');
insert into results select 'later verification not duplicate', payment_recorded and not order_newly_paid and order_payment_status = 'paid', null
  from record_payment('00000000-0000-0000-0000-000000000004', 'tranzila', 'T4', 11800, 'ILS');
insert into results select 'not flagged duplicate', not duplicate_payment, null from orders where id = '00000000-0000-0000-0000-000000000004';
insert into results select 'anon no confirm rpc', not has_function_privilege('anon', 'public.admin_confirm_order(uuid,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.admin_orders(date,date)', 'execute'), null;

-- משפיעניות: שיוך קופון משלים הזמנות קודמות; הזמנה חדשה מקבלת snapshot; שינוי אחוז לא משנה את העבר;
-- רק הזמנות ששולמו ולא בוטלו נספרות; חודש לפי שעון ישראל
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000aa', 'dana@partners.cleanfry.co.il');
insert into partners (id, user_id, username, display_name, commission_percent)
values ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-0000000000aa', 'dana', 'דנה', 15);
select * from admin_set_coupon_partner((select id from coupons where code='NOV26'), '00000000-0000-0000-0000-0000000000bb', null, 'test');
insert into results select 'partner backfill', partner_id = '00000000-0000-0000-0000-0000000000bb' and partner_commission_percent = 15, null
  from orders where id = '00000000-0000-0000-0000-000000000001';
insert into results select 'audit assign', exists(select 1 from coupon_audit where action = 'assign_partner'), null;
update partners set commission_percent = 20 where username = 'dana';
insert into orders (id, quantity, delivery_method, unit_price_agorot, subtotal_agorot, discount_agorot, shipping_agorot, total_agorot,
  coupon_id, coupon_code_snapshot, discount_percent_snapshot, customer_name, customer_phone, customer_email, invoice_lines, price_locked_until)
values ('00000000-0000-0000-0000-000000000005', 1, 'delivery', 5900, 5900, 1000, 3500, 8400,
  (select id from coupons where code='NOV26'), 'NOV26', 18, 'e','0501234567','e@b.co','[]', '2026-12-01T10:15:00Z'),
 ('00000000-0000-0000-0000-000000000006', 1, 'delivery', 5900, 5900, 1000, 3500, 8400,
  (select id from coupons where code='NOV26'), 'NOV26', 18, 'f','0501234567','f@b.co','[]', '2026-12-01T10:15:00Z');
insert into results select 'partner snapshot on insert', partner_commission_percent = 20, null
  from orders where id = '00000000-0000-0000-0000-000000000005';
insert into results select 'old rate kept', partner_commission_percent = 15, null from orders where id = '00000000-0000-0000-0000-000000000001';
select * from record_payment('00000000-0000-0000-0000-000000000005', 'tranzila', 'T5', 8400, 'ILS');
update orders set paid_at = '2026-11-30T22:30:00Z' where id = '00000000-0000-0000-0000-000000000005'; -- 00:30 ב-1.12 בישראל
select * from record_payment('00000000-0000-0000-0000-000000000006', 'tranzila', 'T6', 8400, 'ILS');
update orders set fulfillment_status = 'cancelled' where id = '00000000-0000-0000-0000-000000000006';
-- הזמנה 1: 23600-4200 = 19400 * 15% = 2910, נובמבר. הזמנה 5: 4900 * 20% = 980, דצמבר. הזמנה 6 בוטלה.
insert into results select 'partner monthly', string_agg(format('%s:%s:%s:%s:%s', month, orders_count, units, sales_agorot, commission_agorot), ',' order by month)
  = '2026-11:1:4:19400:2910,2026-12:1:1:4900:980', string_agg(format('%s:%s:%s:%s:%s', month, orders_count, units, sales_agorot, commission_agorot), ',')
  from partner_monthly('00000000-0000-0000-0000-0000000000bb');
insert into results select 'partner totals', orders_count = 2 and commission_agorot = 3890, null
  from partner_totals() where partner_id = '00000000-0000-0000-0000-0000000000bb';
insert into results select 'anon no partner rpc', not has_function_privilege('anon', 'public.partner_monthly(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.partner_totals()', 'execute')
  and not has_function_privilege('authenticated', 'public.admin_set_coupon_partner(uuid,uuid,uuid,text)', 'execute')
  and not has_table_privilege('anon', 'public.partners', 'select'), null;
do $$ begin
  update partners set commission_percent = 60 where username = 'dana';
  insert into results values ('commission cap', false, 'update succeeded');
exception when check_violation then insert into results values ('commission cap', true, sqlerrm); end $$;

select * from results;
rollback;
