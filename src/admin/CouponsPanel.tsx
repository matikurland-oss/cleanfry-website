import React, { useMemo, useState } from 'react';
import { Pause, Pencil, Play, Plus, Search } from 'lucide-react';
import { adminApi, formatShekels, type AdminCoupon, type CouponState } from './adminApi';
import { formatIsraelDateTime } from './israelTime';
import CouponForm from './CouponForm';

const STATE_LABELS: Record<CouponState, { label: string; className: string }> = {
  active: { label: 'פעיל', className: 'bg-green-100 text-green-700' },
  paused: { label: 'מושהה', className: 'bg-slate-200 text-slate-700' },
  not_started: { label: 'טרם התחיל', className: 'bg-blue-100 text-blue-700' },
  expired: { label: 'פג תוקף', className: 'bg-red-100 text-red-700' }
};

type SortKey = 'paid_orders' | 'gross_collected_agorot' | 'created_at';

export default function CouponsPanel({ coupons, loading, onChanged }: {
  coupons: AdminCoupon[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<CouponState | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('paid_orders');
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons
      .filter((c) => stateFilter === 'all' || c.state === stateFilter)
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q))
      .sort((a, b) => sortKey === 'created_at'
        ? b.created_at.localeCompare(a.created_at)
        : (b[sortKey] - a[sortKey]) || b.gross_collected_agorot - a.gross_collected_agorot);
  }, [coupons, search, stateFilter, sortKey]);

  const toggleActive = async (coupon: AdminCoupon) => {
    if (coupon.is_active && !window.confirm(`להשהות את הקופון ${coupon.code}? הזמנות חדשות לא יוכלו להשתמש בו.`)) return;
    setBusyId(coupon.id);
    setError('');
    try {
      await adminApi.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusyId('');
    }
  };

  const actions = (c: AdminCoupon) => (
    <div className="flex gap-2">
      <button onClick={() => setEditing(c)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700">
        <Pencil size={14} /> עריכה
      </button>
      <button onClick={() => toggleActive(c)} disabled={busyId === c.id}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 ${c.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
        {c.is_active ? <><Pause size={14} /> השהיה</> : <><Play size={14} /> הפעלה</>}
      </button>
    </div>
  );

  const badge = (state: CouponState) => (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${STATE_LABELS[state].className}`}>{STATE_LABELS[state].label}</span>
  );

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-black text-slate-800">קופונים</h2>
        <button onClick={() => setEditing('new')} className="flex items-center gap-1 gradient-brand text-white px-4 py-2.5 rounded-xl font-black shadow-md">
          <Plus size={18} /> קופון חדש
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl">
        השהיה חוסמת יצירת הזמנות חדשות עם הקופון. היא לא מבטלת תשלומים שכבר נפתחו: לקוח שכבר הגיע לטופס התשלום
        מקבל את המחיר שנקבע לו למשך עד 15 דקות.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי קוד או שם"
            className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-500" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as CouponState | 'all')} aria-label="סינון לפי מצב"
          className="p-2.5 rounded-xl border border-slate-200 bg-white">
          <option value="all">כל המצבים</option>
          {(Object.keys(STATE_LABELS) as CouponState[]).map((s) => <option key={s} value={s}>{STATE_LABELS[s].label}</option>)}
        </select>
        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="מיון"
          className="p-2.5 rounded-xl border border-slate-200 bg-white">
          <option value="paid_orders">מיון: רכישות</option>
          <option value="gross_collected_agorot">מיון: הכנסות</option>
          <option value="created_at">מיון: חדשים קודם</option>
        </select>
      </div>

      {error && <p role="alert" className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl mb-3">{error}</p>}
      {loading && <p className="text-slate-500 text-sm py-6 text-center">טוען...</p>}
      {!loading && visible.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">אין קופונים להצגה.</p>}

      {/* מובייל: כרטיסים */}
      <div className="space-y-3 md:hidden">
        {visible.map((c) => (
          <div key={c.id} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-black text-slate-800" dir="ltr">{c.code}</span>
              {badge(c.state)}
            </div>
            {c.label && <p className="text-sm text-slate-500">{c.label}</p>}
            <dl className="grid grid-cols-2 gap-2 text-sm my-3">
              <div><dt className="text-slate-400 text-xs">הנחה</dt><dd className="font-bold">{c.discount_percent}%</dd></div>
              <div><dt className="text-slate-400 text-xs">הזמנות ששולמו</dt><dd className="font-bold">{c.paid_orders}</dd></div>
              <div><dt className="text-slate-400 text-xs">הכנסות</dt><dd className="font-bold">{formatShekels(c.gross_collected_agorot)}</dd></div>
              <div><dt className="text-slate-400 text-xs">תוקף</dt><dd className="text-xs">{formatIsraelDateTime(c.starts_at)} – {formatIsraelDateTime(c.expires_at)}</dd></div>
            </dl>
            {actions(c)}
          </div>
        ))}
      </div>

      {/* דסקטופ: טבלה */}
      {!loading && visible.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-slate-500 border-b">
              <tr>
                <th className="py-2 px-2 font-bold">קוד</th>
                <th className="py-2 px-2 font-bold">שם פנימי</th>
                <th className="py-2 px-2 font-bold">הנחה</th>
                <th className="py-2 px-2 font-bold">מצב</th>
                <th className="py-2 px-2 font-bold">התחלה</th>
                <th className="py-2 px-2 font-bold">תפוגה</th>
                <th className="py-2 px-2 font-bold">הזמנות ששולמו</th>
                <th className="py-2 px-2 font-bold">הכנסות</th>
                <th className="py-2 px-2 font-bold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="py-3 px-2 font-mono font-black" dir="ltr">{c.code}</td>
                  <td className="py-3 px-2 text-slate-600">{c.label || '—'}</td>
                  <td className="py-3 px-2 font-bold tabular-nums">{c.discount_percent}%</td>
                  <td className="py-3 px-2">{badge(c.state)}</td>
                  <td className="py-3 px-2 text-xs text-slate-500">{formatIsraelDateTime(c.starts_at)}</td>
                  <td className="py-3 px-2 text-xs text-slate-500">{formatIsraelDateTime(c.expires_at)}</td>
                  <td className="py-3 px-2 font-bold tabular-nums">{c.paid_orders}</td>
                  <td className="py-3 px-2 font-bold tabular-nums">{formatShekels(c.gross_collected_agorot)}</td>
                  <td className="py-3 px-2">{actions(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CouponForm
          coupon={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </section>
  );
}
