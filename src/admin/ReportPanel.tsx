import React from 'react';
import { formatShekels, type ReportResponse, type ReportRow } from './adminApi';

const COLUMNS: { key: keyof ReportRow; label: string; money?: boolean }[] = [
  { key: 'paid_orders', label: 'הזמנות ששולמו' },
  { key: 'units_sold', label: 'מארזים שנמכרו' },
  { key: 'product_sales_agorot', label: 'מכירות מוצרים', money: true },
  { key: 'discounts_agorot', label: 'סך הנחות', money: true },
  { key: 'gross_collected_agorot', label: 'סך שנגבה', money: true },
  { key: 'refunds_agorot', label: 'החזרים', money: true },
  { key: 'net_collected_agorot', label: 'גבייה נטו', money: true }
];

const rowName = (r: ReportRow) => (r.coupon_id ? r.coupon_code ?? '' : 'ללא קופון');

export default function ReportPanel({ report, loading }: { report: ReportResponse | null; loading: boolean }) {
  // ברירת מחדל: לפי מספר הזמנות ששולמו (השרת כבר ממיין). "ללא קופון" מוצגת בסוף, להשוואה.
  const rows = report ? [...report.rows.filter((r) => r.coupon_id), ...report.rows.filter((r) => !r.coupon_id)] : [];
  const value = (r: ReportRow, c: (typeof COLUMNS)[number]) => {
    const v = r[c.key] as number | null;
    return c.money ? formatShekels(v) : v;
  };

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <h2 className="text-xl font-black text-slate-800 mb-2">ביצועי קופונים</h2>
      <ul className="text-xs text-slate-500 mb-4 space-y-1 bg-slate-50 p-3 rounded-xl list-disc pr-5">
        <li>נספרות רק הזמנות שהתשלום שלהן אומת מול טרנזילה או שאישרת ידנית. הזמנות ממתינות ותשלומים שנכשלו לא נספרים.</li>
        <li>רכישה משויכת לתקופה לפי מועד התשלום, לפי ימים בשעון ישראל.</li>
        <li>החזרים מוצגים עבור הרכישות שבתקופה, גם אם ההחזר בוצע מאוחר יותר.</li>
        {report && !report.refundsAvailable && (
          <li className="font-bold text-amber-700">אין עדיין מקור מאומת לנתוני החזרים, ולכן "החזרים" ו"גבייה נטו" מוצגים כ"לא זמין".</li>
        )}
        <li>הנתונים נאספים מרגע הפעלת המערכת; אין נתוני עבר.</li>
      </ul>

      {loading && <p className="text-slate-500 text-sm py-6 text-center">טוען...</p>}
      {!loading && rows.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">אין רכישות מאומתות בתקופה שנבחרה.</p>}

      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <div key={r.coupon_id ?? 'none'} className={`border rounded-2xl p-4 ${r.coupon_id ? 'border-slate-100' : 'border-dashed border-slate-300 bg-slate-50'}`}>
            <p className={`font-black ${r.coupon_id ? 'font-mono' : ''}`} dir={r.coupon_id ? 'ltr' : 'rtl'}>{rowName(r)}</p>
            {r.coupon_label && <p className="text-xs text-slate-500">{r.coupon_label}</p>}
            <dl className="grid grid-cols-2 gap-2 text-sm mt-2">
              {COLUMNS.map((c) => (
                <div key={c.key}><dt className="text-slate-400 text-xs">{c.label}</dt><dd className="font-bold tabular-nums">{value(r, c)}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {!loading && rows.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-slate-500 border-b">
              <tr>
                <th className="py-2 px-2 font-bold">קופון</th>
                {COLUMNS.map((c) => <th key={c.key} className="py-2 px-2 font-bold">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.coupon_id ?? 'none'} className={`border-b border-slate-50 ${r.coupon_id ? '' : 'bg-slate-50'}`}>
                  <td className="py-3 px-2">
                    <span className={`font-black not-italic ${r.coupon_id ? 'font-mono' : ''}`} dir={r.coupon_id ? 'ltr' : 'rtl'}>{rowName(r)}</span>
                    {r.coupon_label && <span className="block text-xs text-slate-500 not-italic">{r.coupon_label}</span>}
                  </td>
                  {COLUMNS.map((c) => <td key={c.key} className="py-3 px-2 font-bold tabular-nums">{value(r, c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
