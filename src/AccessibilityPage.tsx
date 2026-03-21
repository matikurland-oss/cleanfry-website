import React from 'react';

const AccessibilityPage = () => {
  return (
    <div className="bg-white min-h-screen py-20 px-4 font-sans text-right" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-10 border-b pb-6">הצהרת נגישות - CleanFry</h1>
        
        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">מבוא</h2>
            <p>אנו ב-CleanFry רואים חשיבות עליונה בהנגשת האתר לכלל האוכלוסייה, כולל אנשים עם מוגבלויות. אתר נגיש מאפשר לכל אדם לגלוש בנוחות וליהנות מהשירותים והתכנים שלנו.</p>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border-r-4 border-blue-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">אמצעי הנגישות באתר</h2>
            <p className="mb-4 font-bold">באתר מותקן רכיב נגישות של חברת UserWay המאפשר שליטה על מספר פונקציות מרכזיות:</p>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>התאמת גודל הגופן (הגדלה והקטנה).</li>
              <li>שינוי ניגודיות הצבעים (ניגודיות גבוהה/הפוכה).</li>
              <li>הדגשת קישורים.</li>
              <li>חסימת אנימציות.</li>
              <li>הפיכת הפונטים לקריאים יותר.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">איך להשתמש בתוספת הנגישות?</h2>
            <p>תוסף הנגישות ממוקם בפינת המסך (לחיצה על אייקון הנגישות). לחיצה עליו תפתח תפריט אפשרויות המאפשר התאמה אישית של חוויית הגלישה בהתאם לצרכי המשתמש.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">פניות בנושא נגישות</h2>
            <p>למרות מאמצינו להנגיש את כלל הדפים באתר, ייתכן ויתגלו חלקים שטרם הונגשו במלואם. אם נתקלתם בבעיה או שיש לכם הצעה לשיפור, נשמח לשמוע מכם:</p>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl inline-block">
              <p><strong>רכז נגישות:</strong> מתי קורלנד</p>
              <p><strong>אימייל:</strong> info@cleanfry.co.il</p>
            </div>
          </section>

          <p className="text-sm text-slate-400 mt-12">עדכון אחרון: מרץ 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;
