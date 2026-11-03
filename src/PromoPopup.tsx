import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { isPromoDismissed, dismissPromo, subscribePromoDismissed } from './promoPopupStore';
import { SHOPPING_IL_PROMO_END } from './shoppingIlPromo';

const PromoPopup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => isPromoDismissed());
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribePromoDismissed(setDismissed), []);

  useEffect(() => {
    if (dismissed || new Date() > SHOPPING_IL_PROMO_END) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleClose = () => {
    setVisible(false);
    dismissPromo();
  };

  const handleClaim = () => {
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
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <button
          onClick={handleClose}
          aria-label="סגור"
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 transition-colors"
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

        <p className="text-sm font-bold text-blue-600 mb-2">3 ימים בלבד • בשיתוף Shopping IL</p>
        <h2 className="text-2xl font-black text-slate-800 mb-3">18% הנחה — בלי מע"מ — על כל ההזמנה!</h2>
        <p className="text-sm text-slate-500 mb-5">לכבוד שיתוף הפעולה עם Shopping IL - הקוד כבר מופעל אוטומטית, רק ללחוץ וליהנות</p>

        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-3 mb-6">
          <span className="font-black text-xl tracking-widest text-slate-800">NOV26</span>
        </div>

        <button
          onClick={handleClaim}
          className="w-full gradient-brand text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:brightness-110 transition-all"
        >
          לקטיפת המבצע
        </button>
      </div>
    </div>
  );
};

export default PromoPopup;
