// כללי תקפות קופון — משותפים לבדיקת קופון בזמן הזנה ולבדיקה החוזרת בזמן יצירת הזמנה.

export interface CouponRow {
  id: string;
  code: string;
  label: string;
  discount_percent: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CouponState = 'active' | 'paused' | 'not_started' | 'expired';

export const COUPON_CODE_PATTERN = /^[A-Z0-9_-]{2,30}$/;

// תקרת הנחה לקופון (כולל). נאכפת גם במסד הנתונים (coupons_discount_percent_check).
export const MAX_COUPON_DISCOUNT_PERCENT = 25;

export function normalizeCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

export function couponState(coupon: Pick<CouponRow, 'is_active' | 'starts_at' | 'expires_at'>, now: Date): CouponState {
  if (!coupon.is_active) return 'paused';
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'not_started';
  if (coupon.expires_at && new Date(coupon.expires_at) <= now) return 'expired';
  return 'active';
}

// הודעה אחידה ללקוח: לא חושפים אם הקוד קיים-אבל-מושהה או לא קיים בכלל
export const INVALID_COUPON_MESSAGE = 'קוד קופון לא תקין';
