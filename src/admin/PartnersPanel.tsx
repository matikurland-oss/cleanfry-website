import React, { useState } from 'react';
import { Check, Copy, Pause, Pencil, Play, Plus, X } from 'lucide-react';
import { adminApi, formatShekels, type AdminCoupon, type AdminPartner } from './adminApi';

// ניהול משפיעניות: יצירת משתמש, אחוז עמלה ושיוך קופונים. המשפיענית נכנסת ל-/partner ורואה רק
// כמה נמכר בקופונים שלה וכמה מגיע לה. אין לה גישה לפרטי הלקוחות.

const partnerLoginUrl = () => `${window.location.origin}/partner`;

const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

/** 14 תווים אקראיים, תמיד עם אות קטנה, אות גדולה וספרה (בלי תווים שמתבלבלים כמו l/1/O/0) */
export function generatePassword(): string {
  const all = LOWER + UPPER + DIGITS;
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(14));
    const password = Array.from(bytes, (b) => all[b % all.length]).join('');
    if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) return password;
  }
}

const loginMessage = (name: string, username: string, password: string) =>
  `היי ${name}! הנה הכניסה שלך לאזור השותפות של CleanFry, שבו אפשר לראות כמה נמכר בקופון שלך וכמה מגיע לך:\n` +
  `${partnerLoginUrl()}\nשם משתמש: ${username}\nסיסמה: ${password}`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={async () => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold">
      {copied ? <><Check size={16} /> הועתק</> : <><Copy size={16} /> העתקת הודעה לוואטסאפ</>}
    </button>
  );
}

function PartnerForm({ partner, coupons, partners, onClose, onSaved }: {
  partner: AdminPartner | null;
  coupons: AdminCoupon[];
  partners: AdminPartner[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(partner?.display_name ?? '');
  const [username, setUsername] = useState(partner?.username ?? '');
  const [password, setPassword] = useState(partner ? '' : generatePassword());
  const [commission, setCommission] = useState(partner ? String(partner.commission_percent) : '');
  const [couponIds, setCouponIds] = useState<string[]>(partner?.coupons.map((c) => c.id) ?? []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

  const ownerOf = (coupon: AdminCoupon) =>
    coupon.partner_id && coupon.partner_id !== partner?.id ? partners.find((p) => p.id === coupon.partner_id) : undefined;

  const toggleCoupon = (id: string) =>
    setCouponIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (partner) {
        const commissionChanged = Number(commission) !== partner.commission_percent;
        if (commissionChanged && !window.confirm(`לשנות את העמלה של ${partner.display_name} ל-${commission}%?\nהשינוי יחול רק על הזמנות חדשות.`)) {
          setSaving(false);
          return;
        }
        await adminApi.updatePartner(partner.id, {
          display_name: displayName.trim(),
          commission_percent: Number(commission),
          coupon_ids: couponIds,
          ...(password ? { password } : {})
        });
        onSaved();
      } else {
        const name = username.trim().toLowerCase();
        await adminApi.createPartner({
          username: name, password, display_name: displayName.trim(), commission_percent: Number(commission), coupon_ids: couponIds
        });
        setCreated({ username: name, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-right';

  if (created) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4">
          <h2 className="text-xl font-black text-slate-800">המשתמש של {displayName} מוכן</h2>
          <p className="text-sm text-slate-600">שלחו לה את פרטי הכניסה. הסיסמה לא תוצג שוב (אפשר תמיד לקבוע סיסמה חדשה בעריכה).</p>
          <pre className="bg-slate-50 rounded-xl p-4 text-sm whitespace-pre-wrap font-sans">{loginMessage(displayName, created.username, created.password)}</pre>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={loginMessage(displayName, created.username, created.password)} />
            <button type="button" onClick={onSaved} className="px-4 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-700">סגירה</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="partner-form-title">
      <form onSubmit={submit} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 id="partner-form-title" className="text-xl font-black text-slate-800">{partner ? `עריכת ${partner.display_name}` : 'משפיענית חדשה'}</h2>
          <button type="button" onClick={onClose} aria-label="סגירה" className="p-2 rounded-full hover:bg-slate-100"><X size={20} /></button>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">שם (מוצג לה בכניסה)</span>
          <input required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`${input} mt-1`} />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">שם משתמש</span>
          {partner ? (
            <div className="mt-1 p-3 rounded-xl bg-slate-100 font-mono font-bold text-slate-700" dir="ltr">{partner.username}</div>
          ) : (
            <input required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} pattern="[a-z0-9_\-]{3,30}"
              title="3–30 תווים: אותיות קטנות באנגלית, ספרות, מקף או קו תחתון" className={`${input} font-mono mt-1`} dir="ltr" />
          )}
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">{partner ? 'סיסמה חדשה (להשאיר ריק כדי לא לשנות)' : 'סיסמה'}</span>
          <div className="flex gap-2 mt-1">
            <input required={!partner} minLength={12} maxLength={72} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,72}"
              title="12 תווים לפחות, עם אות קטנה, אות גדולה וספרה באנגלית" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`${input} font-mono`} dir="ltr" autoComplete="new-password" />
            <button type="button" onClick={() => setPassword(generatePassword())} className="shrink-0 px-3 rounded-xl bg-slate-100 font-bold text-sm text-slate-700">צור סיסמה</button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-600">אחוז עמלה</span>
          <div className="relative mt-1">
            <input required type="number" min="0" max="50" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} className={`${input} pl-10`} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
          </div>
          <span className="block text-xs text-slate-500">מחושב ממכירות המוצרים אחרי ההנחה, בלי משלוח. שינוי חל רק על הזמנות חדשות.</span>
        </label>

        <fieldset>
          <legend className="text-sm font-bold text-slate-600 mb-1">הקופונים שלה</legend>
          <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
            {coupons.length === 0 && <p className="p-3 text-sm text-slate-500">אין קופונים. צרו קופון קודם.</p>}
            {coupons.map((c) => {
              const owner = ownerOf(c);
              return (
                <label key={c.id} className={`flex items-center gap-3 p-3 text-sm ${owner ? 'opacity-50' : 'cursor-pointer hover:bg-slate-50'}`}>
                  <input type="checkbox" disabled={Boolean(owner)} checked={couponIds.includes(c.id)} onChange={() => toggleCoupon(c.id)} />
                  <span className="font-mono font-bold" dir="ltr">{c.code}</span>
                  <span className="text-slate-500">{c.discount_percent}%</span>
                  {owner && <span className="text-xs text-slate-500 mr-auto">משויך ל-{owner.display_name}</span>}
                </label>
              );
            })}
          </div>
          <span className="block text-xs text-slate-500 mt-1">מכירות קודמות בקופון שעוד לא שויכו לאף אחת ייספרו לה.</span>
        </fieldset>

        {error && <p role="alert" className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>}
        <button type="submit" disabled={saving} className="w-full gradient-brand text-white py-3 rounded-xl font-black disabled:opacity-50">
          {saving ? 'שומר...' : partner ? 'שמירה' : 'יצירת משתמש'}
        </button>
      </form>
    </div>
  );
}

export default function PartnersPanel({ partners, coupons, loading, onChanged }: {
  partners: AdminPartner[];
  coupons: AdminCoupon[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<AdminPartner | 'new' | null>(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const toggleActive = async (p: AdminPartner) => {
    if (p.is_active && !window.confirm(`להשבית את ${p.display_name}? היא לא תוכל להיכנס. המכירות בקופונים שלה ימשיכו להיספר לה.`)) return;
    setBusyId(p.id);
    setError('');
    try {
      await adminApi.updatePartner(p.id, { is_active: !p.is_active });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusyId('');
    }
  };

  const actions = (p: AdminPartner) => (
    <div className="flex gap-2">
      <button onClick={() => setEditing(p)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700">
        <Pencil size={14} /> עריכה
      </button>
      <button onClick={() => toggleActive(p)} disabled={busyId === p.id}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 ${p.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
        {p.is_active ? <><Pause size={14} /> השבתה</> : <><Play size={14} /> הפעלה</>}
      </button>
    </div>
  );

  const badge = (p: AdminPartner) => (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
      {p.is_active ? 'פעילה' : 'מושבתת'}
    </span>
  );
  const codes = (p: AdminPartner) => p.coupons.length ? p.coupons.map((c) => c.code).join(', ') : '—';

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-black text-slate-800">משפיעניות</h2>
        <button onClick={() => setEditing('new')} className="flex items-center gap-1 gradient-brand text-white px-4 py-2.5 rounded-xl font-black shadow-md">
          <Plus size={18} /> משפיענית חדשה
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl">
        כל משפיענית נכנסת ל-<span dir="ltr" className="font-mono">/partner</span> ורואה רק כמה נמכר בקופונים שלה וכמה מגיע לה, בלי פרטי לקוחות.
        הנתונים כאן מצטברים מכל הזמן (לא לפי התקופה שנבחרה). נספרות רק הזמנות ששולמו.
      </p>

      {error && <p role="alert" className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl mb-3">{error}</p>}
      {loading && <p className="text-slate-500 text-sm py-6 text-center">טוען...</p>}
      {!loading && partners.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">עוד אין משפיעניות.</p>}

      <div className="space-y-3 md:hidden">
        {partners.map((p) => (
          <div key={p.id} className="border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-slate-800">{p.display_name}</span>
              {badge(p)}
            </div>
            <p className="text-sm text-slate-500 font-mono" dir="ltr">{p.username}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm my-3">
              <div><dt className="text-slate-400 text-xs">קופונים</dt><dd className="font-bold font-mono" dir="ltr">{codes(p)}</dd></div>
              <div><dt className="text-slate-400 text-xs">עמלה</dt><dd className="font-bold">{p.commission_percent}%</dd></div>
              <div><dt className="text-slate-400 text-xs">יחידות שנמכרו</dt><dd className="font-bold">{p.totals.units}</dd></div>
              <div><dt className="text-slate-400 text-xs">מגיע לה עד היום</dt><dd className="font-bold">{formatShekels(p.totals.commission_agorot)}</dd></div>
            </dl>
            {actions(p)}
          </div>
        ))}
      </div>

      {!loading && partners.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-slate-500 border-b">
              <tr>
                <th className="py-2 px-2 font-bold">שם</th>
                <th className="py-2 px-2 font-bold">שם משתמש</th>
                <th className="py-2 px-2 font-bold">קופונים</th>
                <th className="py-2 px-2 font-bold">עמלה</th>
                <th className="py-2 px-2 font-bold">הזמנות</th>
                <th className="py-2 px-2 font-bold">יחידות</th>
                <th className="py-2 px-2 font-bold">מכירות מוצרים</th>
                <th className="py-2 px-2 font-bold">מגיע לה עד היום</th>
                <th className="py-2 px-2 font-bold">מצב</th>
                <th className="py-2 px-2 font-bold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="py-3 px-2 font-black">{p.display_name}</td>
                  <td className="py-3 px-2 font-mono text-slate-600" dir="ltr">{p.username}</td>
                  <td className="py-3 px-2 font-mono" dir="ltr">{codes(p)}</td>
                  <td className="py-3 px-2 font-bold tabular-nums">{p.commission_percent}%</td>
                  <td className="py-3 px-2 tabular-nums">{p.totals.orders_count}</td>
                  <td className="py-3 px-2 tabular-nums">{p.totals.units}</td>
                  <td className="py-3 px-2 tabular-nums">{formatShekels(p.totals.sales_agorot)}</td>
                  <td className="py-3 px-2 font-black tabular-nums">{formatShekels(p.totals.commission_agorot)}</td>
                  <td className="py-3 px-2">{badge(p)}</td>
                  <td className="py-3 px-2">{actions(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PartnerForm
          partner={editing === 'new' ? null : editing}
          coupons={coupons}
          partners={partners}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChanged(); }}
        />
      )}
    </section>
  );
}
