// פונקציית Serverless: בדיקת קוד קופון בזמן ההזנה בעמוד התשלום.
// הקופונים נשמרים במסד הנתונים (Supabase) ומנוהלים מ-/admin. התשובה כוללת רק את הקופון שנבדק —
// אף פעם לא רשימה. זו בדיקה לתצוגה בלבד: create-order בודק את הקופון שוב לפני קביעת הסכום המחייב.
import { couponState, INVALID_COUPON_MESSAGE, normalizeCode } from './_lib/coupons.js';
import { deps } from './_lib/deps.js';
import { bodyObject, noStore, rateLimitKey, type ApiRequest, type ApiResponse } from './_lib/http.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, message: 'Method not allowed' });
    return;
  }

  const code = normalizeCode(bodyObject(req).code);
  if (!code || code.length > 30) {
    res.status(400).json({ valid: false, message: INVALID_COUPON_MESSAGE });
    return;
  }

  const { store, now } = deps();
  try {
    if (!(await store.hitRateLimit(rateLimitKey('coupon', req), 20, 60))) {
      res.status(429).json({ valid: false, message: 'יותר מדי ניסיונות, נסו שוב בעוד דקה' });
      return;
    }

    const coupon = await store.getCouponByCode(code);
    if (!coupon || couponState(coupon, now()) !== 'active') {
      res.status(200).json({ valid: false, message: INVALID_COUPON_MESSAGE });
      return;
    }

    // discountPercent באחוזים (18 = 18%)
    res.status(200).json({ valid: true, code: coupon.code, discountPercent: coupon.discount_percent });
  } catch {
    res.status(503).json({ valid: false, message: 'שגיאה זמנית באימות הקופון, נסו שוב' });
  }
}
