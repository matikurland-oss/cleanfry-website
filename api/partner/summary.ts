// API של אזור המשפיעניות (/partner). מחזיר רק סיכומים מספריים של מכירות בקופונים שלה:
// כמות הזמנות, יחידות, סכום מכירות ועמלה — מצטבר ולפי חודש. אין כאן שום פרט של לקוח או של הזמנה
// בודדת. כל שדה בתשובה נבחר במפורש (אין העברה של שורות מהמסד כמו שהן).
//   GET
import { couponState } from '../_lib/coupons.js';
import { deps } from '../_lib/deps.js';
import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { requirePartner } from '../_lib/partnerAuth.js';
import type { PartnerStats } from '../_lib/store.js';

const stats = (row: PartnerStats) => ({
  orders: row.orders_count,
  units: row.units,
  sales_agorot: row.sales_agorot,
  commission_agorot: row.commission_agorot
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const partner = await requirePartner(req, res);
  if (!partner) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { store, now } = deps();
  try {
    const [months, coupons] = await Promise.all([store.partnerMonthly(partner.id), store.listCoupons()]);
    const currentTime = now();
    const totals = months.reduce(
      (sum, m) => ({
        orders_count: sum.orders_count + m.orders_count,
        units: sum.units + m.units,
        sales_agorot: sum.sales_agorot + m.sales_agorot,
        commission_agorot: sum.commission_agorot + m.commission_agorot
      }),
      { orders_count: 0, units: 0, sales_agorot: 0, commission_agorot: 0 }
    );

    res.status(200).json({
      displayName: partner.display_name,
      commissionPercent: partner.commission_percent,
      coupons: coupons
        .filter((c) => c.partner_id === partner.id)
        .map((c) => ({ code: c.code, discountPercent: c.discount_percent, active: couponState(c, currentTime) === 'active' })),
      totals: stats(totals),
      months: months.map((m) => ({ month: m.month, ...stats(m) }))
    });
  } catch {
    res.status(500).json({ error: 'שגיאה בטעינת הנתונים, נסו שוב' });
  }
}
