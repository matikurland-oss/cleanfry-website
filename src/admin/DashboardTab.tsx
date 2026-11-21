import React from 'react';
import { formatShekels, type AttentionOrder, type OrdersResponse, type ReportResponse, type ReportRow } from './adminApi';
import type { Period } from './PeriodPicker';
import AttentionPanel from './AttentionPanel';
import OrdersPanel from './OrdersPanel';
import { BarList, ColumnChart } from './charts';
import { activeCouponRows, couponSplit, deliverySplit, kpis, quantityDistribution, revenueByDay } from './dashboardStats';

const card = 'bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6';

const COUPON_COLUMNS: { label: string; value: (r: ReportRow) => string | number }[] = [
  { label: 'הזמנות', value: (r) => r.paid_orders },
  { label: 'מארזים', value: (r) => r.units_sold },
  { label: 'מכירות מוצרים', value: (r) => formatShekels(r.product_sales_agorot) },
  { label: 'הנחות', value: (r) => formatShekels(r.discounts_agorot) },
  { label: 'סך שנגבה', value: (r) => formatShekels(r.gross_collected_agorot) }
];

const dayLabel = (ymd: string) => `${Number(ymd.slice(8, 10))}.${Number(ymd.slice(5, 7))}`;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={card}>
      <h3 className="font-black text-slate-800 mb-4">{title}</h3>
      {children}
    </section>
  );
}

export default function DashboardTab({ period, orders, report, attention, loading, onChanged, onOpenCoupons }: {
  period: Period;
  orders: OrdersResponse | null;
  report: ReportResponse | null;
  attention: { verificationConfigured: boolean; orders: AttentionOrder[] };
  loading: boolean;
  onChanged: () => void;
  onOpenCoupons: () => void;
}) {
  const rows = report?.rows ?? [];
  const list = orders?.orders ?? [];
  const k = orders ? kpis(orders, rows) : null;

  const days = revenueByDay(list, period.from, period.to);
  const split = couponSplit(rows);
  const delivery = deliverySplit(list);
  const quantities = quantityDistribution(list);
  const couponRows = activeCouponRows(rows);
  const hasSales = (k?.orders ?? 0) > 0;

  return (
    <div className="space-y-5">
      <AttentionPanel orders={attention.orders} verificationConfigured={attention.verificationConfigured} onChanged={onChanged} />

      <section aria-label="נתוני התקופה" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          ['סה"כ הכנסות', k ? formatShekels(k.revenue_agorot) : '—', 'מוצרים + משלוח'],
          ['הזמנות', k ? String(k.orders) : '—', 'ששולמו או אושרו'],
          ['מארזים שנמכרו', k ? String(k.units) : '—', ''],
          ['ממוצע להזמנה', k && k.orders > 0 ? formatShekels(k.average_agorot) : '—', ''],
          ['סך הנחות', k ? formatShekels(k.discounts_agorot) : '—', 'מקופונים'],
          ['עמלות משפיעניות', k ? formatShekels(k.commission_agorot) : '—', 'על מכירות מוצרים, בלי משלוח']
        ].map(([label, value, hint]) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 min-w-0">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="text-xl sm:text-2xl font-black text-slate-800 tabular-nums mt-1 truncate">{loading ? '…' : value}</p>
            {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
          </div>
        ))}
      </section>

      {!loading && hasSales && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ChartCard title="הכנסות לפי יום">
              <ColumnChart label="הכנסות לפי יום" format={formatShekels}
                data={days.map((d) => ({
                  key: d.day, label: dayLabel(d.day), value: d.total_agorot,
                  title: `${dayLabel(d.day)}: ${formatShekels(d.total_agorot)} (${d.orders} הזמנות)`
                }))} />
            </ChartCard>
          </div>
          <ChartCard title="כמה מארזים בהזמנה">
            <BarList label="התפלגות כמויות להזמנה"
              data={quantities.map((q) => ({ key: q.label, label: q.label === 'אחר' ? 'אחר' : `${q.label} יח׳`, value: q.count, display: `${q.count} הזמנות` }))} />
          </ChartCard>
          <div className="space-y-5">
            <ChartCard title="עם קופון מול בלי קופון">
              <BarList label="הכנסות עם קופון ובלי קופון" data={[
                { key: 'with', label: 'עם קופון', value: split.withCoupon.total_agorot, display: `${formatShekels(split.withCoupon.total_agorot)} · ${split.withCoupon.orders}` },
                { key: 'without', label: 'בלי קופון', value: split.without.total_agorot, display: `${formatShekels(split.without.total_agorot)} · ${split.without.orders}` }
              ]} />
              <p className="text-[11px] text-slate-400 mt-2">סך שנגבה · מספר הזמנות</p>
            </ChartCard>
            <ChartCard title="משלוח מול איסוף">
              <BarList label="הזמנות במשלוח ובאיסוף" data={[
                { key: 'delivery', label: 'משלוח', value: delivery.delivery.orders, display: `${delivery.delivery.orders} · ${formatShekels(delivery.delivery.total_agorot)}` },
                { key: 'pickup', label: 'איסוף', value: delivery.pickup.orders, display: `${delivery.pickup.orders} · ${formatShekels(delivery.pickup.total_agorot)}` }
              ]} />
              <p className="text-[11px] text-slate-400 mt-2">מספר הזמנות · סך שנגבה</p>
            </ChartCard>
          </div>
        </div>
      )}

      {!loading && couponRows.length > 0 && (
        <section className={card}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 className="text-xl font-black text-slate-800">ביצועי קופונים</h2>
            <button type="button" onClick={onOpenCoupons} className="text-sm font-bold text-blue-600 hover:underline">לפירוט המלא בטאב קופונים ←</button>
          </div>
          <ul className="space-y-2 md:hidden">
            {couponRows.map((r) => (
              <li key={r.coupon_id ?? 'none'} className={`border rounded-2xl p-3 ${r.coupon_id ? 'border-slate-100' : 'border-dashed border-slate-300 bg-slate-50'}`}>
                {r.coupon_id
                  ? <button type="button" onClick={onOpenCoupons} className="font-mono font-black hover:underline" dir="ltr">{r.coupon_code}</button>
                  : <p className="font-black">ללא קופון</p>}
                <dl className="grid grid-cols-3 gap-2 text-sm mt-1">
                  {COUPON_COLUMNS.map((c) => (
                    <div key={c.label}><dt className="text-slate-400 text-xs">{c.label}</dt><dd className="font-bold tabular-nums">{c.value(r)}</dd></div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <table className="hidden md:table w-full text-sm text-right">
            <thead className="text-slate-500 border-b">
              <tr>
                <th className="py-2 px-2 font-bold">קופון</th>
                {COUPON_COLUMNS.map((c) => <th key={c.label} className="py-2 px-2 font-bold whitespace-nowrap">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {couponRows.map((r) => (
                <tr key={r.coupon_id ?? 'none'} className={`border-b border-slate-50 ${r.coupon_id ? 'hover:bg-slate-50' : 'bg-slate-50'}`}>
                  <td className="py-2.5 px-2 font-black whitespace-nowrap">
                    {r.coupon_id
                      ? <button type="button" onClick={onOpenCoupons} className="font-mono hover:underline" dir="ltr">{r.coupon_code}</button>
                      : 'ללא קופון'}
                  </td>
                  {COUPON_COLUMNS.map((c) => <td key={c.label} className="py-2.5 px-2 font-bold tabular-nums">{c.value(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <OrdersPanel data={orders} loading={loading} onChanged={onChanged} initialLimit={10} />
    </div>
  );
}
