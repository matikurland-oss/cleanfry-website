import React, { useState } from 'react';
import { X } from 'lucide-react';
import { adminApi, type AdminCoupon } from './adminApi';
import { israelLocalToIso, isoToIsraelLocal } from './israelTime';

// טופס יצירה/עריכה של קופון. בעריכה הקוד מוצג לקריאה בלבד: לקוד אחר יוצרים קופון חדש.
export default function CouponForm({ coupon, onClose, onSaved }: {
  coupon: AdminCoupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(coupon?.code ?? '');
  const [label, setLabel] = useState(coupon?.label ?? '');
  const [discount, setDiscount] = useState(coupon ? String(coupon.discount_percent) : '');
  const [startsAt, setStartsAt] = useState(isoToIsraelLocal(coupon?.starts_at ?? null));
  const [expiresAt, setExpiresAt] = useState(isoToIsraelLocal(coupon?.expires_at ?? null));
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const fields = {
      label: label.trim(),
      discount_percent: Number(discount),
      starts_at: israelLocalToIso(startsAt),
      expires_at: israelLocalToIso(expiresAt)
    };
    try {
      if (coupon) {
        await adminApi.updateCoupon(coupon.id, fields);
      } else {
        await adminApi.createCoupon({ ...fields, code: code.trim().toUpperCase(), is_active: isActive });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-right';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="coupon-form-title">
      <form onSubmit={submit} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 id="coupon-form-title" className="text-xl font-black text-slate-800">{coupon ? `עריכת קופון ${coupon.code}` : 'קופון חדש'}</h2>
          <button type="button" onClick={onClose} aria-label="סגירה" className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">קוד קופון</span>
          {coupon ? (
            <div className="mt-1 p-3 rounded-xl bg-slate-100 font-mono font-bold text-slate-700" dir="ltr">{coupon.code}</div>
          ) : (
            <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} pattern="[A-Za-z0-9_\-]{2,30}"
              title="2–30 תווים: אותיות באנגלית, ספרות, מקף או קו תחתון" className={`${input} font-mono mt-1`} dir="ltr" />
          )}
          {coupon && <span className="text-xs text-slate-500">לא ניתן לשנות קוד אחרי יצירה. לקוד אחר צרו קופון חדש.</span>}
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">שם פנימי (קמפיין / שותף)</span>
          <input value={label} maxLength={100} onChange={(e) => setLabel(e.target.value)} className={`${input} mt-1`} />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">אחוז הנחה</span>
          <div className="relative mt-1">
            <input required type="number" min="0.01" max="25" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className={`${input} pl-10`} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
          </div>
          <span className="block text-xs text-slate-500">עד 25%.</span>
          {coupon && <span className="text-xs text-slate-500">שינוי האחוז חל רק על הזמנות חדשות. הזמנות ודוחות קיימים לא משתנים.</span>}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-slate-600">תחילת תוקף (אופציונלי)</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-600">תפוגה (אופציונלי)</span>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={`${input} mt-1`} />
          </label>
        </div>
        <p className="text-xs text-slate-500 -mt-2">שעון ישראל.</p>

        {!coupon && (
          <label className="flex items-center gap-2 font-bold text-slate-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
            פעיל מיד
          </label>
        )}

        {error && <p role="alert" className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 gradient-brand text-white py-3 rounded-xl font-black disabled:opacity-50">
            {saving ? 'שומר...' : 'שמירה'}
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600">ביטול</button>
        </div>
      </form>
    </div>
  );
}
