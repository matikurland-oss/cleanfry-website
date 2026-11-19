import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { isPromoDismissed, dismissPromo, subscribePromoDismissed } from './promoPopupStore';
import { SHOPPING_IL_PROMO_END } from './shoppingIlPromo';
import { track } from './analytics';
import { btnPrimary } from './home/layout';

const PromoPopup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => isPromoDismissed());
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribePromoDismissed(setDismissed), []);

  useEffect(() => {
    if (dismissed || new Date() > SHOPPING_IL_PROMO_END) return;
    const timer = setTimeout(() => {
      setVisible(true);
      track('promo_popup_view', { promotion_id: 'NOV26' });
    }, 1500);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleClose = () => {
    track('promo_popup_close', { promotion_id: 'NOV26' });
    setVisible(false);
    dismissPromo();
  };

  const handleClaim = () => {
    track('promo_popup_click', { promotion_id: 'NOV26' });
    setVisible(false);
    dismissPromo();
    navigate('/checkout?q=1&coupon=NOV26');
  };

  if (dismissed || !visible || location.pathname.startsWith('/checkout') || new Date() > SHOPPING_IL_PROMO_END) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
        className="cf-focus relative w-full max-w-sm rounded-[32px] bg-white p-8 text-center font-display text-cf-navy shadow-2xl"
      >
        <button
          onClick={handleClose}
          aria-label="סגור"
          className="absolute left-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-cf-muted transition-colors hover:bg-cf-cream hover:text-cf-navy"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center mb-4">
          <img
            src="/shopping-il-badge.svg"
            alt="Shopping IL by Google"
            width={72}
            height={72}
            loading="lazy"
            className="h-[72px] w-[72px] rounded-xl"
          />
        </div>

        <p className="mx-auto mb-3 mt-0 inline-block rounded-full bg-cf-green-light px-3.5 py-1.5 text-[13px] font-bold text-cf-green-dark">3 ימים בלבד בשיתוף Shopping IL</p>
        <h2 id="promo-title" className="mb-3 mt-0 text-[26px] font-black leading-tight">18% הנחה בלי מע"מ על כל ההזמנה!</h2>
        <p className="mb-5 mt-0 text-[15px] text-cf-body">לכבוד השיתוף עם Shopping IL הקוד כבר מופעל אוטומטית, רק ללחוץ וליהנות</p>

        <div className="mb-6 rounded-[18px] border-2 border-dashed border-cf-border bg-cf-cream py-3">
          <span className="text-xl font-black tracking-widest">NOV26</span>
        </div>

        <button
          onClick={handleClaim}
          className={`${btnPrimary} w-full`}
        >
          לקטיפת המבצע
        </button>
      </div>
    </div>
  );
};

export default PromoPopup;
