// Vercel Cron (כל 10 דקות, ראו vercel.json): ניסיונות חוזרים לאירועי תשלום שלא עובדו עד הסוף,
// ולמיילי אישור שלא נשלחו. מוגן ב-CRON_SECRET (Vercel שולח אותו בכותרת Authorization).
import { deps } from '../_lib/deps';
import { header, noStore, type ApiRequest, type ApiResponse } from '../_lib/http';
import { processPaymentEvent } from '../_lib/paymentProcessing';

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

  const events = await store.listEventsToReprocess(50, MAX_EVENT_ATTEMPTS);
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
