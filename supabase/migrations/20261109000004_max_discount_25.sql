-- תקרת הנחה לקופון: עד 25% (כולל). תואם ל-MAX_COUPON_DISCOUNT_PERCENT ב-api/_lib/coupons.ts
alter table public.coupons drop constraint coupons_discount_percent_check;
alter table public.coupons add constraint coupons_discount_percent_check
  check (discount_percent > 0 and discount_percent <= 25);
