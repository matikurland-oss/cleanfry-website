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

// קופון בדיקות זמני בלבד — מקבע את שורת המוצר ל-0.5 ש"ח ואת המשלוח ל-0.5 ש"ח (סה"כ 1 ש"ח),
// ללא קשר לכמות או לשיטת המשלוח. להסיר לפני עלייה לפרודקשן!
const TEST_FIXED_COUPON = 'TESTMIN1';
const TEST_FIXED_PRICING = { product: 0.5, shipping: 0.5 };

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

  if (code === TEST_FIXED_COUPON) {
    res.status(200).json({ valid: true, code, testFixed: TEST_FIXED_PRICING });
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
