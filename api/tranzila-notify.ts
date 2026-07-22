// פונקציית Serverless: זהו ה-notify_url_address שטרנזילה קוראת לו ישירות משרת לשרת (לא דרך
// הדפדפן של הלקוח) מיד אחרי כל ניסיון עסקה. זהו קו ההגנה האמיתי מול תרמית "שינוי סכום ב-DevTools":
// הלקוח יכול לשקר לדפדפן שלו, אבל לא לתקשורת הישירה בין השרתים של טרנזילה ושלנו.
//
// זרימה: לפני התשלום, sign-order.ts חותם (HMAC) את הסכום הצפוי ופרטי ההזמנה לתוך טוקן שנשלח
// לטרנזילה בשדה remarks. טרנזילה מחזירה את remarks כמות שהוא בקריאת ה-notify. כאן מאמתים:
// 1. החתימה תקפה (מוכיח שהטוקן לא זויף)
// 2. הסכום שטרנזילה מדווחת שבאמת חויב תואם לסכום החתום בטוקן
// 3. העסקה אכן אושרה (Response=000)
// רק אם כל שלושת התנאים מתקיימים — נשלח מייל אישור הזמנה אמיתי ללקוח ולבעל האתר.
import crypto from 'node:crypto';

interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

const SECRET = process.env.ORDER_SIGNING_SECRET || '';
const FORMSPREE_URL = 'https://formspree.io/f/xvzwnrla';

interface OrderPayload {
  total: number;
  name: string;
  phone: string;
  email: string;
  method: string;
  details: string;
  coupon: string;
  ts: number;
}

function verifyToken(token: string): OrderPayload | null {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as OrderPayload;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // תמיד עונים 200 לטרנזילה (גם בכשלון אימות) כדי שלא ינסו לשלוח את ה-notify שוב ושוב
  if (req.method !== 'POST') {
    res.status(200).json({ ok: false, reason: 'method' });
    return;
  }
  if (!SECRET) {
    res.status(200).json({ ok: false, reason: 'server misconfigured' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const remarksRaw = body.remarks ?? body.Remarks;
  const token = typeof remarksRaw === 'string' ? remarksRaw : '';
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(200).json({ ok: false, reason: 'invalid or missing signature' });
    return;
  }

  const responseCode = String(body.Response ?? body.response ?? body.processor_response_code ?? '');
  const isApproved = responseCode === '000';

  const chargedAmountRaw = body.sum ?? body.amount ?? body.Sum;
  const chargedAmount = Number(chargedAmountRaw);
  const amountsMatch = Number.isFinite(chargedAmount) && Math.abs(chargedAmount - payload.total) < 0.02;

  if (!isApproved || !amountsMatch) {
    res.status(200).json({ ok: false, reason: !isApproved ? 'not approved' : 'amount mismatch', expected: payload.total, charged: chargedAmountRaw });
    return;
  }

  try {
    await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "נושא": "הזמנה חדשה מאתר CleanFry (מאומתת בשרת)",
        "שם הלקוח": payload.name,
        "טלפון": payload.phone,
        "אימייל": payload.email,
        "שיטת קבלה": payload.method,
        "פרטים": payload.details,
        "קוד קופון שהופעל": payload.coupon || 'לא הוגדר קופון',
        "סה\"כ שולם (מאומת מול טרנזילה)": `₪${payload.total}`
      })
    });
  } catch (error) {
    // גם אם שליחת המייל נכשלה, העסקה עצמה תקינה ומאומתת — לא מחזירים שגיאה לטרנזילה
  }

  res.status(200).json({ ok: true });
}
