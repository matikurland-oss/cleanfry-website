// אימות עסקאות מול טרנזילה.
//
// הודעת ה-notify של טרנזילה אינה חתומה (לפי התיעוד הרשמי של iframe-integration-directng), ולכן
// היא לבדה לא מוכיחה שהתשלום בוצע — כל אחד יכול לשלוח POST לכתובת שלנו. רכישה נספרת רק אחרי
// שהשרת שלנו פנה בעצמו ל-API של טרנזילה ואימת את העסקה לפי מספר האינדקס שלה.
//
// ה-API דורש מפתחות (app key + secret) מממשק הניהול של טרנזילה. בלי מפתחות, NoopVerifier מחזיר
// 'unverifiable' — ההזמנה נשארת "ממתינה לאימות" ולא נספרת בדוחות.
//
// אימות החתימה (מתוך docs.tranzila.com): access-token = HMAC-SHA256(message=app_key, key=secret+time+nonce).
// כתובת החיפוש ומבנה התשובה לא מתועדים במלואם בפומבי — ראו docs/coupons-admin.md. הקוד נכשל
// באופן סגור (error) אם התשובה לא במבנה הצפוי, כך שאף פעם לא יסמן תשלום על סמך תשובה לא מובנת.
import crypto from 'node:crypto';

export type VerifyResult =
  | { kind: 'verified'; amountAgorot: number; currency: string; remarks: string }
  | { kind: 'declined'; reason: string }
  | { kind: 'unverifiable'; reason: string }
  | { kind: 'error'; reason: string };

export interface TranzilaVerifier {
  readonly configured: boolean;
  verify(txnIndex: string): Promise<VerifyResult>;
}

export const noopVerifier: TranzilaVerifier = {
  configured: false,
  async verify() {
    return { kind: 'unverifiable', reason: 'tranzila api keys not configured' };
  }
};

// קודי מטבע של טרנזילה
const CURRENCY_CODES: Record<string, string> = { '1': 'ILS', '2': 'USD', '978': 'EUR', '826': 'GBP', ILS: 'ILS' };

export function tranzilaAuthHeaders(appKey: string, secret: string, now = Date.now()) {
  const time = Math.round(now / 1000).toString();
  const nonce = crypto.randomBytes(40).toString('hex').slice(0, 80);
  const token = crypto.createHmac('sha256', secret + time + nonce).update(appKey).digest('hex');
  return {
    'X-tranzila-api-app-key': appKey,
    'X-tranzila-api-request-time': time,
    'X-tranzila-api-nonce': nonce,
    'X-tranzila-api-access-token': token
  };
}

const pick = (obj: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  return undefined;
};

// מפענח את התשובה של חיפוש עסקאות. שמות השדות מבוססים על ה-API של טרנזילה ויש לאשר אותם
// מול תשובה אמיתית בהפעלה הראשונה (ראו docs/coupons-admin.md).
export function parseTransactionSearch(body: unknown, txnIndex: string): VerifyResult {
  const root = (body ?? {}) as Record<string, unknown>;
  const list = (root.transactions ?? (root.data as Record<string, unknown> | undefined)?.transactions) as unknown;
  if (!Array.isArray(list)) return { kind: 'error', reason: 'unexpected response shape' };

  const txn = list.find((t) => String(pick(t as Record<string, unknown>, ['index', 'transaction_index', 'id'])) === txnIndex) as
    Record<string, unknown> | undefined;
  if (!txn) return { kind: 'error', reason: 'transaction not found' };

  const responseCode = String(pick(txn, ['processor_response_code', 'response_code', 'Response']) ?? '');
  if (responseCode !== '000') return { kind: 'declined', reason: `response ${responseCode || 'missing'}` };

  const amountRaw = pick(txn, ['amount', 'sum', 'transaction_amount']);
  const amount = Number(amountRaw);
  const currency = CURRENCY_CODES[String(pick(txn, ['currency_code', 'currency']) ?? '')];
  if (!Number.isFinite(amount) || amount <= 0 || !currency) return { kind: 'error', reason: 'missing amount or currency' };

  // ההפניה להזמנה כפי שנשמרה אצל טרנזילה בעסקה עצמה. בלעדיה אי אפשר לקשור את העסקה להזמנה
  // (מספרי עסקאות רצים וניתנים לניחוש), ולכן חסרה = כשל סגור.
  const remarks = String(pick(txn, ['remarks', 'Remarks', 'transaction_remarks']) ?? '').trim();
  if (!remarks) return { kind: 'error', reason: 'transaction has no order reference' };

  return { kind: 'verified', amountAgorot: Math.round(amount * 100), currency, remarks };
}

export function createApiVerifier(options: {
  appKey: string;
  secret: string;
  terminal: string;
  searchUrl: string;
  fetchImpl?: typeof fetch;
}): TranzilaVerifier {
  const doFetch = options.fetchImpl ?? fetch;
  return {
    configured: true,
    async verify(txnIndex) {
      try {
        const response = await doFetch(options.searchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tranzilaAuthHeaders(options.appKey, options.secret) },
          body: JSON.stringify({ terminal_name: options.terminal, transaction_index: Number(txnIndex) }),
          signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) return { kind: 'error', reason: `tranzila api http ${response.status}` };
        return parseTransactionSearch(await response.json(), txnIndex);
      } catch (error) {
        return { kind: 'error', reason: error instanceof Error ? error.message : 'tranzila api request failed' };
      }
    }
  };
}

export function verifierFromEnv(): TranzilaVerifier {
  const appKey = process.env.TRANZILA_APP_KEY;
  const secret = process.env.TRANZILA_SECRET;
  if (!appKey || !secret) return noopVerifier;
  return createApiVerifier({
    appKey,
    secret,
    terminal: process.env.TRANZILA_TERMINAL || 'cleanfry',
    searchUrl: process.env.TRANZILA_TRANSACTIONS_SEARCH_URL || 'https://api.tranzila.com/v1/transactions'
  });
}
