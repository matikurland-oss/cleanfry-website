/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  Flame, 
  Droplets, 
  Timer, 
  Trash2, 
  AlertTriangle, 
  ChevronDown, 
  Instagram, 
  Facebook, 
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

useEffect(() => {
    // בדיקה אם הסקריפט כבר קיים כדי לא לטעון אותו פעמיים
    if (document.getElementById('enable')) return;

    const script = document.createElement('script');
    script.src = "https://cdn.enable.co.il/releases/enable.min.js";
    script.async = true;
    script.id = "enable";
    document.body.appendChild(script);
  }, []);

  const navLinks = [
    { name: 'ראשי', href: '#' },
    { name: 'איך זה עובד', href: '#how-it-works' },
    { name: 'בלוג', href: '#' },
    { name: 'צור קשר', href: '#contact' },
  ];

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-8 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Right: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="https://lh3.googleusercontent.com/d/1ll71-cdPvbF8SQ8Gc1coS5qVO8jgaHXh" 
              alt="CleanFry Logo" 
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center: Desktop Nav */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-slate-600 hover:text-brand-blue font-medium transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Left: Cart & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-600 hover:text-brand-blue relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
            </button>
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-brand-blue hover:bg-slate-50 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button
        className="w-full py-6 flex justify-between items-center text-right focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-bold text-slate-800">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* 1. Top Announcement Bar */}
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50">
        <p className="text-sm font-bold text-slate-900">
          משלוח חינם בקנייה מעל 249 ש״ח!
        </p>
      </div>

      {/* 2. Header / Navigation */}
      <Navbar />

      <main>
        {/* 3. Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-right"
              >
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1ll71-cdPvbF8SQ8Gc1coS5qVO8jgaHXh" 
                    alt="CleanFry" 
                    className="h-32 lg:h-48 w-auto inline-block mb-2"
                    referrerPolicy="no-referrer"
                  /> <br />
                  <span className="text-brand-blue">טיגון מושלם.</span> <br />
                  <span className="text-brand-green">ניקוי קל.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-xl">
                  אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="gradient-brand text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg shadow-brand-blue/20 hover:scale-105 transition-transform">
                    לקנייה עכשיו
                  </button>
                  <button className="bg-slate-100 text-slate-700 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-200 transition-colors">
                    איך זה עובד?
                  </button>
                </div>
                
                <div className="mt-12 flex items-center gap-6 text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-green" />
                    <span className="text-sm font-medium">100% טבעי</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-green" />
                    <span className="text-sm font-medium">ידידותי לסביבה</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-16 lg:mt-0 relative"
              >
                <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
                <img 
                  src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3zvxa2BRo2jq_Y"
                  alt="CleanFry Product Packaging" 
                  className="relative rounded-3xl shadow-2xl w-full max-w-lg mx-auto object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section id="how-it-works" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 mb-4">שלבי השימוש</h2>
              <p className="text-slate-600 text-lg">פשוט, מהיר ונקי - כך תהפכו את השמן המשומש לגוש מוצק</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <Flame className="w-10 h-10 text-brand-blue" />,
                  title: "כיבוי האש",
                  desc: "כבו את מקור החום או הכיריים."
                },
                {
                  icon: <Droplets className="w-10 h-10 text-brand-blue" />,
                  title: "הוספה",
                  desc: "הוסיפו את אבקת CleanFry כשהשמן עודו חם."
                },
                {
                  icon: <Timer className="w-10 h-10 text-brand-blue" />,
                  title: "קירור",
                  desc: "המתינו עד להתמצקות מלאה של השמן (כ-20-25 דקות)."
                },
                {
                  icon: <Trash2 className="w-10 h-10 text-brand-blue" />,
                  title: "השלכה",
                  desc: "השליכו את השמן המוצק לפח האשפה."
                }
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -10 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center"
                >
                  <div className="w-20 h-20 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                  <div className="mt-6 text-4xl font-black text-slate-100">{idx + 1}</div>
                </motion.div>
              ))}
            </div>

            {/* 5. Safety Warning Box */}
            <div className="mt-20 max-w-3xl mx-auto">
              <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center md:text-right">
                  <h4 className="text-xl font-bold text-red-900 mb-2">אזהרה חשובה</h4>
                  <p className="text-red-700 font-medium">המוצר אינו למאכל! יש להרחיק מהישג ידם של ילדים.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ Section */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">שאלות ותשובות</h2>
              <p className="text-slate-600">כל מה שרציתם לדעת על CleanFry</p>
            </div>

            <div className="space-y-2">
              <FAQItem 
                question="האם האבקה בטוחה לשימוש בכל סוגי השמנים?"
                answer="כן, CleanFry מתאימה לכל סוגי שמני הבישול הצמחיים הנפוצים במטבח הביתי, כולל שמן קנולה, סויה, חמניות ותירס."
              />
              <FAQItem 
                question="כמה אבקה צריך להוסיף לכל ליטר שמן?"
                answer="המינון המומלץ הוא כף אחת של אבקה לכל כוס שמן (כ-250 מ״ל). לתוצאות מיטביות, יש להוסיף את האבקה כשהשמן עדיין חם."
              />
              <FAQItem 
                question="האם ניתן להשתמש בשמן שוב אחרי שהתמצק?"
                answer="לא. CleanFry מיועדת לטיפול בשמן משומש המיועד להשלכה. ברגע שהשמן התמצק, הוא הופך לגוש מוצק שאינו ניתן לשימוש חוזר."
              />
              <FAQItem 
                question="האם המוצר ידידותי לסביבה?"
                answer="בהחלט. CleanFry עשויה מ-100% רכיבים ממקור צמחי. היא מונעת שפיכת שמן לצנרת הניקוז, מה שמגן על מערכות הביוב ועל איכות הסביבה."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-brand-blue relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-green rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-8">מוכנים לשדרג את המטבח שלכם?</h2>
            <p className="text-white/90 text-xl mb-12 leading-relaxed">
              הצטרפו לאלפי משפחות בישראל שכבר נהנות ממטבח נקי יותר וסביבה ירוקה יותר.
            </p>
            <button className="bg-white text-brand-blue px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 transition-transform">
              הזמינו עכשיו
            </button>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer id="contact" className="bg-slate-900 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="space-y-6">
              <div className="flex items-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/1ll71-cdPvbF8SQ8Gc1coS5qVO8jgaHXh" 
                  alt="CleanFry Logo" 
                  className="h-12 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-slate-400 leading-relaxed">
                הפתרון המושלם למיצוק והשלכת שמן בישול משומש. שומרים על המטבח נקי ועל הסביבה ירוקה.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-lg font-bold mb-6">ניווט מהיר</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">ראשי</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">איך זה עובד</a></li>
                <li><a href="#" className="hover:text-white transition-colors">בלוג</a></li>
                <li><a href="#" className="hover:text-white transition-colors">שאלות ותשובות</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold mb-6">שירות לקוחות</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">צור קשר</a></li>
                <li><a href="#" className="hover:text-white transition-colors">מדיניות משלוחים</a></li>
                <li><a href="#" className="hover:text-white transition-colors">תנאי שימוש</a></li>
                <li><a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-bold mb-6">הצטרפו לקהילה שלנו</h4>
              <p className="text-slate-400 mb-4 text-sm">הירשמו לקבלת טיפים למטבח ירוק ומבצעים בלעדיים.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="האימייל שלך" 
                  className="bg-slate-800 border-none rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-brand-blue outline-none"
                />
                <button className="bg-brand-green px-4 py-2 rounded-lg font-bold hover:bg-brand-green/80 transition-colors">
                  שלח
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-10 text-center text-slate-500 text-sm">
            <div className="mb-4">
  <a href="#accessibility" className="hover:text-white underline transition-colors">הצהרת נגישות</a>
</div>
            <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות. מיוצר לישראל באהבה.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
