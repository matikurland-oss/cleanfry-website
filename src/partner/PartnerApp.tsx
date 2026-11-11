// אזור המשפיעניות (/partner). נטען בטעינה עצלה. המשפיענית רואה רק סיכום מספרי של מכירות בקופונים
// שלה וכמה מגיע לה — השרת (/api/partner/summary) לא מחזיר שום פרט של לקוח.
import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { ApiError, formatShekels, partnerRequest, supabase } from '../admin/adminApi';

const PARTNER_EMAIL_DOMAIN = 'partners.cleanfry.co.il';

interface Stats { orders: number; units: number; sales_agorot: number; commission_agorot: number }
interface Summary {
  displayName: string;
  commissionPercent: number;
  coupons: { code: string; discountPercent: number; active: boolean }[];
  totals: Stats;
  months: (Stats & { month: string })[];
}

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'אזור שותפות | CleanFry';
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const login = username.trim().toLowerCase();
    const email = login.includes('@') ? login : `${login}@${PARTNER_EMAIL_DOMAIN}`;
    const { error: authError } = await supabase!.auth.signInWithPassword({ email, password });
    if (authError) setError('שם משתמש או סיסמה שגויים');
    setBusy(false);
  };

  const input = 'w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-right';
  return (
    <form onSubmit={submit} className="bg-white max-w-sm w-full mx-auto mt-16 p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
      <h1 className="text-2xl font-black text-slate-800">אזור השותפות של CleanFry</h1>
      <input type="text" required autoComplete="username" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} className={input} dir="ltr" />
      <input type="password" required autoComplete="current-password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className={input} dir="ltr" />
      {error && <p role="alert" className="text-red-600 text-sm font-bold">{error}</p>}
      <button type="submit" disabled={busy} className="w-full gradient-brand text-white py-3 rounded-xl font-black disabled:opacity-50">
        {busy ? 'מתחברת...' : 'כניסה'}
      </button>
    </form>
  );
}

function Card({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 border ${highlight ? 'gradient-brand text-white border-transparent shadow-lg' : 'bg-white border-slate-100 shadow-sm'}`}>
      <p className={`text-sm font-bold ${highlight ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      <p className="text-3xl font-black mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setSummary(await partnerRequest<Summary>('/api/partner/summary'));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true);
      else if (err instanceof ApiError && err.status === 401) await supabase!.auth.signOut();
      else setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (forbidden) {
    return (
      <div className="max-w-sm mx-auto mt-16 bg-white p-6 rounded-3xl shadow-xl text-center space-y-4">
        <p className="font-black text-lg">אין למשתמש הזה גישה לאזור השותפות.</p>
        <button onClick={() => supabase!.auth.signOut()} className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold">יציאה</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-800">{summary ? `היי ${summary.displayName} 👋` : 'אזור השותפות'}</h1>
        <button onClick={() => supabase!.auth.signOut()} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-slate-600 text-sm">
          <LogOut size={14} /> יציאה
        </button>
      </header>

      {error && <p role="alert" className="text-red-600 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}
      {!summary && !error && <p className="text-center text-slate-500 py-10">טוען...</p>}

      {summary && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-2">
            <span>
              {summary.coupons.length === 1 ? 'הקופון שלך: ' : 'הקופונים שלך: '}
              {summary.coupons.length === 0 ? '—' : summary.coupons.map((c) => (
                <span key={c.code} className="inline-flex items-center gap-1 ml-2">
                  <span className="font-mono font-black text-slate-800" dir="ltr">{c.code}</span>
                  <span className="text-slate-400">({c.discountPercent}% הנחה{c.active ? '' : ', לא פעיל כרגע'})</span>
                </span>
              ))}
            </span>
            <span>העמלה שלך: <b className="text-slate-800">{summary.commissionPercent}%</b> ממכירות המוצרים</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card label="מגיע לך עד היום" value={formatShekels(summary.totals.commission_agorot)} highlight />
            <Card label="יחידות שנמכרו" value={summary.totals.units.toLocaleString('he-IL')} />
            <Card label="הזמנות" value={summary.totals.orders.toLocaleString('he-IL')} />
          </div>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <h2 className="text-lg font-black text-slate-800 mb-3">לפי חודשים</h2>
            {summary.months.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">עוד אין מכירות בקופון. ברגע שתהיה רכישה היא תופיע כאן.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-slate-500 border-b">
                    <tr>
                      <th className="py-2 px-2 font-bold">חודש</th>
                      <th className="py-2 px-2 font-bold">הזמנות</th>
                      <th className="py-2 px-2 font-bold">יחידות</th>
                      <th className="py-2 px-2 font-bold hidden sm:table-cell">מכירות מוצרים</th>
                      <th className="py-2 px-2 font-bold">מגיע לך</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.months.map((m) => (
                      <tr key={m.month} className="border-b border-slate-50">
                        <td className="py-3 px-2 font-bold">{monthLabel(m.month)}</td>
                        <td className="py-3 px-2 tabular-nums">{m.orders}</td>
                        <td className="py-3 px-2 tabular-nums">{m.units}</td>
                        <td className="py-3 px-2 tabular-nums hidden sm:table-cell">{formatShekels(m.sales_agorot)}</td>
                        <td className="py-3 px-2 font-black tabular-nums">{formatShekels(m.commission_agorot)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-4">
              נספרות רק הזמנות ששולמו. העמלה מחושבת ממחיר המוצרים אחרי ההנחה, בלי דמי משלוח.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

export default function PartnerApp() {
  useNoIndex();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      {!supabase ? (
        <p className="max-w-md mx-auto mt-16 bg-white p-6 rounded-3xl shadow text-center font-bold">האזור לא זמין כרגע.</p>
      ) : !ready ? (
        <p className="text-center mt-16 text-slate-500">טוען...</p>
      ) : session ? (
        <Dashboard key={session.user.id} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
