import React from 'react';
import { useLocation } from 'react-router-dom';

const LegalPage = () => {
  const location = useLocation();
  
  // זיהוי הכתובת הדינמית של הדף הנוכחי
  const currentPath = location.pathname;

  return (
    <div className="bg-white min-h-screen py-20 px-4 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto text-right">
        
        {/* --- 1. תצוגת דף מדיניות משלוחים ואספקה --- */}
        {currentPath === '/shipping-policy' && (
          <>
            <h1 className="text-4xl font-black text-slate-900 mb-10 border-b pb-6">מדיניות משלוחים ואספקה – CleanFry</h1>
            
            <div className="space-y-10 text-slate-700 leading-relaxed">
              <p>אנחנו ב-<strong>CleanFry</strong> עושים את מירב המאמצים כדי שההזמנה שלכם תגיע אליכם במהירות ובבטחה. להלן פרטי מדיניות המשלוחים והאספקה שלנו:</p>
              
              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. זמני אספקה ואזורי שילוח</h2>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li><strong>אזורי שילוח:</strong> אנו מבצעים משלוחים לכלל יישובי ישראל בפריסה ארצית מלאה[cite: 1].</li>
                  <li><strong>זמן אספקה בשגרה:</strong> המשלוח יגיע אליכם בתוך <strong>3 עד 5 ימי עסקים</strong> (לא כולל את יום ההזמנה/האיסוף, ימי שישי, שבת, ערבי חג, חגים, או ימי שבתון וסגר)[cite: 1].</li>
                  <li><strong>אופן השילוח:</strong> המשלוח מתבצע באמצעות חברת שליחויות עד הבית[cite: 1].</li>
                </ul>
              </section>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. תיאום המשלוח מול השליח</h2>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li><strong>מסרון עדכון:</strong> בבוקר יום המסירה תקבלו מסרון (SMS) מקדים מחברת השליחויות[cite: 1].</li>
                  <li><strong>תיאום טלפוני:</strong> השליח יתאם אתכם טלפונית כ-30 עד 60 דקות לפני הגעתו[cite: 1].</li>
                  <li><strong>קבלת הטובין:</strong> בעת קבלת החבילה, תידרש חתימה דיגיטלית של הנמען[cite: 1].</li>
                </ul>
              </section>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. חריגים, עיכובים ותקופות עומס</h2>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li><strong>חודש נובמבר (חגי הקניות ו-Black Friday):</strong> במהלך חודש נובמבר, בשל עומסים ארציים של חברות השילוח, זמני האספקה עשויים להתארך ויעמדו על <strong>3 עד 9 ימי עסקים</strong>[cite: 1].</li>
                  <li><strong>שינוי כתובת אספקה:</strong> לקוח המבקש לשנות את כתובת האספקה לאחר שהמשלוח כבר יצא מחסני החברה, יחווה דחייה של <strong>2 ימי עסקים נוספים</strong> במועד האספקה[cite: 1].</li>
                  <li><strong>אי-זמינות נמען:</strong> במידה והנמען אינו זמין בטלפון או שקיימות בעיות באיתור הכתובת, יבוצע תיאום מחדש של המשלוח, דבר אשר עלול להוביל לעיכובים בזמני האספקה המקוריים[cite: 1].</li>
                </ul>
              </section>
            </div>
          </>
        )}

        {/* --- 2. תצוגת דף מדיניות הביטולים וההחזרות --- */}
        {currentPath === '/cancellation-policy' && (
          <>
            <h1 className="text-4xl font-black text-slate-900 mb-10 border-b pb-6">מדיניות ביטולים והחזרות – CleanFry</h1>
            
            <div className="space-y-10 text-slate-700 leading-relaxed">
              <p>אנו ב-<strong>CleanFry</strong> עושים הכל כדי שתהיו מרוצים מהמוצרים שלנו. במידה וברצונכם לבטל עסקה, להלן המדיניות שלנו הפועלת בהתאם לחוק הגנת הצרכן, התשמ"א-1981.</p>
              
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. מועד ותנאי הביטול</h2>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li>ניתן לבטל עסקה לרכישת מוצר מיום הרכישה ועד <strong>14 ימים</strong> ממועד קבלת המוצר, או מיום קבלת מסמך הגילוי (לפי המאוחר מבניהם).</li>
                  <li><strong className="text-red-600">תנאי הכרחי לביטול:</strong> הביטול יתאפשר בתנאי שהמוצר לא נפגם, לא נעשה בו כל שימוש והוא מוחזר באריזתו המקורית, הסגורה והשלמה.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. דרכי מסירת הודעת ביטול</h2>
                <p className="mb-3">ניתן למסור הודעת ביטול באחת מהדרכים הבאות (יש לציין שם מלא, מספר הזמנה ומספר טלפון):</p>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li><strong>באימייל:</strong> <a href="mailto:info@cleanfry.co.il" className="text-brand-blue underline">info@cleanfry.co.il</a></li>
                  <li><strong>בוואטסאפ / טלפון:</strong> <a href="tel:0559550453" className="text-brand-blue underline">055-955-0453</a></li>
                  <li><strong>באמצעות טופס יצירת קשר באתר.</strong></li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. דמי ביטול והחזר כספי</h2>
                <ul className="list-disc list-inside space-y-2 pr-4">
                  <li><strong>ביטול עקב פגם או אי-התאמה:</strong> במידה והביטול נעשה עקב פגם במוצר, אי-אספקה במועד או אי-התאמה בין המוצר שהוזמן למוצר שסופק, יקבל הצרכן החזר כספי מלא בתוך 14 ימים מהודעת הביטול, ללא דמי ביטול.</li>
                  <li><strong>ביטול שלא עקב פגם (חרטה):</strong> במידה והביטול נעשה מכל סיבה אחרת, ינוכו דמי ביטול כחוק בגובה <strong>5% משווי העסקה או 100 ש"ח</strong> (לפי הנמוך מבניהם).</li>
                  <li><strong>עלויות שילוח:</strong> במקרה של חרטה, עלות החזרת המוצר אל מחסני החברה תחול על הרוכש. החברה אינה מזכה את עלות המשלוח המקורית שבוצעה אל בית הלקוח.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. סייגים לזכות הביטול</h2>
                <p>בהתאם לחוק, לא ניתן לבטל עסקה עבור מוצרים פסידים (מוצרים שמתקלקלים או נהרסים במהירות) או מוצרים שאריזתם המקורית נפתחה (מטעמי הגיינה ובטיחות מוצר, שכן מדובר במוצר הבא במגע עם מטבח ותזונה).</p>
              </section>
            </div>
          </>
        )}

        {/* --- 3. ברירת מחדל: תצוגת דף תנאי השימוש הכללי (למשל עבור /terms או דף כללי) --- */}
        {currentPath !== '/shipping-policy' && currentPath !== '/cancellation-policy' && (
          <>
            <h1 className="text-4xl font-black text-slate-900 mb-10 border-b pb-6">תקנון, תנאי שימוש ומדיניות פרטיות</h1>
            
            <div className="space-y-10 text-slate-700 leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. כללי</h2>
                <p>אתר CleanFry (להלן: "האתר") משמש כחנות אינטרנטית למכירת מוצרים לטיפול בשמן בישול. השימוש באתר ובמוצרים המוצעים בו כפוף לתנאים המפורטים להלן. גלישה באתר או רכישת מוצר מהווים הסכמה לתנאים אלו.</p>
              </section>

              <section className="bg-red-50 p-6 rounded-2xl border-r-4 border-red-500">
                <h2 className="text-2xl font-bold text-red-900 mb-4">2. אזהרת בטיחות והגבלת אחריות</h2>
                <p className="font-bold mb-2 text-red-700 underline">שימו לב: מוצר CleanFry אינו למאכל! יש להרחיק מהישג ידם של ילדים ובעלי חיים.</p>
                <p>השימוש במוצר דורש עבודה עם שמן בישול חם. המשתמש נושא באחריות מלאה להקפדה על כללי"! הזהירות. בעלי האתר לא יישאו באחריות לכל נזק, ישיר או עקיף, הנובע משימוש לא נכון במוצר או אי-הקפדה על הוראות הבטיחות.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. מדיניות משלוחים והחזרות</h2>
                <p>משלוחים יבוצעו לכתובת שהוזנה בעת ההזמנה תוך ימי העסקים המוגדרים באתר. ביטול עסקה והחזרת מוצרים יתבצעו בהתאם לחוק הגנת הצרכן, בתנאי שהמוצר באריזתו המקורית ולא נעשה בו שימוש.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. פרטיות</h2>
                <p>אנו מכבדים את פרטיות הגולשים. המידע הנמסר בטופס יצירת הקשר (שם, אימייל) ישמש למטרת מתן שירות בלבד ולא יועבר לצד ג' ללא הסכמתכם, למעט לצורך השלמת תהליך המשלוח או כנדרש על פי דין.</p>
              </section>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default LegalPage;
