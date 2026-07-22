import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, MapPin, Truck, Instagram, Facebook } from 'lucide-react';

const OrderSuccessPage = () => {
  // ננסה לבדוק אם שמרנו את שיטת המשלוח ב-sessionStorage כדי להציג מידע מותאם
  const savedMethod = sessionStorage.getItem('cleanfry_shipping_method') || 'delivery';

  // הערה: מייל אישור ההזמנה כבר לא נשלח מכאן (מהדפדפן של הלקוח) — הוא נשלח משרת לשרת
  // רק אחרי שטרנזילה מאמתת בפועל שהתשלום אושר ושהסכום תואם (ראו api/tranzila-notify.ts).
  // כך לקוח לא יכול "לשכנע" את האתר ששילם בלי שבאמת שולם.

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
        
        {/* אייקון הצלחה חגיגי */}
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-500" size={48} />
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-3">ההזמנה התקבלה!</h1>
        <p className="text-slate-600 font-medium mb-6">תודה רבה על רכישתך. אנחנו מכינים את ההזמנה למשלוח/איסוף.</p>
        
        {/* קוביית מידע משתנה לפי שיטת קבלה */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-right text-blue-950 text-sm mb-6 space-y-3">
          <p className="font-bold flex items-center gap-2 text-base text-blue-900 mb-1">
            <ShoppingBag size={18} /> מה קורה עכשיו?
          </p>
          
          <p className="font-medium">• אישור ההזמנה וחשבונית נשלחו לכתובת המייל שלך.</p>
          
          {savedMethod === 'pickup' ? (
            <div className="pt-2 border-t border-blue-200 text-blue-900">
              <p className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                <MapPin size={16} className="text-blue-600" /> הנחיות לאיסוף עצמי:
              </p>
              <p>המארז ממתין לך מוכן. נציג שלנו יתקשר או ישלח וואטסאפ בכדי לתאם איתך את מועד האיסוף (תל אביב או כפר סבא).</p>
            </div>
          ) : (
            <div className="pt-2 border-t border-blue-200 text-blue-900">
              <p className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                <Truck size={16} className="text-blue-600" /> עדכון משלוח:
              </p>
              <p>צוות המחסן אורז את ההזמנה שלך. המשלוח ייצא אליך עם שליח עד הבית ויגיע תוך 3-5 ימי עסקים. תקבלו הודעת SMS כשהשליח בדרך.</p>
            </div>
          )}
        </div>

        {/* הצטרפות לקהילה / רשתות חברתיות */}
        <div className="border-t border-slate-100 pt-6 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">הישארו מעודכנים בקהילת CleanFry</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.instagram.com/cleanfry_official/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <Instagram size={16} /> אינסטגרם
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61574285984183" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <Facebook size={16} /> פייסבוק
            </a>
          </div>
        </div>

        <Link 
          to="/" 
          className="inline-block w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-black transition"
        >
          חזרה לחנות
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
