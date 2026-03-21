import React from 'react';

const ContactPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4" direction="rtl">
      <div className="max-w-xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-bold text-slate-950 text-center mb-4">צרו קשר עם CleanFry</h1>
        <p className="text-slate-600 text-center mb-10">יש לכם שאלה? מעוניינים בשיתוף פעולה? מלאו את הפרטים ונחזור אליכם.</p>
        
        {/* אל תשכח להחליף את 'YOUR_FORMSPREE_ID' ב-ID האמיתי שקיבלת מהם */}
        <form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST" className="space-y-6">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
            <input type="text" name="name" id="name" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">אימייל</label>
            <input type="email" name="email" id="email" required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition" />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">נושא הפנייה</label>
            <select name="subject" id="subject" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition bg-white">
              <option value="general">כללי</option>
              <option value="order">שאלות על הזמנה</option>
              <option value="business">שיתוף פעולה עסקי</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">הודעה</label>
            <textarea name="message" id="message" rows={5} required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition"></textarea>
          </div>

          <button type="submit" className="w-full bg-brand-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-brand-blue/90 transition duration-150 shadow-sm">
            שלח הודעה
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
