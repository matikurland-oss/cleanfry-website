// API טבלת הזמנות (מנהלים בלבד).
//   GET ?from=YYYY-MM-DD&to=YYYY-MM-DD  — תאריכים בלוח השנה הישראלי, כולל שני הקצוות.
// מחזיר הזמנות ששולמו בתקופה (אומתו מול טרנזילה או אושרו ידנית) והזמנות שממתינות לאישור,
// עם פירוט כמות, מוצרים ומשלוח. הסיכום כולל רק הזמנות ששולמו.
import { requireAdmin } from '../_lib/adminAuth.js';
import { validatePeriod } from '../_lib/adminValidation.js';
import { deps } from '../_lib/deps.js';
import { queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const period = validatePeriod(queryParam(req, 'from'), queryParam(req, 'to'));
  if (period.ok === false) {
    res.status(400).json({ error: period.error });
    return;
  }

  try {
    const orders = (await deps().store.listOrders(period.value.from, period.value.to)).map((o) => ({
      id: o.id,
      public_ref: o.public_ref,
      payment_status: o.payment_status,
      manually_confirmed: Boolean(o.manually_confirmed_at),
      created_at: o.created_at,
      paid_at: o.paid_at,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      delivery_method: o.delivery_method,
      pickup_location: o.pickup_location,
      shipping_city: o.shipping_city,
      quantity: o.quantity,
      products_agorot: o.subtotal_agorot - o.discount_agorot,
      discount_agorot: o.discount_agorot,
      shipping_agorot: o.shipping_agorot,
      total_agorot: o.total_agorot,
      coupon_code: o.coupon_code_snapshot
    }));

    const paid = orders.filter((o) => o.payment_status === 'paid');
    const sum = (list: typeof orders, key: 'quantity' | 'products_agorot' | 'shipping_agorot' | 'total_agorot') =>
      list.reduce((s, o) => s + o[key], 0);
    const pending = orders.filter((o) => o.payment_status === 'awaiting_verification');

    res.status(200).json({
      from: period.value.from,
      to: period.value.to,
      timezone: 'Asia/Jerusalem',
      orders,
      totals: {
        orders: paid.length,
        delivery_orders: paid.filter((o) => o.delivery_method === 'delivery').length,
        pickup_orders: paid.filter((o) => o.delivery_method === 'pickup').length,
        quantity: sum(paid, 'quantity'),
        products_agorot: sum(paid, 'products_agorot'),
        shipping_agorot: sum(paid, 'shipping_agorot'),
        total_agorot: sum(paid, 'total_agorot')
      },
      pending: { orders: pending.length, total_agorot: sum(pending, 'total_agorot') }
    });
  } catch {
    res.status(500).json({ error: 'שגיאת שרת, נסו שוב' });
  }
}
