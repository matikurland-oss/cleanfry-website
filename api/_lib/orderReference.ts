// הפניה להזמנה שנשלחת לטרנזילה בשדה remarks וחוזרת ב-notify: מזהה הזמנה אטום + חתימת HMAC.
// החתימה מונעת ניחוש/זיוף של מזהי הזמנות, אבל אינה מוכיחה שה-notify הגיע מטרנזילה — זה מתבצע
// באימות העסקה מול ה-API שלהם (tranzila.ts). פרטי לקוח לא נכנסים לכאן: HMAC לא מצפין.
import crypto from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function secret(): string {
  const value = process.env.ORDER_SIGNING_SECRET;
  if (!value) throw new Error('Server misconfigured: ORDER_SIGNING_SECRET is not set');
  return value;
}

const sign = (orderId: string) => crypto.createHmac('sha256', secret()).update(`order:${orderId}`).digest('base64url');

export function createOrderReference(orderId: string): string {
  return `${orderId}.${sign(orderId)}`;
}

export function parseOrderReference(reference: string): string | null {
  const [orderId, signature] = reference.trim().split('.');
  if (!orderId || !signature || !UUID_PATTERN.test(orderId)) return null;
  const expected = Buffer.from(sign(orderId));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  return orderId;
}
