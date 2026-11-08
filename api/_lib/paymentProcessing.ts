// עיבוד אירוע תשלום מטרנזילה — משותף ל-tranzila-notify (בזמן אמת) ול-cron/reconcile (ניסיונות חוזרים).
//
// רכישה נרשמת רק אחרי שהשרת שלנו אימת את העסקה מול ה-API של טרנזילה. הפניה החתומה ב-remarks
// מזהה את ההזמנה בלבד; היא לא הוכחה לתשלום. הרישום עצמו אטומי ומונע כפילויות (record_payment).
import { deps } from './deps.js';
import { parseOrderReference } from './orderReference.js';
import type { EventOutcome, PaymentEventInput } from './store.js';

// רק השדות האלה נשמרים מתוך ה-notify. פרטי כרטיס, ת"ז וכדומה לא נשמרים ולא נרשמים ביומנים.
const SAFE_FIELDS = ['index', 'Response', 'sum', 'currency', 'ConfirmationCode', 'remarks', 'tranmode', 'cred_type', 'Tempref'];

function field(body: Record<string, unknown>, ...names: string[]): string | null {
  for (const name of names) {
    const value = body[name];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 200);
    if (typeof value === 'number') return String(value);
  }
  return null;
}

export function sanitizeNotify(body: Record<string, unknown>): PaymentEventInput {
  const payload: Record<string, string> = {};
  for (const name of SAFE_FIELDS) {
    const value = field(body, name, name.toLowerCase());
    if (value !== null) payload[name] = value;
  }
  return {
    provider_txn_index: field(body, 'index', 'Index'),
    order_id: null,
    response_code: field(body, 'Response', 'response', 'processor_response_code'),
    sum_raw: field(body, 'sum', 'Sum', 'amount'),
    currency_raw: field(body, 'currency', 'Currency'),
    confirmation_code: field(body, 'ConfirmationCode', 'confirmationcode'),
    payload
  };
}

export interface ProcessResult {
  outcome: EventOutcome;
  orderId: string | null;
}

/**
 * מעבד אירוע שכבר נשמר במסד הנתונים. שגיאת מסד נתונים נזרקת הלאה (כדי שהקורא יחזיר כשל ויתאפשר
 * ניסיון חוזר); כל תוצאה אחרת נרשמת על האירוע.
 */
export async function processPaymentEvent(eventId: string, event: PaymentEventInput): Promise<ProcessResult> {
  const { store, verifier, sendEmail } = deps();

  const finish = async (outcome: EventOutcome, orderId: string | null, error: string | null = null) => {
    await store.finishPaymentEvent(eventId, outcome, error, orderId);
    return { outcome, orderId };
  };

  const remarks = event.payload.remarks ?? '';
  const orderId = remarks ? parseOrderReference(remarks) : null;
  const order = orderId ? await store.getOrder(orderId) : null;
  if (!orderId || !order) return finish('invalid_reference', null, 'missing or forged order reference');

  if (event.response_code !== '000') return finish('declined', orderId, `response ${event.response_code ?? 'missing'}`);
  if (!event.provider_txn_index) return finish('invalid_reference', orderId, 'missing transaction index');

  const verification = await verifier.verify(event.provider_txn_index);
  if (verification.kind === 'unverifiable' || verification.kind === 'error') {
    await store.markAwaitingVerification(orderId);
    // רק כשאין בכלל מפתחות API (לא כשהאימות נכשל): הרכישה לא נספרת, אבל בעל האתר צריך לדעת על
    // ההזמנה כדי לטפל בה, כמו לפני המערכת הזו. ה-notify לא מאומת, ולכן ההודעה מסומנת בבירור
    // "לא אומת — בדקו בטרנזילה", נשלחת פעם אחת לכל הזמנה, ורק כשהסכום בהודעה תואם.
    const notifiedAgorot = Math.round(Number(event.sum_raw) * 100);
    if (verification.kind === 'unverifiable' && notifiedAgorot === order.total_agorot && (await store.claimUnverifiedNotice(orderId))) {
      try {
        await sendEmail(order, { unverified: true });
      } catch {
        // ההזמנה מופיעה בכל מקרה בדשבורד תחת "דורש תשומת לב"
      }
    }
    return finish(verification.kind === 'unverifiable' ? 'unverified' : 'verification_failed', orderId, verification.reason);
  }
  if (verification.kind === 'declined') return finish('declined', orderId, verification.reason);

  // העסקה המאומתת חייבת לשאת אצל טרנזילה את ההפניה של ההזמנה הזו בדיוק. אחרת ניתן היה לשלוח
  // notify עם הפניה להזמנה שלך ומספר עסקה (רץ, ניתן לניחוש) של לקוח אחר באותו סכום.
  if (verification.remarks !== remarks.trim()) {
    return finish('invalid_reference', orderId, 'transaction belongs to a different order');
  }

  const result = await store.recordPayment(orderId, event.provider_txn_index, verification.amountAgorot, verification.currency);

  if (result.order_newly_paid) {
    // כשל בשליחת המייל לא מבטל את הרכישה; cron/reconcile ינסה שוב בלי ליצור רכישה נוספת
    const paidOrder = (await store.getOrder(orderId)) ?? order;
    try {
      await sendEmail(paidOrder);
      await store.recordEmailAttempt(orderId, null);
    } catch (error) {
      await store.recordEmailAttempt(orderId, error instanceof Error ? error.message.slice(0, 200) : 'email failed');
    }
  }

  if (!result.payment_recorded) return finish('duplicate', orderId);
  if (result.order_payment_status === 'amount_mismatch') return finish('amount_mismatch', orderId, 'charged amount differs from order total');
  return finish('recorded', orderId);
}
