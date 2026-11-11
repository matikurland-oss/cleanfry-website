// אזור הניהול (/admin). נטען בטעינה עצלה, כך שקוד הניהול ו-supabase-js לא נכנסים לחבילה של האתר.
// ההגנה האמיתית היא בצד השרת: כל קריאה ל-/api/admin/* בודקת התחברות והרשאת מנהל.
import React, { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';
import { adminApi, ApiError, supabase, type AdminCoupon, type AdminPartner, type AttentionOrder, type OrdersResponse, type ReportResponse } from './adminApi';
import PeriodPicker, { presetPeriod, type Period } from './PeriodPicker';
import CouponsPanel from './CouponsPanel';
import ReportPanel from './ReportPanel';
import AttentionPanel from './AttentionPanel';
import OrdersPanel from './OrdersPanel';
import PartnersPanel from './PartnersPanel';

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'ניהול קופונים | CleanFry';
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);
}

const ADMIN_USERNAME_DOMAIN = 'cleanfry.co.il';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    // אפשר להתחבר גם עם שם משתמש: "clean" → clean@cleanfry.co.il
    const login = email.trim();
    const loginEmail = login.includes('@') ? login : `${login.toLowerCase()}@${ADMIN_USERNAME_DOMAIN}`;
    const { error: authError } = await supabase!.auth.signInWithPassword({ email: loginEmail, password });
    if (authError) setError('שם משתמש או סיסמה שגויים');
    setBusy(false);
  };

  const input = 'w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-right';
  return (
    <form onSubmit={submit} className="bg-white max-w-sm w-full mx-auto mt-16 p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
      <h1 className="text-2xl font-black text-slate-800">כניסת מנהל</h1>
      <input type="text" required autoComplete="username" placeholder="שם משתמש או אימייל" value={email} onChange={(e) => setEmail(e.target.value)} className={input} dir="ltr" />
      <input type="password" required autoComplete="current-password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className={input} dir="ltr" />
      {error && <p role="alert" className="text-red-600 text-sm font-bold">{error}</p>}
      <button type="submit" disabled={busy} className="w-full gradient-brand text-white py-3 rounded-xl font-black disabled:opacity-50">
        {busy ? 'מתחבר...' : 'כניסה'}
      </button>
    </form>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [period, setPeriod] = useState<Period>(() => presetPeriod('7days'));
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [attention, setAttention] = useState<{ verificationConfigured: boolean; orders: AttentionOrder[] }>({ verificationConfigured: true, orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, r, a, o, p] = await Promise.all([
        adminApi.listCoupons(period.from, period.to),
        adminApi.report(period.from, period.to),
        adminApi.attention(),
        adminApi.orders(period.from, period.to),
        adminApi.listPartners()
      ]);
      setCoupons(c);
      setPartners(p);
      setReport(r);
      setAttention(a);
      setOrders(o);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true);
      else if (err instanceof ApiError && err.status === 401) await supabase!.auth.signOut();
      else setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [period.from, period.to]);

  useEffect(() => { load(); }, [load]);

  if (forbidden) {
    return (
      <div className="max-w-sm mx-auto mt-16 bg-white p-6 rounded-3xl shadow-xl text-center space-y-4">
        <p className="font-black text-lg">למשתמש {session.user.email} אין הרשאת מנהל.</p>
        <button onClick={() => supabase!.auth.signOut()} className="px-6 py-3 rounded-xl bg-slate-800 text-white font-bold">יציאה</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-800">ניהול קופונים ומכירות</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500 hidden sm:inline" dir="ltr">{session.user.email}</span>
          <button onClick={() => supabase!.auth.signOut()} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 font-bold text-slate-600">
            <LogOut size={14} /> יציאה
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4">
        <p className="text-xs font-bold text-slate-500 mb-2">תקופה (שעון ישראל): {period.from} – {period.to}</p>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {error && <p role="alert" className="text-red-600 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

      <AttentionPanel orders={attention.orders} verificationConfigured={attention.verificationConfigured} onChanged={load} />
      <OrdersPanel data={orders} loading={loading} onChanged={load} />
      <CouponsPanel coupons={coupons} partners={partners} loading={loading} onChanged={load} />
      <PartnersPanel partners={partners} coupons={coupons} loading={loading} onChanged={load} />
      <ReportPanel report={report} loading={loading} />
    </div>
  );
}

export default function AdminApp() {
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
        <p className="max-w-md mx-auto mt-16 bg-white p-6 rounded-3xl shadow text-center font-bold">
          אזור הניהול לא הוגדר: חסרים VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY.
        </p>
      ) : !ready ? (
        <p className="text-center mt-16 text-slate-500">טוען...</p>
      ) : session ? (
        <Dashboard session={session} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
