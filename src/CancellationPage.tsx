import React from 'react';
import { useSEO } from './useSEO';
import { pageShell, pageTitle } from './home/layout';

const CancellationPage = () => {
  useSEO({
    title: 'מדיניות ביטולים והחזרות - CleanFry',
    description: 'מדיניות ביטולים והחזרות של CleanFry בהתאם לחוק הגנת הצרכן - מועדי ביטול, דמי ביטול ואופן ההחזר הכספי.',
    path: '/cancellation-policy'
  });

  return (
    <div className={pageShell} dir="rtl">
      <div className="mx-auto max-w-[880px]">
        <h1 className={`${pageTitle} mb-10 border-b border-cf-border pb-6`}>מדיניות ביטולים והחזרות – CleanFry</h1>
        
        <div className="space-y-6 text-[17px] leading-relaxed text-cf-body">
          <p>אנו ב-<strong>CleanFry</strong> עושים הכל כדי שתהיו מרוצים מהמוצרים שלנו. במידה וברצונכם לבטל עסקה, להלן המדיניות שלנו הפועלת בהתאם לחוק הגנת הצרכן, התשמ"א-1981.</p>
          
          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">1. מועד ותנאי הביטול</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 marker:text-cf-green">
              <li>ניתן לבטל עסקה לרכישת מוצר מיום הרכישה ועד <strong>14 ימים</strong> ממועד קבלת המוצר, או מיום קבלת מסמך הגילוי (לפי המאוחר מבניהם).</li>
              <li><strong className="text-[#B42318]">תנאי הכרחי לביטול:</strong> הביטול יתאפשר בתנאי שהמוצר לא נפגם, לא נעשה בו כל שימוש והוא מוחזר באריזתו המקורית, הסגורה והשלמה.</li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">2. דרכי מסירת הודעת ביטול</h2>
            <p className="mb-3">ניתן למסור הודעת ביטול באחת מהדרכים הבאות (יש לציין שם מלא, מספר הזמנה ומספר טלפון):</p>
            <ul className="list-disc list-inside space-y-2 pr-4 marker:text-cf-green">
              <li><strong>באימייל:</strong> <a href="mailto:info@cleanfry.co.il" className="font-bold text-cf-blue underline underline-offset-4">info@cleanfry.co.il</a></li>
              <li><strong>בוואטסאפ / טלפון:</strong> <a href="tel:0559550453" className="font-bold text-cf-blue underline underline-offset-4">055-955-0453</a></li>
              <li><strong>באמצעות טופס יצירת קשר באתר.</strong></li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">3. דמי ביטול והחזר כספי</h2>
            <ul className="list-disc list-inside space-y-2 pr-4 marker:text-cf-green">
              <li><strong>ביטול עקב פגם או אי-התאמה:</strong> במידה והביטול נעשה עקב פגם במוצר, אי-אספקה במועד או אי-התאמה בין המוצר שהוזמן למוצר שסופק, יקבל הצרכן החזר כספי מלא בתוך 14 ימים מהודעת הביטול, ללא דמי ביטול.</li>
              <li><strong>ביטול שלא עקב פגם (חרטה):</strong> במידה והביטול נעשה מכל סיבה אחרת, ינוכו דמי ביטול כחוק בגובה <strong>5% משווי העסקה או 100 ש"ח</strong> (לפי הנמוך מבניהם).</li>
              <li><strong>עלויות שילוח:</strong> במקרה של חרטה, עלות החזרת המוצר אל מחסני החברה תחול על הרוכש. החברה אינה מזכה את עלות המשלוח המקורית שבוצעה אל בית הלקוח.</li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]">
            <h2 className="mb-4 mt-0 text-2xl font-extrabold text-cf-navy">4. סייגים לזכות הביטול</h2>
            <p>בהתאם לחוק, לא ניתן לבטל עסקה עבור מוצרים פסידים (מוצרים שמתקלקלים או נהרסים במהירות) או מוצרים שאריזתם המקורית נפתחה (מטעמי הגיינה ובטיחות מוצר, שכן מדובר במוצר הבא במגע עם מטבח ותזונה).</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationPage;
