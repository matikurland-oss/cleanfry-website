import React, { useState } from 'react';
import { adminApi, formatShekels, type AttentionOrder } from './adminApi';
import { formatIsraelDateTime } from './israelTime';

function reasons(o: AttentionOrder): string[] {
  const list: string[] = [];
  if (o.payment_status === 'awaiting_verification') list.push('ממתין לאימות מול טרנזילה');
  if (o.payment_status === 'amount_mismatch') list.push('הסכום שחויב שונה מסכום ההזמנה');
  if (o.paid_after_expiry) list.push('שולם אחרי פקיעת המחיר (15 דקות)');
  if (o.duplicate_payment) list.push('התקבל יותר מתשלום אחד');
  if (o.payment_status === 'paid' && !o.email_sent) list.push(`מייל אישור לא נשלח (${o.email_attempts} ניסיונות)`);
  return list;
}

export default function AttentionPanel({ orders, verificationConfigured, onChanged }: {
  orders: AttentionOrder[];
  verificationConfigured: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  if (orders.length === 0 && verificationConfigured) return null;

  const resend = async (id: string) => {
    setBusy(id);
    setMessage('');
    try {
      await adminApi.resendEmail(id);
      setMessage('המייל נשלח');
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border-2 border-amber-200 p-4 sm:p-6">
      <h2 className="text-xl font-black text-slate-800 mb-2">דורש תשומת לב</h2>
      {!verificationConfigured && (
        <p className="text-sm font-bold text-amber-800 bg-amber-50 p-3 rounded-xl mb-3">
          מפתחות ה-API של טרנזילה לא הוגדרו, ולכן לא ניתן לאמת תשלומים אוטומטית. הזמנות "ממתינות לאימות" לא נספרות
          בדוחות עד שהמפתחות יוגדרו (האימות ירוץ עליהן אוטומטית). בינתיים בדקו אותן מול ממשק הניהול של טרנזילה.
        </p>
      )}
      {message && <p role="status" className="text-sm font-bold mb-3">{message}</p>}
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="border border-slate-100 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div className="text-sm">
              <p className="font-black flex flex-wrap gap-x-2">
                <span>הזמנה <bdi className="font-mono">{o.public_ref}</bdi></span>
                <span>{formatShekels(o.total_agorot)}</span>
                {o.coupon_code && <span className="text-slate-500">קופון <bdi className="font-mono">{o.coupon_code}</bdi></span>}
              </p>
              <p className="text-slate-600">{o.customer_name} · <span dir="ltr">{o.customer_phone}</span> · {o.details}</p>
              <p className="text-xs text-slate-400">נוצרה {formatIsraelDateTime(o.created_at)}{o.paid_at ? ` · שולמה ${formatIsraelDateTime(o.paid_at)}` : ''}</p>
              <ul className="flex flex-wrap gap-1 mt-1">
                {reasons(o).map((r) => <li key={r} className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{r}</li>)}
              </ul>
            </div>
            {o.payment_status === 'paid' && !o.email_sent && (
              <button onClick={() => resend(o.id)} disabled={busy === o.id}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold disabled:opacity-50 whitespace-nowrap">
                שליחת מייל אישור שוב
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
