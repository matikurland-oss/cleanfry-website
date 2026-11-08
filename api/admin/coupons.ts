// API ניהול קופונים (מנהלים בלבד). אין מחיקה; אין שינוי קוד. כל שינוי נרשם ב-coupon_audit.
//   GET   ?from=YYYY-MM-DD&to=YYYY-MM-DD   רשימת קופונים + מצב + ביצועים בתקופה
//   POST  { code, label, discount_percent, is_active, starts_at, expires_at }
//   PATCH ?id=<uuid>  { label?, discount_percent?, is_active?, starts_at?, expires_at? }
import { requireAdmin } from '../_lib/adminAuth.js';
import { validateCouponCreate, validateCouponPatch, validatePeriod } from '../_lib/adminValidation.js';
import { couponState } from '../_lib/coupons.js';
import { deps } from '../_lib/deps.js';
import { bodyObject, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { store, now } = deps();
  const actor = { id: admin.id, email: admin.email };

  try {
    if (req.method === 'GET') {
      const period = validatePeriod(queryParam(req, 'from'), queryParam(req, 'to'));
      if (period.ok === false) {
        res.status(400).json({ error: period.error });
        return;
      }
      const [coupons, report] = await Promise.all([
        store.listCoupons(),
        store.couponReport(period.value.from, period.value.to)
      ]);
      const statsById = new Map(report.filter((r) => r.coupon_id).map((r) => [r.coupon_id, r]));
      const currentTime = now();
      res.status(200).json({
        coupons: coupons.map((c) => {
          const stats = statsById.get(c.id);
          return {
            ...c,
            state: couponState(c, currentTime),
            paid_orders: stats?.paid_orders ?? 0,
            gross_collected_agorot: stats?.gross_collected_agorot ?? 0
          };
        })
      });
      return;
    }

    if (req.method === 'POST') {
      const input = validateCouponCreate(bodyObject(req));
      if (input.ok === false) {
        res.status(400).json({ error: input.error });
        return;
      }
      if (await store.getCouponByCode(input.value.code)) {
        res.status(409).json({ error: 'קוד קופון זה כבר קיים' });
        return;
      }
      res.status(201).json({ coupon: await store.createCoupon(input.value, actor) });
      return;
    }

    if (req.method === 'PATCH') {
      const id = queryParam(req, 'id');
      if (!UUID_PATTERN.test(id)) {
        res.status(400).json({ error: 'מזהה קופון לא תקין' });
        return;
      }
      const current = await store.getCoupon(id);
      if (!current) {
        res.status(404).json({ error: 'הקופון לא נמצא' });
        return;
      }
      const patch = validateCouponPatch(bodyObject(req), current);
      if (patch.ok === false) {
        res.status(400).json({ error: patch.error });
        return;
      }
      res.status(200).json({ coupon: await store.updateCoupon(id, patch.value, actor) });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) {
      res.status(409).json({ error: 'קוד קופון זה כבר קיים' });
      return;
    }
    res.status(500).json({ error: 'שגיאת שרת, נסו שוב' });
  }
}
