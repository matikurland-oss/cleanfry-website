// API הזמנות שדורשות תשומת לב (מנהלים בלבד).
//   GET                          הזמנות שממתינות לאימות, עם אי-התאמת סכום, תשלום כפול, תשלום אחרי
//                                פקיעת המחיר, או שמייל האישור שלהן לא נשלח.
//   POST { orderId, action: 'resend_email' }  שליחה חוזרת של מייל האישור (לא יוצרת רכישה נוספת).
import { requireAdmin } from '../_lib/adminAuth';
import { deps } from '../_lib/deps';
import { bodyObject, type ApiRequest, type ApiResponse } from '../_lib/http';
import { describeDelivery } from '../_lib/confirmationEmail';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { store, verifier, sendEmail } = deps();

  try {
    if (req.method === 'GET') {
      const orders = await store.listAttentionOrders();
      res.status(200).json({
        verificationConfigured: verifier.configured,
        orders: orders.map((o) => ({
          id: o.id,
          public_ref: o.public_ref,
          payment_status: o.payment_status,
          created_at: o.created_at,
          paid_at: o.paid_at,
          paid_after_expiry: o.paid_after_expiry,
          duplicate_payment: o.duplicate_payment,
          email_sent: Boolean(o.confirmation_email_sent_at),
          email_attempts: o.confirmation_email_attempts,
          total_agorot: o.total_agorot,
          coupon_code: o.coupon_code_snapshot,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          details: describeDelivery(o)
        }))
      });
      return;
    }

    if (req.method === 'POST') {
      const body = bodyObject(req);
      const order = typeof body.orderId === 'string' ? await store.getOrder(body.orderId) : null;
      if (!order || body.action !== 'resend_email') {
        res.status(400).json({ error: 'בקשה לא תקינה' });
        return;
      }
      if (order.payment_status !== 'paid') {
        res.status(409).json({ error: 'אפשר לשלוח אישור רק להזמנה ששולמה ואומתה' });
        return;
      }
      try {
        await sendEmail(order);
        await store.recordEmailAttempt(order.id, null);
        res.status(200).json({ ok: true });
      } catch (error) {
        await store.recordEmailAttempt(order.id, error instanceof Error ? error.message.slice(0, 200) : 'email failed');
        res.status(502).json({ error: 'שליחת המייל נכשלה, נסו שוב מאוחר יותר' });
      }
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch {
    res.status(500).json({ error: 'שגיאת שרת, נסו שוב' });
  }
}
