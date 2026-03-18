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
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = ({ onPurchaseClick }: { onPurchaseClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-8 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img 
              src="https://cleanfry.co.il/logo.png" 
              alt="CleanFry Logo" 
              className="h-12 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1vA5W3U6-0W2Y-XN-9X9X9X9X9X9X9X9X" }}
            />
          </div>

          <div className="hidden md:flex gap-8">
            <a href="#" className="text-slate-600 hover:text-brand-blue font-medium">ראשי</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-brand-blue font-medium">איך זה עובד</a>
            <a href="#contact" className="text-slate-600 hover:text-brand-blue font-medium">צור קשר</a>
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

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Top Bar */}
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50 text-sm font-bold text-slate-900">
        משלוח חינם בקנייה מעל 249 ש״ח!
      </div>

      <Navbar onPurchaseClick={scrollToPurchase} />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-24 text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center mb-20">
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                  <span className="text-brand-blue">טיגון מושלם.</span> <br />
                  <span className="text-brand-green">ניקוי קל.</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-8">
                  אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
                </p>
                
                {/* בולטים אופקיים ירוקים */}
                <div className="flex flex-row flex-wrap gap-8 mt-10 justify-start border-t border-slate-100 pt-8">
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-7 h-7 text-brand-green" />
                      <span>100% טבעי</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-7 h-7 text-brand-green" />
                      <span>ידידותי לסביבה</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-7 h-7 text-brand-green" />
                      <span>מגן על הניקוז</span>
                    </div>
                </div>
              </motion.div>

              {/* תמונת מוצר */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-16 lg:mt-0 relative flex justify-center">
                <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
                <img 
                  src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3vzxa2BRo2jq_Y" 
                  alt="CleanFry Packaging" 
                  className="relative rounded-3xl shadow-2xl w-full max-w-lg object-cover"
                />
              </motion.div>
            </div>

            {/* תיבת קנייה */}
            <motion.div ref={purchaseBoxRef} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex-1 w-full order-1 text-right">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">בחירת כמות מארזים:</h3>
                  <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit ml-auto">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 bg-white rounded-xl shadow text-3xl font-bold text-brand-blue">-</button>
                    <span className="text-4xl font-black text-slate-900 min-w-[60px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 bg-white rounded-xl shadow text-3xl font-bold text-brand-blue">+</button>
                  </div>
                </div>
                <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12 order-2">
                  <p className="text-slate-500 text-lg">סה"כ לתשלום:</p>
                  <p className="text-6xl font-black text-brand-blue mb-4">₪{totalPrice}</p>
                  {isFreeShipping ? (
                    <div className="text-brand-green font-bold bg-green-50 px-4 py-2 rounded-full mb-6">משלוח חינם מופעל!</div>
                  ) : (
                    <p className="text-slate-400 text-sm mb-6">משלוח חינם בקנייה מעל 249 ₪</p>
                  )}
                  <button className="w-full gradient-brand text-white py-6 px-10 rounded-2xl font-black text-2xl shadow-xl">
                    הזמנת {quantity === 1 ? 'מארז אחד' : `${quantity} מארזים`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-slate-50 text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-black text-center mb-16 text-slate-900">שלבי השימוש</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <Flame />, title: "כיבוי אש", desc: "כבו את מקור החום." },
                { icon: <Droplets />, title: "הוספה", desc: "הוסיפו אבקה לשמן חם." },
                { icon: <Timer />, title: "קירור", desc: "המתינו כ-20 דקות." },
                { icon: <Trash2 />, title: "השלכה", desc: "השליכו את הגוש לפח." }
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm text-center">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="max-w-3xl mx-auto px-4 text-right">
            <h2 className="text-4xl font-black text-center mb-16">שאלות ותשובות</h2>
            <div className="space-y-2">
              <FAQItem question="האם האבקה בטוחה?" answer="כן, CleanFry עשויה מ-100% רכיבים צמחיים ובטוחה לשימוש ביתי." />
              <FAQItem question="האם זה מתאים לכל שמן?" answer="מתאים לכל סוגי שמני הבישול הצמחיים הנפוצים." />
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-slate-900 text-white py-12 text-center">
        <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
