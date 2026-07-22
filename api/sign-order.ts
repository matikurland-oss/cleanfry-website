// פונקציית Serverless: חותמת (HMAC) את פרטי ההזמנה והסכום הצפוי לפני המעבר לתשלום.
// הטוקן החתום נשלח לטרנזילה בשדה remarks, וחוזר אלינו דרך notify_url_address (ראו tranzila-notify.ts).
// כך אפשר לאמת בדיעבד שהסכום שבאמת חויב תואם למה שההזמנה הייתה אמורה לעלות — בלי צורך במסד נתונים,
// כי כל המידע הדרוש (כולל פרטי ההזמנה לשליחת מייל האישור) נשמר בתוך הטוקן החתום עצמו.
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!SECRET) {
    res.status(500).json({ error: 'Server misconfigured: ORDER_SIGNING_SECRET is not set' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const total = Number(body.total);
  if (!Number.isFinite(total) || total <= 0) {
    res.status(400).json({ error: 'Invalid total' });
    return;
  }

  const str = (value: unknown, maxLength: number) =>
    typeof value === 'string' ? value.slice(0, maxLength) : '';

  const payload = {
    total: Math.round(total * 100) / 100,
    name: str(body.name, 60),
    phone: str(body.phone, 20),
    email: str(body.email, 80),
    method: str(body.method, 10),
    details: str(body.details, 200),
    coupon: str(body.coupon, 20),
    ts: Date.now()
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');

  res.status(200).json({ token: `${payloadB64}.${signature}` });
}
