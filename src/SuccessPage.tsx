import React from 'react';
import { Link } from 'react-router-dom';

const SuccessPage = () => {
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
              className="h-10 w-10 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-4xl font-extrabold text-slate-950 mb-4 font-sans tracking-tight">
            ההודעה נשלחה בהצלחה!
          </h1>
          
          <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-md mx-auto">
            תודה רבה שיצרתם איתנו קשר. קיבלנו את הפרטים שלכם, ונציג של <span className="font-semibold text-brand-blue">CleanFry</span> יחזור אליכם בהקדם האפשרי עם תשובה.
          </p>

          {/* כפתור חזרה לדף הבית */}
          <Link 
            to="/" 
            className="inline-block bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            חזרה לדף הבית
          </Link>
        </div>

        {/* פוטר קטן */}
        <div className="mt-16 text-slate-400 text-sm">
          © 2026 CleanFry. כל הזכויות שמורות.
        </div>

      </div>
    </div>
  );
};

export default SuccessPage;
