import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCookieConsent,
  setCookieConsent,
  subscribeCookieConsent,
  loadMailerLiteTracking,
  loadClarityTracking,
  type CookieConsentChoice,
} from './cookieConsentStore';
import { pill } from './home/layout';

const CookieConsent = () => {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(() => getCookieConsent());

  useEffect(() => subscribeCookieConsent(setChoice), []);

  useEffect(() => {
    if (choice === 'accepted') {
      loadMailerLiteTracking();
      loadClarityTracking();
    }
  }, [choice]);

  if (choice !== null) return null;

  return (
    <div
      dir="rtl"
      role="region"
      aria-label="הסכמה לעוגיות"
      className="cf-focus cf-on-navy fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-[24px] bg-cf-navy p-5 font-display text-cf-cream shadow-2xl animate-fadeIn sm:flex-row sm:p-6"
    >
      <p className="m-0 flex-1 text-[15px] leading-relaxed text-cf-on-navy">
        אנחנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה שלכם באתר. תוכלו לקרוא עוד ב
        <Link to="/legal" className="font-bold text-cf-cream underline underline-offset-4"> מדיניות הפרטיות</Link>.
      </p>
      <div className="flex flex-shrink-0 gap-3">
        <button
          onClick={() => setCookieConsent('rejected')}
          className={`${pill} min-h-11 border-2 border-cf-on-navy/60 px-5 text-[15px] font-bold text-cf-cream`}
        >
          דחייה
        </button>
        <button
          onClick={() => setCookieConsent('accepted')}
          className={`${pill} min-h-11 bg-cf-green px-6 text-[15px] font-bold text-white hover:bg-cf-green-dark`}
        >
          אישור
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
