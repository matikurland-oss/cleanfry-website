import React from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-xl mx-auto">
        
        {/* לוגו בראש העמוד */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img 
              src="/logo.png" 
              alt="CleanFry Logo" 
              className="h-16 w-auto object-contain cursor-pointer" 
            />
          </Link>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-100">
          {/* כותרת וטקסט שביקשת */}
          <h1 className="text-3xl font-bold text-slate-950 text-center mb-4">
            נשמח לשמוע מכם!
          </h1>
          <p className="text-slate-600 text-center mb-10 leading-relaxed">
            יש לכם שאלה על CleanFry? מעוניינים בשיתוף פעולה עסקי או פשוט רוצים לשתף אותנו בחוויית השימוש שלכם? מלאו את הפרטים ונחזור אליכם בהקדם.
          </p>
          
          {/* טופס יצירת קשר - אל תשכח להחליף את ה-ID כשיגיע המייל מ-Zoho */}
          <form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST" className="space-y-5">
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none" 
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">אימייל לחזרה</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none" 
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">נושא הפנייה</label>
              <select 
                name="subject" 
                id="subject" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white outline-none"
              >
                <option value="שאלה כללית">שאלה כללית</option>
                <option value="שיתוף פעולה עסקי">שיתוף פעולה עסקי</option>
                <option value="חווית שימוש במוצר">חווית שימוש במוצר</option>
                <option value="אחר">אחר</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">הודעה</label>
              <span className="text-xs text-slate-400 mb-1 block">(ספרו לנו הכל...)</span>
              <textarea 
                name="message" 
                id="message" 
                rows={4} 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold hover:bg-slate-800 transition duration-150 shadow-lg mt-4"
            >
              שליחת הודעה
            </button>
          </form>

          {/* כפתור חזרה לדף הבית */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition">
              ← חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
