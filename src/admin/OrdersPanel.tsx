import React, { useState } from 'react';
import { adminApi, confirmSaleQuestion, formatShekels, type AdminOrder, type OrdersResponse } from './adminApi';
import { formatIsraelDateTime } from './israelTime';

const PICKUP_NAMES = { 'kfar-saba': 'כפר סבא', 'tel-aviv': 'תל אביב' } as const;

const deliveryLabel = (o: AdminOrder) =>
  o.delivery_method === 'pickup'
    ? `איסוף עצמי – ${o.pickup_location ? PICKUP_NAMES[o.pickup_location] : ''}`
    : `משלוח עד הבית${o.shipping_city ? ` (${o.shipping_city})` : ''}`;

const shippingCost = (o: AdminOrder) =>
  o.delivery_method === 'pickup' ? '—' : o.shipping_agorot === 0 ? 'חינם' : formatShekels(o.shipping_agorot);

function Status({ order, busy, onConfirm }: { order: AdminOrder; busy: boolean; onConfirm: () => void }) {
  if (order.payment_status === 'paid') {
    return order.manually_confirmed
      ? <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">אושר ידנית</span>
      : <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full whitespace-nowrap">שולם ✓</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap">ממתין לאישור</span>
      <button onClick={onConfirm} disabled={busy}
        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold disabled:opacity-50 whitespace-nowrap">
        {busy ? 'מאשר...' : 'אישור מכירה'}
      </button>
    </div>
  );
}

export default function OrdersPanel({ data, loading, onChanged }: {
  data: OrdersResponse | null;
  loading: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const orders = data?.orders ?? [];

  const confirmSale = async (o: AdminOrder) => {
    if (!window.confirm(confirmSaleQuestion(o.public_ref, o.total_agorot))) return;
    setBusy(o.id);
    setMessage('');
    try {
      await adminApi.confirmPayment(o.id);
      setMessage(`הזמנה ${o.public_ref} אושרה ונספרת בדוחות`);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy('');
    }
  };

  const t = data?.totals;
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <h2 className="text-xl font-black text-slate-800 mb-2">הזמנות</h2>
      <ul className="text-xs text-slate-500 mb-4 space-y-1 bg-slate-50 p-3 rounded-xl list-disc pr-5">
        <li>מוצגות הזמנות ששולמו בתקופה, והזמנות שממתינות לאישור שלך. הזמנות שלא הגיעו לתשלום לא מוצגות.</li>
        <li>"אישור מכירה": אחרי שבדקת בממשק של טרנזילה שהעסקה עברה. ההזמנה תיספר בדוחות. לא יישלח מייל ללקוח.</li>
        <li>עלות מוצרים היא אחרי הנחת קופון. הסיכום כולל רק הזמנות ששולמו או אושרו.</li>
      </ul>

      {message && <p role="status" className="text-sm font-bold mb-3">{message}</p>}
      {loading && <p className="text-slate-500 text-sm py-6 text-center">טוען...</p>}
      {!loading && orders.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">אין הזמנות בתקופה שנבחרה.</p>}

      {!loading && t && (t.orders > 0 || (data?.pending.orders ?? 0) > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {[
            ['מכירות', `${t.orders} (${t.delivery_orders} משלוח · ${t.pickup_orders} איסוף)`],
            ['מארזים', String(t.quantity)],
            ['עלות מוצרים', formatShekels(t.products_agorot)],
            ['עלות משלוחים', formatShekels(t.shipping_agorot)],
            ['סה"כ', formatShekels(t.total_agorot)]
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-black tabular-nums">{value}</p>
            </div>
          ))}
          {data!.pending.orders > 0 && (
            <p className="col-span-2 sm:col-span-5 text-sm font-bold text-amber-800 bg-amber-50 p-2 rounded-xl">
              {data!.pending.orders} הזמנות ממתינות לאישור ({formatShekels(data!.pending.total_agorot)}). הן לא כלולות בסיכום.
            </p>
          )}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="space-y-3 md:hidden">
            {orders.map((o) => (
              <div key={o.id} className={`border rounded-2xl p-4 ${o.payment_status === 'paid' ? 'border-slate-100' : 'border-amber-200 bg-amber-50/40'}`}>
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-black"><bdi className="font-mono">{o.public_ref}</bdi> · {o.customer_name}</p>
                    <p className="text-xs text-slate-500"><span dir="ltr">{o.customer_phone}</span> · {formatIsraelDateTime(o.paid_at ?? o.created_at)}</p>
                  </div>
                  <Status order={o} busy={busy === o.id} onConfirm={() => confirmSale(o)} />
                </div>
                <p className="text-sm mt-2">{deliveryLabel(o)}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div><dt className="text-slate-400 text-xs">כמות</dt><dd className="font-bold tabular-nums">{o.quantity}</dd></div>
                  <div><dt className="text-slate-400 text-xs">עלות מוצרים</dt><dd className="font-bold tabular-nums">{formatShekels(o.products_agorot)}</dd></div>
                  <div><dt className="text-slate-400 text-xs">עלות משלוח</dt><dd className="font-bold tabular-nums">{shippingCost(o)}</dd></div>
                  <div><dt className="text-slate-400 text-xs">סה"כ</dt><dd className="font-bold tabular-nums">{formatShekels(o.total_agorot)}</dd></div>
                </dl>
                {o.coupon_code && <p className="text-xs text-slate-500 mt-1">קופון <bdi className="font-mono">{o.coupon_code}</bdi> (הנחה {formatShekels(o.discount_agorot)})</p>}
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-slate-500 border-b">
                <tr>
                  {['הזמנה', 'תאריך', 'לקוח', 'סטטוס', 'משלוח / איסוף', 'כמות', 'עלות מוצרים', 'עלות משלוח', 'סה"כ'].map((h) => (
                    <th key={h} className="py-2 px-2 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={`border-b border-slate-50 align-top ${o.payment_status === 'paid' ? '' : 'bg-amber-50/40'}`}>
                    <td className="py-3 px-2">
                      <bdi className="font-mono font-black">{o.public_ref}</bdi>
                      {o.coupon_code && <span className="block text-xs text-slate-500">קופון <bdi className="font-mono">{o.coupon_code}</bdi></span>}
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-500 whitespace-nowrap">{formatIsraelDateTime(o.paid_at ?? o.created_at)}</td>
                    <td className="py-3 px-2">
                      {o.customer_name}
                      <span className="block text-xs text-slate-500" dir="ltr">{o.customer_phone}</span>
                    </td>
                    <td className="py-3 px-2"><Status order={o} busy={busy === o.id} onConfirm={() => confirmSale(o)} /></td>
                    <td className="py-3 px-2">{deliveryLabel(o)}</td>
                    <td className="py-3 px-2 font-bold tabular-nums">{o.quantity}</td>
                    <td className="py-3 px-2 font-bold tabular-nums">
                      {formatShekels(o.products_agorot)}
                      {o.discount_agorot > 0 && <span className="block text-xs text-slate-500 font-normal">הנחה {formatShekels(o.discount_agorot)}</span>}
                    </td>
                    <td className="py-3 px-2 font-bold tabular-nums">{shippingCost(o)}</td>
                    <td className="py-3 px-2 font-black tabular-nums">{formatShekels(o.total_agorot)}</td>
                  </tr>
                ))}
              </tbody>
              {t && t.orders > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-black bg-slate-50">
                    <td className="py-3 px-2" colSpan={5}>סה"כ מכירות ({t.orders})</td>
                    <td className="py-3 px-2 tabular-nums">{t.quantity}</td>
                    <td className="py-3 px-2 tabular-nums">{formatShekels(t.products_agorot)}</td>
                    <td className="py-3 px-2 tabular-nums">{formatShekels(t.shipping_agorot)}</td>
                    <td className="py-3 px-2 tabular-nums">{formatShekels(t.total_agorot)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </section>
  );
}
