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
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50">
        <p className="text-sm font-bold text-slate-900">משלוח חינם בקנייה מעל 249 ש״ח!</p>
      </div>

      <Navbar onPurchaseClick={scrollToPurchase} />

      <main>
        <section className="relative overflow-hidden pt-4 pb-24 lg:pt-8 lg:pb-40 text-right px-4">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start mb-20">
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                  <img src="/logo.png" alt="CleanFry" className="h-32 lg:h-48 w-auto inline-block mb-2 mt-8 mix-blend-multiply" /> <br />
                  <span className="text-brand-blue">טיגון מושלם.</span> <br />
                  <span className="text-brand-green">ניקוי קל.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-8">
                  אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
                </p>
                
                <div className="flex flex-row flex-wrap gap-8 mt-10 w-full justify-start border-t border-slate-100 pt-8">
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-7 h-7 text-brand-green flex-shrink-0" />
                      <span>100% טבעי</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-7 h-7 text-brand-green flex-shrink-0" />
                      <span>ידידותי לסביבה</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <ShieldCheck className="w-7 h-7 text-brand-blue flex-shrink-0" />
                      <span>מגן על הניקוז</span>
                    </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16 lg:mt-24 relative flex justify-center">
                <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
                <img src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3vzxa2BRo2jq_Y" alt="CleanFry Packaging" className="relative rounded-3xl shadow-2xl w-full max-w-lg object-cover" />
              </motion.div>
            </div>

            <motion.div ref={purchaseBoxRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="max-w-3xl mx-auto relative z-10">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex-1 w-full order-1 text-right">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">בחירת כמות מארזים:</h3>
                  <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit ml-auto">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 bg-white rounded-xl shadow-md text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all">-</button>
                    <span className="text-4xl font-black text-slate-900 min-w-[60px] text-center font-mono">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 bg-white rounded-xl shadow-md text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all">+</button>
                  </div>
                </div>
                <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12 order-2">
                  <p className="text-slate-500 text-lg mb-1">סה"כ לתשלום:</p>
                  <p className="text-6xl font-black text-brand-blue mb-4">₪{totalPrice}</p>
                  {isFreeShipping ? (
                    <div className="flex items-center gap-2 text-brand-green font-bold bg-green-50 px-4 py-2 rounded-full mb-6 animate-pulse"><Truck className="w-5 h-5" /><span>משלוח חינם!</span></div>
                  ) : (
                    <p className="text-slate-400 text-sm mb-6 font-medium">משלוח חינם מעל 249 ₪</p>
                  )}
                  <button className="w-full gradient-brand text-white py-6 px-10 rounded-2xl font-black text-2xl shadow-xl hover:scale-[1.03] transition-all">
                    {getButtonText()}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 bg-slate-50 text-right px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-4">שלבי השימוש</h2>
            <div className="grid md:grid-cols-4 gap-8 mt-16">
              {[
                { icon: <Flame />, title: "כיבוי", desc: "מכבים את מקור החום." },
                { icon: <Droplets />, title: "הוספה", desc: "מוסיפים אבקה לשמן חם." },
                { icon: <Timer />, title: "קירור", desc: "ממתינים כ-20 דקות." },
                { icon: <Trash2 />, title: "השלכה", desc: "משליכים את הגוש לפח." }
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-20 max-w-3xl mx-auto bg-red-50 border-2 border-red-100 rounded-3xl p-8 flex items-center gap-6">
              <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-bold text-lg text-right">המוצר אינו למאכל! יש להרחיק מהישג ידם של ילדים.</p>
            </div>
          </div>
        </section>

        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-black text-center mb-12">שאלות ותשובות</h2>
            <div className="space-y-2">
              <FAQItem question="האם האבקה בטוחה לשימוש?" answer="כן, CleanFry עשויה מ-100% רכיבים ממקור צמחי." />
              <FAQItem question="האם זה מתאים לכל סוגי השמנים?" answer="בהחלט, מתאים לכל שמני הבישול הצמחיים הנפוצים." />
            </div>
          </div>
        </section>

        <section className="py-24 bg-brand-blue text-white text-center px-4">
          <h2 className="text-4xl lg:text-5xl font-black mb-8">מוכנים לשדרג את המטבח?</h2>
          <button onClick={scrollToPurchase} className="bg-white text-brand-blue px-12 py-6 rounded-2xl font-black text-2xl shadow-xl hover:scale-105 transition-transform">
            הזמנה עכשיו
          </button>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-20 px-4 text-right">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-800 pb-12">
          <div>
            <img src="/logo.png" className="h-10 w-auto mb-6 brightness-0 invert" />
            <p className="text-slate-400">הפתרון המושלם למיצוק שמן בישול משומש.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6">ניווט</h4>
            <ul className="text-slate-400 space-y-4">
              <li><a href="#" className="hover:text-white">ראשי</a></li>
              <li><a href="#how-it-works" className="hover:text-white">איך זה עובד</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">צור קשר</h4>
            <p className="text-slate-400 font-bold">contact@cleanfry.co.il</p>
          </div>
        </div>
        <div className="text-center pt-10 text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
