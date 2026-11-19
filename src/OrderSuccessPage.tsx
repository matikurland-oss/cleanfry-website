import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Instagram, Facebook } from 'lucide-react';
import { CheckIcon, TruckIcon } from './home/icons';
import { btnOutline, btnPrimary, notice, pageShell, pageTitle } from './home/layout';
import { trackPendingPurchase } from './analytics';

const OrderSuccessPage = () => {
  // ננסה לבדוק אם שמרנו את שיטת המשלוח ב-sessionStorage כדי להציג מידע מותאם
  const savedMethod = sessionStorage.getItem('cleanfry_shipping_method') || 'delivery';

  // purchase ל-GA4 — פעם אחת לכל הזמנה (הפרטים נשמרו ב-CheckoutPage כשההזמנה נוצרה)
  useEffect(() => trackPendingPurchase(), []);

  // הערה: מייל אישור ההזמנה כבר לא נשלח מכאן (מהדפדפן של הלקוח) — הוא נשלח משרת לשרת
  // רק אחרי שטרנזילה מאמתת בפועל שהתשלום אושר ושהסכום תואם (ראו api/tranzila-notify.ts).
  // כך לקוח לא יכול "לשכנע" את האתר ששילם בלי שבאמת שולם.

  return (
    <div className={pageShell}>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 rounded-[28px] border border-cf-border bg-white p-[clamp(28px,5vw,48px)] text-center md:rounded-[36px]">

        {/* אייקון הצלחה */}
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-cf-green-light text-cf-green" aria-hidden="true">
          <CheckIcon size={40} />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className={pageTitle}>ההזמנה התקבלה!</h1>
          <p className="m-0 text-lg text-cf-body">תודה רבה על רכישתך. אנחנו מכינים את ההזמנה למשלוח/איסוף.</p>
        </div>

        {/* קוביית מידע משתנה לפי שיטת קבלה */}
        <div className={`${notice.info} w-full space-y-3 text-right`}>
          <p className="m-0 flex items-center gap-2 text-base font-extrabold">
            <ShoppingBag size={18} aria-hidden="true" /> מה קורה עכשיו?
          </p>

          <p className="m-0">• אישור ההזמנה וחשבונית נשלחו לכתובת המייל שלך.</p>

          {savedMethod === 'pickup' ? (
            <div className="border-t border-cf-blue/20 pt-3">
              <p className="mb-1 mt-0 flex items-center gap-1.5 font-bold">
                <MapPin size={16} className="text-cf-blue" aria-hidden="true" /> הנחיות לאיסוף עצמי:
              </p>
              <p className="m-0">המארז ממתין לך מוכן. נציג שלנו יתקשר או ישלח וואטסאפ בכדי לתאם איתך את מועד האיסוף (תל אביב או כפר סבא).</p>
            </div>
          ) : (
            <div className="border-t border-cf-blue/20 pt-3">
              <p className="mb-1 mt-0 flex items-center gap-1.5 font-bold">
                <TruckIcon size={16} className="text-cf-blue" /> עדכון משלוח:
              </p>
              <p className="m-0">צוות המחסן אורז את ההזמנה שלך. המשלוח ייצא אליך עם שליח עד הבית ויגיע תוך 3-5 ימי עסקים. תקבלו הודעת SMS כשהשליח בדרך.</p>
            </div>
          )}
        </div>

        {/* הצטרפות לקהילה / רשתות חברתיות */}
        <div className="w-full border-t border-cf-border pt-6">
          <p className="mb-4 mt-0 text-[15px] font-bold">הישארו מעודכנים בקהילת CleanFry</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.instagram.com/cleanfry_official/" target="_blank" rel="noreferrer" className={`${btnOutline} gap-2`}>
              <Instagram size={18} aria-hidden="true" /> אינסטגרם
            </a>
            <a href="https://www.facebook.com/profile.php?id=61574285984183" target="_blank" rel="noreferrer" className={`${btnOutline} gap-2`}>
              <Facebook size={18} aria-hidden="true" /> פייסבוק
            </a>
          </div>
        </div>

        <Link to="/" className={`${btnPrimary} w-full`}>
          חזרה לחנות
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
