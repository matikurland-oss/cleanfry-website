import { Link } from 'react-router-dom';
import { isShoppingIlPromoActive } from '../shoppingIlPromo';
import { setCookieConsent } from '../cookieConsentStore';
import { container, gutter } from './layout';

const colTitle = 'mb-1 text-[17px] font-bold text-cf-cream';
const footLink = 'inline-flex min-h-6 items-center text-cf-on-navy no-underline transition-colors hover:text-white';

export default function SiteFooter() {
  return (
    <footer id="contact" className="cf-focus cf-on-navy bg-cf-navy pb-8 pt-[clamp(48px,6vw,72px)] font-display text-cf-on-navy">
      <div className={`${container} ${gutter} flex flex-col gap-10`}>
        <div className="flex flex-wrap justify-between gap-10">
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5">
            <span className="inline-flex self-start rounded-2xl bg-cf-cream px-4 py-2.5">
              <img src="/logo.webp" alt="CleanFry" width={135} height={38} loading="lazy" className="block h-[38px] w-auto" />
            </span>
            <p className="m-0 max-w-[320px] text-base leading-relaxed">
              הפתרון המושלם למיצוק והשלכת שמן בישול משומש. שומרים על המטבח נקי ועל הסביבה ירוקה.
            </p>
            {isShoppingIlPromoActive() && (
              <img src="/shopping-il-badge.svg" alt="Shopping IL by Google" width={48} height={48} loading="lazy" className="h-12 w-12 rounded-lg" />
            )}
          </div>

          <nav aria-label="ניווט מהיר" className="flex flex-[0_1_200px] flex-col gap-2.5 text-base">
            <h2 className={colTitle}>ניווט מהיר</h2>
            <Link to="/" className={footLink}>ראשי</Link>
            <Link to="/#how" className={footLink}>איך זה עובד</Link>
            <Link to="/blog" className={footLink}>בלוג</Link>
            <Link to="/contact" className={footLink}>צור קשר</Link>
          </nav>

          <nav aria-label="מידע" className="flex flex-[0_1_220px] flex-col gap-2.5 text-base">
            <h2 className={colTitle}>מידע</h2>
            <Link to="/shipping-policy" className={footLink}>מדיניות משלוחים</Link>
            <Link to="/legal" className={footLink}>תנאי שימוש ופרטיות</Link>
            <Link to="/cancellation-policy" className={footLink}>מדיניות ביטולים והחזרות</Link>
            <Link to="/accessibility" className={footLink}>הצהרת נגישות</Link>
          </nav>

          <div className="flex flex-[0_1_220px] flex-col gap-2.5 text-base">
            <h2 className={colTitle}>דברו איתנו</h2>
            <a href="https://wa.me/972559550453" target="_blank" rel="noopener noreferrer" className={`${footLink} font-bold !text-cf-lime`}>
              וואטסאפ: <span dir="ltr" className="ms-1">055-9550453</span>
            </a>
            <a href="https://www.instagram.com/cleanfry_official/" target="_blank" rel="noopener noreferrer" className={footLink}>
              אינסטגרם <span dir="ltr" className="ms-1">@cleanfry_official</span>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61574285984183" target="_blank" rel="noopener noreferrer" className={footLink}>
              פייסבוק
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#2C4A62] pt-5 text-sm text-[#9FB3C3]">
          <p className="m-0">© {new Date().getFullYear()} CleanFry | מ.ק יזמות | כל הזכויות שמורות.</p>
          <button type="button" onClick={() => setCookieConsent(null)} className="min-h-6 underline underline-offset-4 hover:text-white">
            ניהול העדפות עוגיות
          </button>
        </div>
      </div>
    </footer>
  );
}
