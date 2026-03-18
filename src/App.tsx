import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Flame, Droplets, Timer, Trash2, ChevronDown, CheckCircle2, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = ({ onPurchaseClick }: { onPurchaseClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="bg-white border-b border-slate-100 sticky top-8 z-40 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/logo.png" alt="CleanFry Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#" className="text-slate-600 hover:text-brand-blue font-medium">ראשי</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-brand-blue font-medium">איך זה עובד</a>
            <a href="#contact" className="text-slate-600 hover:text-brand-blue font-medium">צור קשר</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onPurchaseClick} className="hidden sm:block bg-brand-blue text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-blue/90 transition-all">הזמנה עכשיו</button>
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white border-t border-slate-100 overflow-hidden">
            <div className="px-4 pt-2 pb-6 space-y-1 text-right">
              <a href="#" className="block py-3 text-slate-600" onClick={() => setIsOpen(false)}>ראשי</a>
              <button onClick={() => { setIsOpen(false); onPurchaseClick(); }} className="w-full text-right py-3 text-brand-blue font-bold">הזמנה עכשיו</button>
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
      <button className="w-full py-6 flex justify-between items-center text-right" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-lg font-bold text-slate-800">{question}</span>
        <ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-6 text-slate-600 leading-relaxed text-right">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [quantity, setQuantity] = useState(1);
  const purchaseBoxRef = useRef<HTMLDivElement>(null);
  const totalPrice = quantity * 49;
  const isFreeShipping = totalPrice >= 249;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-brand-yellow py-2 text-center sticky top-0 z-50 text-sm font-bold text-slate-900">משלוח חינם מעל 249 ש״ח!</div>
      <Navbar onPurchaseClick={() => purchaseBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
      <main>
        <section className="pt-12 pb-24 px-4 max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start mb-20">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
                <img src="/logo.png" className="h-24 lg:h-32 mb-4 mix-blend-multiply" /> <br />
                <span className="text-brand-blue">טיגון מושלם.</span> <br />
                <span className="text-brand-green">ניקוי קל.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-xl text-right">אבקה טבעית למיצוק שמן בישול. הופכת שמן משומש לגוש מוצק שניתן להשליך בקלות לאשפה.</p>
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-8">
                {["100% טבעי", "ידידותי לסביבה", "מגן על הניקוז"].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-slate-800 text-xl font-bold">
                    <CheckCircle2 className="text-brand-green" /> <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-16 lg:mt-0 relative flex justify-center">
              <img src="https://lh3.googleusercontent.com/d/17qNHAp5sP3qq2aZdyf3vzxa2BRo2jq_Y" alt="CleanFry Product" className="rounded-3xl shadow-2xl w-full max-w-lg" />
            </motion.div>
          </div>

          <motion.div ref={purchaseBoxRef} className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 w-full text-right">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">בחירת כמות:</h3>
              <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl w-fit ml-auto">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 bg-white rounded-xl shadow text-2xl font-bold text-brand-blue">-</button>
                <span className="text-4xl font-black">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 bg-white rounded-xl shadow text-2xl font-bold text-brand-blue">+</button>
              </div>
            </div>
            <div className="flex-1 w-full text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12">
              <p className="text-slate-500 text-lg">סה"כ:</p>
              <p className="text-6xl font-black text-brand-blue mb-4">₪{totalPrice}</p>
              {isFreeShipping ? <div className="text-brand-green font-bold animate-pulse">משלוח חינם!</div> : <p className="text-slate-400 text-sm mb-6">משלוח חינם מעל 249 ₪</p>}
              <button className="w-full bg-brand-blue text-white py-6 rounded-2xl font-black text-2xl shadow-xl transition-transform hover:scale-105">הזמנת {quantity} מארזים</button>
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="py-24 bg-slate-50 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-black text-center mb-16">איך זה עובד?</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <Flame />, title: "כיבוי", desc: "מכבים את האש." },
                { icon: <Droplets />, title: "הוספה", desc: "מוסיפים אבקה לשמן חם." },
                { icon: <Timer />, title: "קירור", desc: "ממתינים כ-20 דקות." },
                { icon: <Trash2 />, title: "השלכה", desc: "משליכים את הגוש לפח." }
              ].map((step, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm text-center">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-blue">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">שאלות ותשובות</h2>
          <FAQItem question="זה בטוח לשימוש?" answer="כן, CleanFry עשויה מ-100% רכיבים ממקור צמחי." />
          <FAQItem question="האם זה מתאים לכל סוגי השמנים?" answer="בהחלט, לכל סוגי שמני הבישול הצמחיים הנפוצים." />
        </section>
      </main>
      <footer id="contact" className="bg-slate-900 text-white py-12 text-center text-slate-400">
        <p>© {new Date().getFullYear()} CleanFry. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
