// API דוח ביצועי קופונים (מנהלים בלבד).
//   GET ?from=YYYY-MM-DD&to=YYYY-MM-DD  — תאריכים בלוח השנה הישראלי, כולל שני הקצוות.
// נספרות רק הזמנות שהתשלום שלהן אומת מול טרנזילה, לפי מועד התשלום.
import { requireAdmin } from '../_lib/adminAuth.js';
import { validatePeriod } from '../_lib/adminValidation.js';
import { deps } from '../_lib/deps.js';
import { queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js';

// אין עדיין מקור מאומת לנתוני החזרים (לא מטרנזילה ולא ממקור אחר). כל עוד זה false, הממשק מציג
// "לא זמין" במקום אפס שלא נבדק.
export const REFUNDS_SOURCE_AVAILABLE = false;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const period = validatePeriod(queryParam(req, 'from'), queryParam(req, 'to'));
  if (period.ok === false) {
    res.status(400).json({ error: period.error });
    return;
  }

  try {
    const rows = await deps().store.couponReport(period.value.from, period.value.to);
    res.status(200).json({
      from: period.value.from,
      to: period.value.to,
      timezone: 'Asia/Jerusalem',
      refundsAvailable: REFUNDS_SOURCE_AVAILABLE,
      rows: rows.map((r) => ({
        ...r,
        refunds_agorot: REFUNDS_SOURCE_AVAILABLE ? r.refunds_agorot : null,
        net_collected_agorot: REFUNDS_SOURCE_AVAILABLE ? r.gross_collected_agorot - r.refunds_agorot : null
      }))
    });
  } catch {
    res.status(500).json({ error: 'שגיאת שרת, נסו שוב' });
  }
}
