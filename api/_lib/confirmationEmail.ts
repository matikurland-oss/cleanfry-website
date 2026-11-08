// מייל אישור ההזמנה (דרך Formspree, כמו קודם) — נשלח רק אחרי שהתשלום אומת ונרשם.
import type { OrderRow } from './store.js';

const FORMSPREE_URL = 'https://formspree.io/f/xvzwnrla';

const shekels = (agorot: number) => `₪${(agorot / 100).toFixed(2).replace(/\.00$/, '')}`;

export function describeDelivery(order: Pick<OrderRow, 'delivery_method' | 'pickup_location' | 'shipping_city' | 'shipping_address' | 'shipping_apartment' | 'quantity'>): string {
  if (order.delivery_method === 'pickup') {
    const place = order.pickup_location === 'kfar-saba' ? 'איסוף עצמי - כפר סבא (בן גוריון 7)' : 'איסוף עצמי - תל אביב (משה וילנסקי 11)';
    return `${place} (כמות: ${order.quantity})`;
  }
  const apartment = order.shipping_apartment ? `, דירה ${order.shipping_apartment}` : '';
  return `${order.shipping_city}, ${order.shipping_address}${apartment} (כמות: ${order.quantity})`;
}

export interface EmailOptions {
  /** התשלום עוד לא אומת מול ה-API של טרנזילה (אין מפתחות או שהאימות נכשל זמנית) */
  unverified?: boolean;
}

export async function sendConfirmationEmail(order: OrderRow, options: EmailOptions = {}): Promise<void> {
  const totalLabel = options.unverified
    ? "סה\"כ לפי הודעת טרנזילה (לא אומת — בדקו בממשק טרנזילה לפני משלוח)"
    : "סה\"כ שולם (מאומת מול טרנזילה)";
  const response = await fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      "נושא": options.unverified
        ? `הזמנה חדשה מאתר CleanFry — ממתינה לאימות תשלום — ${order.public_ref}`
        : `הזמנה חדשה מאתר CleanFry (מאומתת בשרת) — ${order.public_ref}`,
      "מספר הזמנה": order.public_ref,
      "שם הלקוח": order.customer_name,
      "טלפון": order.customer_phone,
      "אימייל": order.customer_email,
      "ח.פ / עוסק מורשה": order.customer_business_id || 'לא הוזן',
      "שיטת קבלה": order.delivery_method === 'delivery' ? 'משלוח' : 'איסוף',
      "פרטים": describeDelivery(order),
      "קוד קופון שהופעל": order.coupon_code_snapshot || 'לא הוגדר קופון',
      [totalLabel]: shekels(order.total_agorot)
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`formspree http ${response.status}`);
}
