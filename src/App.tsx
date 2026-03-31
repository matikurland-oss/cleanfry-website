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
  ChevronDown, 
  Instagram, 
  Facebook, 
  MessageCircle,
  CheckCircle2,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

// ייבוא הדפים הנוספים
import ContactPage from './ContactPage';
import LegalPage from './LegalPage';
import BlogPage from './BlogPage';
import BlogPostDetail from './BlogPostDetail';
import SuccessPage from './SuccessPage';
import AccessibilityPage from './AccessibilityPage';

// --- קומפוננטת Navbar ---
const Navbar = ({ onPurchaseClick }: { onPurchaseClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
    { name: 'דף הבית', href: '/' },
    { name: 'איך זה עובד', href: '/#how-it-works' },
    { name: 'בלוג', href: '/blog' },
    { name: 'צור קשר', href: '/contact' },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setIsOpen(false); 
    if (href.includes('#')) {
      const id = href.split('#')[1];
      if (location.pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-8 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center cursor-pointer">
            <Link to="/" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <img src="/logo.png" alt="CleanFry Logo" className="h-12 w-auto object-contain" />
            </Link>
          </div>
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href} 
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-slate-600 hover:text-brand-blue font-medium transition-colors"
              >
                {link.name}
              </Link>
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
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="block px-3 py-3 text-base font-medium text-slate-600 hover:text-brand-blue rounded-lg" 
                  onClick={(e) => handleNavClick(e, link.href)}
                >
                  {link.name}
                </Link>
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

// --- קומפוננטת FAQItem ---
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

// --- קומפוננטת Footer ---
const Footer = () => (
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
            <li><Link to="/" className="hover:text-white transition-colors">ראשי</Link></li>
            <li><Link to="/#how-it-works" className="hover:text-white transition-colors">איך זה עובד</Link></li>
            <li><Link to="/blog" className="hover:text-white transition-colors">בלוג</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-6">שירות לקוחות</h4>
          <ul className="space-y-4 text-slate-400">
            <li><Link to="/contact" className="hover:text-white transition-colors">צור קשר</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">מדיניות משלוחים</a></li>
            <li><Link to="/legal" className="hover:text-white transition-colors">תנאי שימוש ופרטיות</Link></li>
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
        <div className="mb-4"><Link to="/accessibility" className="hover:text-white underline underline-offset-4">הצהרת נגישות</Link></div>
        <p>© {new Date().getFullYear()} CleanFry | מ.ק יזמות | כל הזכויות שמורות.</p>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [quantity, setQuantity] = useState(1);
  const purchaseBoxRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const UNIT_PRICE = 59;
  const totalPrice = quantity * UNIT_PRICE;
  const isFreeShipping = totalPrice >= 249;

  const scrollToPurchase = () => {
    if (location.pathname === '/') {
      purchaseBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/#purchase');
    }
  };

  const getButtonText = () => {
    if (quantity === 1) return "הזמנת מארז אחד";
    return `הזמנת ${quantity} מארזים`;
  };

  const HomePage = () => (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-4 pb-24 lg:pt-8 lg:pb-40 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start mb-20">
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex flex-col items-start text-right">
                <div className="relative inline-block mb-4 mt-4 overflow-hidden rounded-2xl">
                  <video
                    src="/logo-anim.mp4"
                    className="h-40 lg:h-64 w-auto object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                  />
                </div>
                {/* כותרת נסתרת לגוגל לשיפור ה-SEO */}
<h2 className="sr-only">CleanFry - אבקה למיצוק שמן בישול, הפתרון המושלם למיצוק שמן טיגון משומש</h2>

<h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6">
  <span className="text-brand-blue">טיגון מושלם.</span><br />
  <span className="text-brand-green">ניקוי קל.</span>
</h1>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-8">
                אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
              </p>
              <div className="flex flex-wrap justify-start items-center gap-2 sm:gap-4 mt-8">
  {/* כפתור 1 - צהוב */}
  <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 px-3 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-md cursor-default hover:scale-105 transition-transform whitespace-nowrap">
    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
    <span className="text-yellow-800 text-sm sm:text-base font-extrabold">100% רכיבים צמחיים</span>
  </div>

  {/* כפתור 2 - ירוק */}
  <div className="flex items-center gap-2 bg-green-100 border-2 border-green-400 px-3 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-md cursor-default hover:scale-105 transition-transform whitespace-nowrap">
    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
    <span className="text-green-800 text-sm sm:text-base font-extrabold">ידידותי לסביבה</span>
  </div>

  {/* כפתור 3 - כחול - הבוסט לגוגל */}
  <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-400 px-3 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-md cursor-default hover:scale-105 transition-transform whitespace-nowrap">
    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
    <h2 className="text-blue-800 text-sm sm:text-base font-extrabold m-0">אבקה למיצוק שמן בישול</h2>
  </div>
</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16 lg:mt-24 relative">
              <div className="absolute -inset-4 bg-brand-blue/5 rounded-full blur-3xl"></div>
              <img src="/product.png" alt="CleanFry Packaging" className="relative rounded-3xl shadow-2xl w-full max-w-lg mx-auto object-cover" />
            </motion.div>
          </div>

          {/* Purchase Box */}
          <div id="purchase" ref={purchaseBoxRef} className="max-w-3xl mx-auto relative z-10 px-4 mt-12">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden text-right">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="flex-1 w-full order-1 text-right">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">בחירת כמות מארזים:</h3>
                <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit ml-auto md:ml-0 shadow-inner">
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setQuantity(Math.max(1, quantity - 1)); }} 
                    className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-sm text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all active:scale-90"
                  >
                    -
                  </button>
                  <span className="text-4xl font-black text-slate-900 min-w-[60px] text-center tabular-nums">
                    {quantity}
                  </span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setQuantity(quantity + 1); }} 
                    className="w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-sm text-3xl font-bold text-brand-blue hover:bg-blue-50 transition-all active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-right border-t md:border-t-0 md:border-r border-slate-100 pt-8 md:pt-0 md:pr-12 order-2">
                <p className="text-slate-500 text-lg mb-1">סה"כ לתשלום:</p>
                <p className="text-6xl font-black text-brand-blue mb-4 tabular-nums">₪{totalPrice}</p>
                
                <div className="h-10 flex items-center">
                  {isFreeShipping ? (
                    <div className="flex items-center gap-2 text-brand-green font-bold bg-green-50 px-4 py-1 rounded-full animate-pulse">
                      <Truck className="w-5 h-5" /><span>משלוח חינם!</span>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm font-medium">משלוח חינם בקנייה מעל 249 ₪</p>
                  )}
                </div>

                <button className="w-full mt-6 gradient-brand text-white py-6 px-10 rounded-2xl font-black text-2xl shadow-xl hover:brightness-110 transition-all min-h-[80px]">
                  {getButtonText()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">שלבי השימוש</h2>
            <p className="text-slate-600 text-lg mb-10">פשוט, מהיר ונקי – כך תהפכו את השמן המשומש לגוש מוצק</p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto mb-16"
            >
              <img 
                src="/how-to-use.jpg" 
                alt="CleanFry - שלבי שימוש" 
                className="rounded-3xl shadow-lg border-4 border-white w-full"
              />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Flame className="w-10 h-10 text-red-500" />, title: "כיבוי האש", desc: "כיבוי מקור החום או הכיריים." },
              { icon: <Droplets className="w-10 h-10 text-yellow-500" />, title: " הוספה וערבוב", desc: "הוספת אבקה כשהשמן חם וערבוב קל." },
              { icon: <Timer className="w-10 h-10 text-blue-500" />, title: "קירור", desc: "המתנה להתמצקות (כ-20 דקות)." },
              { icon: <Trash2 className="w-10 h-10 text-green-500" />, title: "השלכה", desc: "השלכת השמן המוצק לפח האשפה." }
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">שאלות ותשובות</h2>
          </div>
          <div className="space-y-2">
            <FAQItem question="האם האבקה בטוחה לשימוש?" answer="כן, CleanFry מבוססת על רכיבים ממקור צמחי ובטוחה לשימוש ביתי." />
            <FAQItem question="כמה אבקה צריך לשים?" answer="המינון המומלץ הוא כף אחת של אבקה לכל כוס שמן." />
            <FAQItem question="האם ניתן להשתמש בשמן שוב?" answer="לא. ברגע שהשמן התמצק, הוא מיועד להשלכה בלבד." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-blue text-center">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-8">מוכנים לשדרג את המטבח?</h2>
          <button onClick={scrollToPurchase} className="bg-white text-brand-blue px-12 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-105 transition-transform">
            הזמנה עכשיו
          </button>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <div className="bg-brand-yellow py-2 px-4 text-center sticky top-0 z-50 text-sm font-bold">משלוח חינם בקנייה מעל 249 ש״ח!</div>
      <Navbar onPurchaseClick={scrollToPurchase} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostDetail />} />
          <Route path="/thanks" element={<SuccessPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
