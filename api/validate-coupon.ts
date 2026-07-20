// פונקציית Serverless של Vercel: מאמתת קוד קופון בצד השרת בלבד.
// רשימת הקודים ואחוזי ההנחה חיים כאן ולא בבנדל של הלקוח — כך שאי אפשר לגלות אותם
// על ידי קריאת קוד ה-JS הציבורי של האתר, ואי אפשר "לשכנע" את הדפדפן שקוד לא תקין הוא תקין.
interface VercelRequest {
  method?: string;
  body?: unknown;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
}

const COUPONS: Record<string, number> = {
  CLEAN20: 0.20,
  SAVE20: 0.20,
  FIRST15: 0.15,
  ROTEM: 0.15,
  CLEAN10: 0.10,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
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

  const discountPercent = COUPONS[code];
  if (!discountPercent) {
    res.status(200).json({ valid: false, message: 'קוד קופון לא תקין' });
    return;
  }

  res.status(200).json({ valid: true, code, discountPercent });
}
