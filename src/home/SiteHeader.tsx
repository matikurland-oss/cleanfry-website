import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { isShoppingIlPromoActive } from '../shoppingIlPromo';
import { getCookieConsent, subscribeCookieConsent } from '../cookieConsentStore';
import { BagIcon, CloseIcon, MenuIcon } from './icons';
import { container, gutter, pill } from './layout';

const NAV_LINKS = [
  { name: 'לרכישה', href: '/#shop' },
  { name: 'איך זה עובד', href: '/#how' },
  { name: 'למה CleanFry', href: '/#why' },
  { name: 'שאלות ותשובות', href: '/#faq' },
  { name: 'בלוג', href: '/blog' },
  { name: 'צור קשר', href: '/contact' },
];

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // טעינת רכיב הנגישות של UserWay — רק אחרי הסכמה לעוגיות (ללא שינוי מההתנהגות הקודמת)
  useEffect(() => {
    const loadUserWay = (choice: ReturnType<typeof getCookieConsent>) => {
      if (choice !== 'accepted') return;
      if (document.getElementById('userway-widget')) return;
      const script = document.createElement('script');
      script.setAttribute('data-account', 'XQfDpHYmO1');
      script.src = 'https://cdn.userway.org/widget.js';
      script.async = true;
      script.id = 'userway-widget';
      document.body.appendChild(script);
    };
    loadUserWay(getCookieConsent());
    return subscribeCookieConsent(loadUserWay);
  }, []);

  // קישור לעוגן בדף הבית: כשכבר נמצאים בדף הבית גוללים במקום, אחרת הניווט ל-/#id והגלילה נעשית בדף הבית
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    setIsOpen(false);
    if (!href.includes('#') || location.pathname !== '/') return;
    const id = href.split('#')[1];
    const element = document.getElementById(id);
    if (!element) return;
    e.preventDefault();
    element.scrollIntoView({ behavior: 'smooth' });
    window.history.replaceState(null, '', `/#${id}`);
  };

  const linkClass = 'rounded-md text-cf-navy no-underline transition-colors hover:text-cf-blue';

  return (
    <header className="cf-focus sticky top-0 z-40 border-b border-cf-border bg-cf-cream font-display text-cf-navy">
      <div className={`${container} ${gutter} flex min-h-[76px] items-center justify-between gap-4 py-3`}>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/" aria-label="CleanFry – לדף הבית" onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center">
            <img src="/logo.webp" alt="CleanFry" width={157} height={44} className="block h-11 w-auto" />
          </Link>
          {isShoppingIlPromoActive() && (
            <img src="/shopping-il-badge.svg" alt="Shopping IL by Google" width={36} height={36} className="h-9 w-9 rounded-md" />
          )}
        </div>

        <nav aria-label="ניווט ראשי" className="hidden flex-wrap justify-center gap-x-[clamp(14px,2vw,28px)] gap-y-2 text-base font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} to={link.href} onClick={(e) => handleNavClick(e, link.href)} className={linkClass}>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to="/checkout"
            className={`${pill} min-h-11 gap-2 bg-cf-navy px-[22px] text-[15px] font-bold text-cf-cream no-underline max-sm:hidden`}
          >
            <BagIcon size={18} />
            לסל הקניות
          </Link>
          {/* מובייל: אייקון סל והמבורגר בשורה אחת, כמו היום */}
          <Link to="/checkout" aria-label="מעבר לסל הקניות" className="flex h-11 w-11 items-center justify-center rounded-full text-cf-navy sm:hidden">
            <BagIcon size={24} />
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-cf-navy lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'סגירת התפריט' : 'פתיחת התפריט'}
          >
            {isOpen ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="ניווט ראשי"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-cf-border bg-cf-cream lg:hidden"
          >
            <div className={`${gutter} flex flex-col gap-1 pb-5 pt-2`}>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex min-h-12 items-center rounded-xl px-3 text-lg font-medium text-cf-navy hover:bg-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
