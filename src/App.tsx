/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  Flame, 
  Droplets, 
  Timer, 
  Trash2, 
  ChevronDown, 
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
            {/* זה התיקון ללוגו - נתיב יחסי לקובץ בתיקיית public */}
            <img 
              src="/logo.png" 
              alt="CleanFry Logo" 
              className="h-12 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>

          <div className="hidden md:flex gap-8">
            <a href="#" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">ראשי</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">איך זה עובד</a>
            <a href="#contact" className="text-slate-600 hover:text-brand-blue font-medium transition-colors">צור קשר</a>
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
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50 text-sm font-bold text-slate-900 shadow-sm">
        משלוח חינם בקנייה מעל 249 ש״ח!
      </div>

      <Navbar onPurchaseClick={scrollToPurchase} />

      <main>
        <section className="relative overflow-hidden pt-12 pb-24 text-right px-4 max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center mb-20">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                <span className="text-brand-blue">טיגון מושלם.</span> <br />
                <span className="text-brand-green">ניקוי קל.</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-8">
                אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה.
              </p>
              
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                  {["100% טבעי", "ידידותי לסביבה", "מגן על הניקוז"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                      <CheckCircle2 className="w-6 h-6 text-brand-green flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-16 lg:mt-0 relative flex justify-center">
              <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
              {/* שימוש בתמונה המקורית שלך */}
              <img 
                src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3vzxa2BRo2jq_Y" 
                alt="CleanFry Product" 
                className="relative rounded-3xl shadow-2xl w-full max-w-lg object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          <motion.div ref={purchaseBoxRef} className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 text-right">
            <div className="flex-1 w-full order-1">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">בחירת כמות:</h3>
              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit ml-auto">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white rounded-xl shadow-md text-2xl font-bold text-brand-blue">-</button>
                <span className="text-4xl font-black text-slate-900 min-w-[50px] text-center font-mono">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-white rounded-xl shadow-md text-2xl font-bold text-brand-blue">+</button>
              </div>
            </div>
            <div className="flex-1 w-full text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12 order-2">
              <p className="text-slate-500 text-lg mb-1">סה"כ לתשלום:</p>
              <p className="text-6xl font-black text-brand-blue mb-4">₪{totalPrice}</p>
              {isFreeShipping ? (
                <div className="flex items-center gap-2 text-brand-green font-bold bg-green-50 px-4 py-2 rounded-full mb-6 animate-pulse justify-center md:justify-start"><Truck className="w-5 h-5" /><span>משלוח חינם!</span></div>
              ) : (
                <p className="text-slate-400 text-sm mb-6 font-medium">משלוח חינם בקנייה מעל 249 ₪</p>
              )}
              <button className="w-full bg-brand-blue text-white py-6 px-10 rounded-2xl font-black text-2xl shadow-xl hover:scale-105 transition-transform">
                הזמנת {quantity} מארזים
              </button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white py-12 text-center text-slate-400">
        <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
