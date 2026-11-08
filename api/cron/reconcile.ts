// Vercel Cron (פעם ביום; בתוכנית Pro מומלץ כל 10 דקות — ראו vercel.json): ניסיונות חוזרים לאירועי תשלום שלא עובדו עד הסוף,
// ולמיילי אישור שלא נשלחו. מוגן ב-CRON_SECRET (Vercel שולח אותו בכותרת Authorization).
import { deps } from '../_lib/deps.js';
import { header, noStore, type ApiRequest, type ApiResponse } from '../_lib/http.js';
import { processPaymentEvent } from '../_lib/paymentProcessing.js';

const MAX_EVENT_ATTEMPTS = 20;
const MAX_EMAIL_ATTEMPTS = 5;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);
  const secret = process.env.CRON_SECRET;
  if (!secret || header(req, 'authorization') !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { store, verifier, sendEmail } = deps();
  const summary = { events: 0, skippedUnverifiable: 0, emailsSent: 0, emailsFailed: 0, errors: 0 };

  // אירוע אחד לכל הזמנה בכל ריצה: כך הצפה של notify מזויפים עבור הזמנה אחת לא יכולה לדחוק החוצה
  // אירועים אמיתיים של הזמנות אחרות. גם הזמנה ששולמה עוברת אימות מלא: חיוב נוסף אמיתי צריך
  // להירשם ולהסתמן לבדיקה (duplicate_payment), וכפילות אמיתית נעצרת ב-record_payment.
  const candidates = await store.listEventsToReprocess(500, MAX_EVENT_ATTEMPTS);
  const seenOrders = new Set<string>();
  const events = [];
  for (const event of candidates) {
    const key = event.order_id ?? `event:${event.id}`;
    if (seenOrders.has(key)) continue;
    seenOrders.add(key);
    events.push(event);
    if (events.length >= 50) break;
  }

  for (const event of events) {
    // בלי מפתחות API אין טעם לנסות שוב אירועים שממתינים לאימות
    if (event.outcome === 'unverified' && !verifier.configured) {
      summary.skippedUnverifiable++;
      continue;
    }
    try {
      await processPaymentEvent(event.id, event);
      summary.events++;
    } catch (error) {
      summary.errors++;
      await store.failPaymentEvent(event.id, error instanceof Error ? error.message.slice(0, 200) : 'processing failed').catch(() => {});
    }
  }

  for (const order of await store.listOrdersNeedingEmail(MAX_EMAIL_ATTEMPTS)) {
    try {
      await sendEmail(order);
      await store.recordEmailAttempt(order.id, null);
      summary.emailsSent++;
    } catch (error) {
      await store.recordEmailAttempt(order.id, error instanceof Error ? error.message.slice(0, 200) : 'email failed');
      summary.emailsFailed++;
    }
  }

  res.status(200).json({ ok: true, ...summary });
}
