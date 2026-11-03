import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { isPromoDismissed, dismissPromo, subscribePromoDismissed } from './promoPopupStore';

// תאריך סיום המבצע - חייב להישאר מסונכרן עם expiresAt של קופון NOV26 ב-Vercel Edge Config,
// כדי שהפופאפ לא יפרסם קוד שכבר לא בתוקף.
const CAMPAIGN_END = new Date('2026-11-30T23:59:59+02:00');

const PromoPopup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => isPromoDismissed());
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribePromoDismissed(setDismissed), []);

  useEffect(() => {
    if (dismissed || new Date() > CAMPAIGN_END) return;
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

  if (dismissed || !visible || location.pathname.startsWith('/checkout') || new Date() > CAMPAIGN_END) {
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

        <p className="text-sm font-bold text-blue-600 mb-2">מבצע חודש נובמבר</p>
        <h2 className="text-2xl font-black text-slate-800 mb-3">15% הנחה על כל ההזמנה!</h2>
        <p className="text-sm text-slate-500 mb-5">הקוד כבר מופעל אוטומטית - רק ללחוץ וליהנות מההנחה</p>

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
