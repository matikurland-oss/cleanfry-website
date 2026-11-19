import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react'; // ייבוא אייקונים מעוצבים
import { CheckIcon } from './home/icons';
import { btnOutline, btnPrimary, notice, pageShell, pageTitle } from './home/layout';

const SuccessPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isOrder = params.get('type') === 'order'; // בדיקה האם הגענו מרכישה או מצור קשר

  return (
    <div className={pageShell}>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-[28px] border border-cf-border bg-white p-[clamp(28px,5vw,56px)] text-center md:rounded-[36px]">

        {/* אייקון וי ירוק */}
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cf-green-light text-cf-green" aria-hidden="true">
          <CheckIcon size={40} />
        </span>

        {/* כותרת משתנה בהתאם למצב */}
        <h1 className={pageTitle}>
          {isOrder ? "התשלום בוצע בהצלחה!" : "ההודעה נשלחה בהצלחה!"}
        </h1>

        {/* טקסט משתנה בהתאם למצב */}
        {isOrder ? (
          <div className="flex w-full max-w-md flex-col gap-4 text-lg leading-relaxed text-cf-body">
            <p className="m-0">
              תודה רבה על הרכישה! הזמנתך נקלטה בהצלחה במערכת ואישור מפורט נשלח אליך במייל.
            </p>
            <div className={`${notice.info} space-y-1.5 text-right`}>
              <p className="mb-2 mt-0 font-extrabold">מה קורה עכשיו?</p>
              <p className="m-0">• <span className="font-bold">במשלוח:</span> החבילה תיארז ותצא אליך בתוך 3-5 ימי עסקים.</p>
              <p className="m-0">• <span className="font-bold">באיסוף עצמי:</span> נתקשר אליך בקרוב לתיאום נקודת האיסוף הנוחה לך (ת"א או כפר סבא).</p>
            </div>
          </div>
        ) : (
          <p className="m-0 max-w-md text-lg leading-relaxed text-cf-body">
            תודה רבה שיצרתם איתנו קשר. קיבלנו את הפרטים שלכם, ונציג של <span className="font-bold text-cf-green-dark">CleanFry</span> יחזור אליכם בהקדם האפשרי עם תשובה.
          </p>
        )}

        {/* הצגת רשתות חברתיות רק לאחר רכישה מוצלחת */}
        {isOrder && (
          <div className="w-full border-t border-cf-border pt-6">
            <p className="mb-4 mt-0 text-[15px] font-bold">הצטרפו לקהילת הטיגון הנקי שלנו ברשתות:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://www.instagram.com/cleanfry_official/" target="_blank" rel="noopener noreferrer" className={`${btnOutline} gap-2`}>
                <Instagram size={18} aria-hidden="true" />
                <span>אינסטגרם</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61574285984183" target="_blank" rel="noopener noreferrer" className={`${btnOutline} gap-2`}>
                <Facebook size={18} aria-hidden="true" />
                <span>פייסבוק</span>
              </a>
            </div>
          </div>
        )}

        {/* כפתור חזרה לדף הבית */}
        <Link to="/" className={btnPrimary}>
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
