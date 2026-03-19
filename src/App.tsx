/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = ({ onPurchaseClick }: { onPurchaseClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (document.getElementById('userway-widget')) return;
    const script = document.createElement('script');
    script.setAttribute('data-account', 'XQfDpHYmO1'); 
    script.src = 'https://cdn.userway.org/widget.js';
    script.async = true;
    script.id = 'userway-widget';
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
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/logo.png" alt="CleanFry Logo" className="h-12 w-auto object-contain" />
          </div>
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-slate-600 hover:text-brand-blue font-medium transition-colors">
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onPurchaseClick} className="hidden sm:block bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-xl font-bold hover:bg-brand-blue hover:text-white transition-all">
              הזמנה עכשיו
            </button>
            <button className="p-2 text-slate-600 hover:text-brand-blue relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute top-0 right-0 bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
            </button>
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-slate-100 overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-1 text-right">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-brand-blue rounded-lg" onClick={() => setIsOpen(false)}>
                  {link.name}
                </a>
              ))}
              <button onClick={() => { setIsOpen(false); onPurchaseClick(); }} className="w-full text-right px-3 py-3 text-base font-bold text-brand-blue bg-blue-50 rounded-lg mt-2">
                הזמנה עכשיו
              </button>
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
      <button className="w-full py-6 flex justify-between items-center text-right focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-lg font-bold text-slate-800">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-right">
            <p className="pb-6 text-slate-600 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [quantity, setQuantity] = useState(1);
  const purchaseBoxRef = useRef<HTMLDivElement>(null);
  
  const UNIT_PRICE = 49;
  const totalPrice = quantity * UNIT_PRICE;
  const isFreeShipping = totalPrice >= 249;

  const scrollToPurchase = () => {
    purchaseBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getButtonText = () => {
    if (quantity === 1) return "הזמנת מארז אחד";
    return `הזמנת ${quantity} מארזים`;
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Top Announcement Bar */}
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50">
        <p className="text-sm font-bold text-slate-900">משלוח חינם בקנייה מעל 249 ש״ח!</p>
      </div>

      <Navbar onPurchaseClick={scrollToPurchase} />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-4 pb-24 lg:pt-8 lg:pb-40 text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start mb-20">
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                  <img src="/logo.png" alt="CleanFry" className="h-32 lg:h-48 w-auto inline-block mb-2 mt-8" /><br />
                  <span className="text-brand-blue">טיגון מושלם.</span><br />
                  <span className="text-brand-green">ניקוי קל.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                  אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
                </p>

                {/* בולטים ממורכזים מתחת לפסקה */}
                <div className="flex flex-wrap justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-500 text-lg font-medium">
                    <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" />
                    <span>100% טבעי</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-lg font-medium">
                    <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" />
                    <span>ידידותי לסביבה</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-lg font-medium">
                    <ShieldCheck className="w-5 h-5 text-brand-green flex-shrink-0" />
                    <span>מגן על הניקוז</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16 lg:mt-24 relative">
                <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
                <img src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3zvxa2BRo2jq_Y" alt="CleanFry Packaging" className="relative rounded-3xl shadow-2xl w-full max-w-lg mx-auto object-cover" referrerPolicy="no-referrer" />
              </motion.div>
            </div>

            {/* תיבת קנייה מרכזית חכמה */}
            <motion.div ref={purchaseBoxRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-3xl mx-auto relative z-10 px-4">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden text-right">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                {/* צד ימין: בחירת כמות בלבד */}
                <div className="flex-1 w-full order-1 text-right">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">בחירת כמות מארזים:</h3>
                  <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit ml-auto md:ml-0">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-md text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all active:scale-90">-</button>
                    <span className="text-4xl font-black text-slate-900 min-w-[60px] text-center font-mono">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-md text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all active:scale-90">+</button>
                  </div>
                </div>

                {/* צד שמאל: מחיר, משלוח וכפתור */}
                <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12 order-2">
                  <p className="text-slate-500 text-lg mb-1">סה"כ לתשלום:</p>
                  <p className="text-6xl font-black text-brand-blue mb-4">₪{totalPrice}</p>
                  {isFreeShipping ? (
                    <div className="flex items-center gap-2 text-brand-green font-bold bg-green-50 px-4 py-2 rounded-full mb-6 animate-pulse"><Truck className="w-5 h-5" /><span>משלוח חינם מופעל!</span></div>
                  ) : (
                    <p className="text-slate-400 text-sm mb-6 font-medium">משלוח חינם בקנייה מעל 249 ₪</p>
                  )}
                  <button className="w-full gradient-brand text-white py-6 px-10 rounded-2xl font-black text-2xl shadow-xl hover:scale-[1.03] transition-all shadow-brand-blue/25">
                    {getButtonText()}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-slate-50 text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 mb-4">שלבי השימוש</h2>
              <p className="text-slate-600 text-lg">פשוט, מהיר ונקי - כך תהפכו את השמן המשומש לגוש מוצק</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Flame className="w-10 h-10 text-brand-blue" />, title: "כיבוי האש", desc: "כיבוי מקור החום או הכיריים." },
                { icon: <Droplets className="w-10 h-10 text-brand-blue" />, title: "הוספה", desc: "הוספת אבקת CleanFry כשהשמן עודו חם." },
                { icon: <Timer className="w-10 h-10 text-brand-blue" />, title: "קירור", desc: "המתנה עד להתמצקות מלאה של השמן (כ-20-25 דקות)." },
                { icon: <Trash2 className="w-10 h-10 text-brand-blue" />, title: "השלכה", desc: "השלכת השמן המוצק לפח האשפה." }
              ].map((step, idx) => (
                <motion.div key={idx} whileHover={{ y: -10 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                  <div className="w-20 h-20 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6">{step.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                  <div className="mt-6 text-4xl font-black text-slate-100">{idx + 1}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-20 max-w-3xl mx-auto text-right">
              <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-red-900 mb-2">אזהרה חשובה</h4>
                  <p className="text-red-700 font-medium">המוצר אינו למאכל! יש להרחיק מהישג ידם של ילדים.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">שאלות ותשובות</h2>
              <p className="text-slate-600">כל מה שרציתם לדעת על CleanFry</p>
            </div>
            <div className="space-y-2">
              <FAQItem question="האם האבקה בטוחה לשימוש בכל סוגי השמנים?" answer="כן, CleanFry מתאימה לכל סוגי שמני הבישול הצמחיים הנפוצים במטבח הביתי, כולל שמן קנולה, סויה, חמניות ותירס." />
              <FAQItem question="כמה אבקה צריך להוסיף לכל ליטר שמן?" answer="המינון המומלץ הוא כף אחת של אבקה לכל כוס שמן (כ-250 מ״ל). לתוצאות מיטביות, יש להוסיף את האבקה כשהשמן עדיין חם." />
              <FAQItem question="האם ניתן להשתמש בשמן שוב אחרי שהתמצק?" answer="לא. CleanFry מיועדת לטיפול בשמן משומש המיועד להשלכה. ברגע שהשמן התמצק, הוא הופך לגוש מוצק שאינו ניתן לשימוש חוזר." />
              <FAQItem question="האם המוצר ידידותי לסביבה?" answer="בהחלט. CleanFry עשויה מ-100% רכיבים ממקור צמחי. היא מונעת שפיכת שמן לצנרת הניקוז, מה שמגן על מערכות הביוב ועל איכות הסביבה." />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-brand-blue relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-green rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-8">מוכנים לשדרג את המטבח שלכם?</h2>
            <p className="text-white/90 text-xl mb-12 leading-relaxed text-center">
              הצטרפו לאלפי משפחות בישראל שכבר נהנות ממטבח נקי יותר וסביבה ירוקה יותר.
            </p>
            <button onClick={scrollToPurchase} className="bg-white text-brand-blue px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 transition-transform">
              הזמנה עכשיו
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-white pt-20 pb-10 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-right">
            <div className="space-y-6">
              <div className="flex items-center">
                <img src="/logo.png" alt="CleanFry Logo" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-slate-400 leading-relaxed">
                הפתרון המושלם למיצוק והשלכת שמן בישול משומש. שומרים על המטבח נקי ועל הסביבה ירוקה.
              </p>
              <div className="flex gap-4 justify-end">
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-blue transition-colors"><MessageCircle className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">ניווט מהיר</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">ראשי</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">איך זה עובד</a></li>
                <li><a href="#" className="hover:text-white transition-colors">בלוג</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">שירות לקוחות</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">צור קשר</a></li>
                <li><a href="#" className="hover:text-white transition-colors">מדיניות משלוחים</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">הצטרפו לקהילה</h4>
              <div className="flex gap-2">
                <input type="email" placeholder="האימייל שלך" className="bg-slate-800 border-none rounded-lg px-4 py-2 w-full text-right outline-none" />
                <button className="bg-brand-green px-4 py-2 rounded-lg font-bold">שלח</button>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-10 text-center text-slate-500 text-sm">
            <div className="mb-4"><a href="/accessibility-statement.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-4">הצהרת נגישות</a></div>
            <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
