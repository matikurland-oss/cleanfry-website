// פונקציית Serverless: ה-notify_url_address שטרנזילה קוראת לו משרת לשרת אחרי כל ניסיון עסקה.
//
// זרימה:
// 1. שומרים את האירוע (בלי פרטי כרטיס) במסד הנתונים. אם השמירה נכשלה — מחזירים 500 ולא "הצלחה",
//    כדי שהאירוע לא ייבלע. מדיניות הניסיונות החוזרים של טרנזילה אינה מתועדת, ולכן אין להסתמך עליה.
// 2. מאתרים את ההזמנה לפי ההפניה החתומה ב-remarks, ומאמתים את העסקה מול ה-API של טרנזילה
//    (ה-notify עצמו לא חתום ע"י טרנזילה, ולכן לבדו אינו הוכחה).
// 3. רושמים את התשלום באופן אטומי (record_payment) — notify כפול או מקביל נספר פעם אחת.
// 4. שולחים את מייל האישור. כשל במייל לא מבטל את הרכישה.
// אירוע שעיבודו נכשל באמצע נשאר במסד הנתונים ומעובד שוב ע"י api/cron/reconcile.
import { bodyObject, noStore, type ApiRequest, type ApiResponse } from './_lib/http';
import { deps } from './_lib/deps';
import { processPaymentEvent, sanitizeNotify } from './_lib/paymentProcessing';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false });
    return;
  }

  const event = sanitizeNotify(bodyObject(req));
  const { store } = deps();

  let eventId: string;
  try {
    eventId = await store.insertPaymentEvent(event);
  } catch {
    res.status(500).json({ ok: false, reason: 'storage unavailable' });
    return;
  }

  try {
    const result = await processPaymentEvent(eventId, event);
    res.status(200).json({ ok: true, outcome: result.outcome });
  } catch (error) {
    // האירוע כבר נשמר; הניסיון החוזר יתבצע ב-cron/reconcile
    try {
      await store.failPaymentEvent(eventId, error instanceof Error ? error.message.slice(0, 200) : 'processing failed');
    } catch {
      // גם הרישום של הכשל נכשל — האירוע עדיין מסומן כלא-מעובד ויטופל בהמשך
    }
    res.status(200).json({ ok: true, outcome: 'queued_for_retry' });
  }
}
