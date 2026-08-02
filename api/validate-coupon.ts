// פונקציית Serverless של Vercel: מאמתת קוד קופון בצד השרת בלבד.
// רשימת הקודים ואחוזי ההנחה חיים אך ורק ב-Vercel Edge Config (מנוהל מהדשבורד של Vercel,
// בלי לגעת בקוד) — כך שאי אפשר לגלות אותם על ידי קריאת קוד ה-JS הציבורי של האתר.
// אין רשימת גיבוי בקוד בכוונה: ניהול הקופונים קורה אך ורק דרך Vercel.
import { get } from '@vercel/edge-config';

interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false, message: 'Method not allowed' });
    return;
  }

  const body = (req.body ?? {}) as { code?: unknown };
  const code = typeof body.code === 'string' ? body.code.toUpperCase().trim() : '';

  if (!code) {
    res.status(400).json({ valid: false, message: 'קוד קופון לא תקין' });
    return;
  }

  let coupons: Record<string, number> | undefined;
  try {
    coupons = await get<Record<string, number>>('coupons');
  } catch (error) {
    res.status(200).json({ valid: false, message: 'שגיאה זמנית באימות הקופון, נסו שוב' });
    return;
  }

  const discountPercent = coupons?.[code];
  if (!discountPercent) {
    res.status(200).json({ valid: false, message: 'קוד קופון לא תקין' });
    return;
  }

  res.status(200).json({ valid: true, code, discountPercent });
}
