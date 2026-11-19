import React from 'react';
import { useSEO } from './useSEO';
import { pageShell, pageTitle } from './home/layout';

const AccessibilityPage = () => {
  useSEO({
    title: 'הצהרת נגישות - CleanFry',
    description: 'הצהרת הנגישות של אתר CleanFry ואמצעי ההנגשה הזמינים בו.',
    path: '/accessibility'
  });

  return (
    <div className={pageShell} dir="rtl">
      <div className="mx-auto max-w-[880px]">
        <h1 className={`${pageTitle} mb-10 border-b border-cf-border pb-6`}>הצהרת נגישות - CleanFry</h1>
        
        <div className="space-y-6 text-[17px] leading-relaxed text-cf-body">
          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">מבוא</h2>
            <p>אנו ב-CleanFry רואים חשיבות עליונה בהנגשת האתר לכלל האוכלוסייה, כולל אנשים עם מוגבלויות. אתר נגיש מאפשר לכל אדם לגלוש בנוחות וליהנות מהשירותים והתכנים שלנו.</p>
          </section>

          <section className="rounded-[28px] bg-cf-blue-light p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">אמצעי הנגישות באתר</h2>
            <p className="mb-4 font-bold">באתר מותקן רכיב נגישות של חברת UserWay המאפשר שליטה על מספר פונקציות מרכזיות:</p>
            <ul className="list-disc list-inside space-y-2 mr-4 marker:text-cf-green">
              <li>התאמת גודל הגופן (הגדלה והקטנה).</li>
              <li>שינוי ניגודיות הצבעים (ניגודיות גבוהה/הפוכה).</li>
              <li>הדגשת קישורים.</li>
              <li>חסימת אנימציות.</li>
              <li>הפיכת הפונטים לקריאים יותר.</li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">איך להשתמש בתוספת הנגישות?</h2>
            <p>תוסף הנגישות ממוקם בפינת המסך (לחיצה על אייקון הנגישות). לחיצה עליו תפתח תפריט אפשרויות המאפשר התאמה אישית של חוויית הגלישה בהתאם לצרכי המשתמש.</p>
          </section>

          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">פניות בנושא נגישות</h2>
            <p>למרות מאמצינו להנגיש את כלל הדפים באתר, ייתכן ויתגלו חלקים שטרם הונגשו במלואם. אם נתקלתם בבעיה או שיש לכם הצעה לשיפור, נשמח לשמוע מכם:</p>
            <div className="mt-4 inline-block rounded-2xl border border-cf-border bg-white p-4">
              <p><strong>רכז נגישות:</strong> מ.ק יזמות</p>
              <p><strong>אימייל:</strong> info@cleanfry.co.il</p>
            </div>
          </section>

          <p className="mt-12 text-sm text-cf-muted">עדכון אחרון: מרץ 2026</p>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;
