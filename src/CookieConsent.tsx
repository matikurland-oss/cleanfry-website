import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCookieConsent,
  setCookieConsent,
  subscribeCookieConsent,
  loadMailerLiteTracking,
  type CookieConsentChoice,
} from './cookieConsentStore';

const CookieConsent = () => {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() => getCookieConsent());

  useEffect(() => subscribeCookieConsent(setChoice), []);

  useEffect(() => {
    if (choice === 'accepted') loadMailerLiteTracking();
  }, [choice]);

  if (choice !== null) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-x-4 bottom-4 z-50 max-w-2xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn"
    >
      <p className="text-sm text-slate-200 leading-relaxed flex-1">
        אנחנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלכם באתר. תוכלו לקרוא עוד ב
        <Link to="/legal" className="underline underline-offset-4 hover:text-white"> מדיניות הפרטיות</Link>.
      </p>
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={() => setCookieConsent('rejected')}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm transition-colors"
        >
          דחייה
        </button>
        <button
          onClick={() => setCookieConsent('accepted')}
          className="px-4 py-2 rounded-xl bg-brand-blue hover:brightness-110 font-bold text-sm transition-colors"
        >
          אישור
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
