import React from 'react';

const LegalPage = () => {
  return (
    <div className="bg-white min-h-screen py-20 px-4 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto text-right">
        <h1 className="text-4xl font-black text-slate-900 mb-10 border-b pb-6">תקנון, תנאי שימוש ומדיניות פרטיות</h1>
        
        <div className="space-y-10 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. כללי</h2>
            <p>אתר CleanFry (להלן: "האתר") משמש כחנות אינטרנטית למכירת מוצרים לטיפול בשמן בישול. השימוש באתר ובמוצרים המוצעים בו כפוף לתנאים המפורטים להלן. גלישה באתר או רכישת מוצר מהווים הסכמה לתנאים אלו.</p>
          </section>

          <section className="bg-red-50 p-6 rounded-2xl border-r-4 border-red-500">
            <h2 className="text-2xl font-bold text-red-900 mb-4">2. אזהרת בטיחות והגבלת אחריות</h2>
            <p className="font-bold mb-2 text-red-700 underline">שימו לב: מוצר CleanFry אינו למאכל! יש להרחיק מהישג ידם של ילדים ובעלי חיים.</p>
            <p>השימוש במוצר דורש עבודה עם שמן בישול חם. המשתמש נושא באחריות מלאה להקפדה על כללי הזהירות. בעלי האתר לא יישאו באחריות לכל נזק, ישיר או עקיף, הנובע משימוש לא נכון במוצר או אי-הקפדה על הוראות הבטיחות.</p>
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
      </div>
    </div>
  );
};

export default LegalPage;
