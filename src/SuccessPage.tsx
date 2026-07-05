import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react'; // ייבוא אייקונים מעוצבים

const SuccessPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isOrder = params.get('type') === 'order'; // בדיקה האם הגענו מרכישה או מצור קשר

  return (
    <div className="bg-white min-h-screen py-16 px-4" dir="rtl">
      <div className="max-w-xl mx-auto flex flex-col items-center text-center">
        
        {/* לוגו בראש העמוד */}
        <div className="mb-12">
          <Link to="/">
            <img 
              src="/logo.png" 
              alt="CleanFry Logo" 
              className="h-24 w-auto object-contain cursor-pointer transition-opacity hover:opacity-80" 
            />
          </Link>
        </div>

        {/* מלבן התודה המעוצב */}
        <div className="bg-slate-50 p-10 md:p-12 rounded-3xl shadow-sm border border-slate-100 w-full">
          
          {/* אייקון וי ירוק ומעוצב */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-8 border-4 border-white shadow-inner">
            <svg 
              className="h-10 h-10 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* כותרת משתנה בהתאם למצב */}
          <h1 className="text-4xl font-extrabold text-slate-950 mb-4 font-sans tracking-tight">
            {isOrder ? "התשלום בוצע בהצלחה!" : "ההודעה נשלחה בהצלחה!"}
          </h1>
          
          {/* טקסט משתנה בהתאם למצב */}
          {isOrder ? (
            <div className="text-lg text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
              <p className="mb-4">
                תודה רבה על הרכישה! הזמנתך נקלטה בהצלחה במערכת ואישור מפורט נשלח אליך במייל.
              </p>
              <div className="bg-white p-4 rounded-xl border border-slate-200/60 text-right text-sm space-y-1.5">
                <p className="font-bold text-slate-800 border-b pb-1 mb-2">מה קורה עכשיו?</p>
                <p>• <span className="font-bold">במשלוח:</span> החבילה תיארז ותצא אליך בתוך 3-5 ימי עסקים.</p>
                <p>• <span className="font-bold">באיסוף עצמי:</span> נתקשר אליך בקרוב לתיאום נקודת האיסוף הנוחה לך (ת"א או כפר סבא).</p>
              </div>
            </div>
          ) : (
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-md mx-auto">
              תודה רבה שיצרתם איתנו קשר. קיבלנו את הפרטים שלכם, ונציג של <span className="font-semibold text-blue-600">CleanFry</span> יחזור אליכם בהקדם האפשרי עם תשובה.
            </p>
          )}

          {/* הצגת רשתות חברתיות רק לאחר רכישה מוצלחת */}
          {isOrder && (
            <div className="border-t border-slate-200/60 pt-6 mb-8">
              <p className="text-sm font-bold text-slate-800 mb-4">הצטרפו לקהילת הטיגון הנקי שלנו ברשתות:</p>
              <div className="flex justify-center gap-3">
                {/* אינסטגרם */}
                <a 
                  href="https://www.instagram.com/cleanfry_official/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:opacity-90 hover:scale-105 transition-all text-sm"
                >
                  <Instagram size={16} />
                  <span>אינסטגרם</span>
                </a>

                {/* פייסבוק */}
                <a 
                  href="https://www.facebook.com/profile.php?id=61574285984183" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:opacity-90 hover:scale-105 transition-all text-sm"
                >
                  <Facebook size={16} />
                  <span>פייסבוק</span>
                </a>
              </div>
            </div>
          )}

          {/* כפתור חזרה לדף הבית */}
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            חזרה לדף הבית
          </Link>
        </div>

        {/* פוטר קטן */}
        <div className="mt-16 text-slate-400 text-sm">
          © {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.
        </div>

      </div>
    </div>
  );
};

export default SuccessPage;
