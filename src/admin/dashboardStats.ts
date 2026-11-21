// קיבוצים לדשבורד הניהול. אין כאן חישוב כספי חדש: הכול נבנה משדות שהשרת כבר חישב
// (orders מ-/api/admin/orders, rows מ-/api/admin/report). נספרות רק הזמנות ששולמו או אושרו ידנית,
// בדיוק כמו totals בתשובת /api/admin/orders.
import type { AdminOrder, OrdersResponse, ReportRow } from './adminApi';
import { addDays, israelDate } from './israelTime';

export const paidOrders = (orders: AdminOrder[]) => orders.filter((o) => o.payment_status === 'paid');

/** מועד השיוך לתקופה: מועד התשלום (כמו בשרת). created_at רק כגיבוי. */
const orderTime = (o: AdminOrder) => o.paid_at ?? o.created_at;

export interface Kpis {
  revenue_agorot: number;
  orders: number;
  units: number;
  average_agorot: number;
  discounts_agorot: number;
  commission_agorot: number;
}

/** ה-KPI לקוחים ישירות מ-totals של "הזמנות", כך שהם זהים לסיכום הקיים. ההנחות מדוח הקופונים. */
export function kpis(data: OrdersResponse, rows: ReportRow[]): Kpis {
  const t = data.totals;
  return {
    revenue_agorot: t.total_agorot,
    orders: t.orders,
    units: t.quantity,
    average_agorot: t.orders > 0 ? Math.round(t.total_agorot / t.orders) : 0,
    discounts_agorot: rows.reduce((s, r) => s + r.discounts_agorot, 0),
    commission_agorot: t.commission_agorot
  };
}

/** הכנסות לפי יום (שעון ישראל), כולל ימים בלי מכירות */
export function revenueByDay(orders: AdminOrder[], from: string, to: string) {
  const byDay = new Map<string, { total_agorot: number; orders: number }>();
  for (let d = from; d <= to; d = addDays(d, 1)) byDay.set(d, { total_agorot: 0, orders: 0 });
  for (const o of paidOrders(orders)) {
    const day = byDay.get(israelDate(new Date(orderTime(o))));
    if (!day) continue;
    day.total_agorot += o.total_agorot;
    day.orders += 1;
  }
  return [...byDay].map(([day, v]) => ({ day, ...v }));
}

export const QUANTITY_BUCKETS = [1, 2, 3, 4, 5, 10] as const;

/** כמה הזמנות היו מכל גודל. גדלים אחרים (אם יהיו) נספרים ב"אחר". */
export function quantityDistribution(orders: AdminOrder[]) {
  const counts = new Map<string, number>(QUANTITY_BUCKETS.map((q) => [String(q), 0]));
  let other = 0;
  for (const o of paidOrders(orders)) {
    const key = String(o.quantity);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
    else other += 1;
  }
  const list = [...counts].map(([quantity, count]) => ({ label: quantity, count }));
  return other > 0 ? [...list, { label: 'אחר', count: other }] : list;
}

/** משלוח מול איסוף: מספר הזמנות וסך שנגבה */
export function deliverySplit(orders: AdminOrder[]) {
  const paid = paidOrders(orders);
  const part = (method: AdminOrder['delivery_method']) => {
    const list = paid.filter((o) => o.delivery_method === method);
    return { orders: list.length, total_agorot: list.reduce((s, o) => s + o.total_agorot, 0) };
  };
  return { delivery: part('delivery'), pickup: part('pickup') };
}

/** עם קופון מול בלי קופון, לפי "סך שנגבה" בדוח ביצועי הקופונים */
export function couponSplit(rows: ReportRow[]) {
  const withCoupon = rows.filter((r) => r.coupon_id);
  const without = rows.filter((r) => !r.coupon_id);
  const sum = (list: ReportRow[]) => ({
    orders: list.reduce((s, r) => s + r.paid_orders, 0),
    total_agorot: list.reduce((s, r) => s + r.gross_collected_agorot, 0)
  });
  return { withCoupon: sum(withCoupon), without: sum(without) };
}

/** שורות לטבלה המקוצרת: קופונים עם רכישה אחת לפחות, ו"ללא קופון" בסוף */
export function activeCouponRows(rows: ReportRow[]) {
  return [
    ...rows.filter((r) => r.coupon_id && r.paid_orders > 0),
    ...rows.filter((r) => !r.coupon_id && r.paid_orders > 0)
  ];
}

/** ההזמנות מהחדשה לישנה */
export function newestFirst(orders: AdminOrder[]) {
  return [...orders].sort((a, b) => Date.parse(orderTime(b)) - Date.parse(orderTime(a)));
}
