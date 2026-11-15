import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackCartEvent } from '../analytics';
import {
  FREE_SHIPPING_THRESHOLD_AGOROT,
  MAX_QUANTITY,
  MIN_QUANTITY,
  UNIT_PRICE_AGOROT,
  agorotToShekels,
} from '../../shared/pricing';
import { CheckIcon, MinusIcon, PlusIcon } from './icons';
import { container, gutter, pill, sectionTitle } from './layout';

const BULLETS = ['מתאים לכל שמני המאכל, וגם לשומן מן החי', 'כף אבקה לכל כוס שמן', 'בלי נזילות ובלי ריחות בפח'];

// כרטיס המוצר. הלוגיקה זהה לתיבת הרכישה הקודמת: כמות 1–10, view_item פעם אחת כשהכרטיס נראה,
// add_to_cart ומעבר ל-/checkout?q=N. התמחור הסופי (קופון, משלוח) נקבע בצ'קאאוט ובשרת כמו קודם.
export default function ShopCard({ purchaseBoxRef }: { purchaseBoxRef: React.RefObject<HTMLDivElement | null> }) {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const box = purchaseBoxRef.current;
    if (!box) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trackCartEvent('view_item', 1);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const handleBuyClick = () => {
    trackCartEvent('add_to_cart', quantity);
    navigate(`/checkout?q=${quantity}`);
  };

  // חישובי תצוגה בלבד, מאותם קבועים שהשרת משתמש בהם (shared/pricing.ts)
  const totalPrice = agorotToShekels(quantity * UNIT_PRICE_AGOROT);
  const remainingForFreeShipping = agorotToShekels(FREE_SHIPPING_THRESHOLD_AGOROT - quantity * UNIT_PRICE_AGOROT);
  const isFreeShipping = remainingForFreeShipping <= 0;

  const buttonText = quantity === 1 ? 'הזמנת מארז אחד' : `הזמנת ${quantity} מארזים`;
  const stepBtn = 'flex h-[52px] w-[52px] items-center justify-center text-cf-navy transition-colors hover:bg-cf-cream disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <section id="shop" aria-labelledby="shop-title" className={`${gutter} py-[clamp(48px,7vw,104px)]`}>
      <span id="purchase" className="block" aria-hidden="true" />
      <div className={container}>
        <h2 id="shop-title" className={`${sectionTitle} mb-8 text-center`}>מארז אחד. המון טיגונים.</h2>
        <div id="shop-card" className="flex flex-wrap overflow-hidden rounded-cf-block border border-cf-border bg-white">
          <div className="flex min-w-0 flex-[1_1_420px] items-center justify-center bg-cf-green-light p-[clamp(20px,4vw,56px)]">
            <img
              src="/shop-960.webp"
              srcSet="/shop-640.webp 640w, /shop-960.webp 960w, /shop-1280.webp 1280w"
              sizes="(min-width: 900px) 520px, 90vw"
              width={960}
              height={800}
              loading="lazy"
              alt="מארז CleanFry – אבקה למיצוק שמן בישול, על שיש המטבח"
              className="block h-auto w-full max-w-[520px] rounded-cf-card"
            />
          </div>

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 p-[clamp(24px,4vw,56px)]">
            <span className="self-start rounded-full bg-cf-navy px-3.5 py-1.5 text-[13px] font-bold text-cf-cream">המוצר שלנו</span>
            <h3 className="m-0 text-[clamp(28px,2.8vw,40px)] font-extrabold leading-tight">CleanFry – אבקה למיצוק שמן בישול</h3>
            <p className="m-0 text-lg leading-relaxed text-cf-body">
              אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[17px]">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <CheckIcon size={20} className="shrink-0 text-cf-green" />
                  {b}
                </li>
              ))}
            </ul>

            {/* אזור הרכישה — עליו נמדד view_item, כמו תיבת הרכישה הקודמת */}
            <div ref={purchaseBoxRef} id="shop-buy" className="flex flex-col gap-5 pt-1.5">
            <div className="flex flex-col gap-2.5">
              <span id="qty-label" className="text-base font-bold">בחירת כמות מארזים</span>
              <div className="flex flex-wrap items-center gap-4">
                <div role="group" aria-labelledby="qty-label" className="inline-flex items-center overflow-hidden rounded-full border-2 border-cf-navy">
                  <button
                    type="button"
                    aria-label="הפחתת מארז"
                    className={stepBtn}
                    disabled={quantity <= MIN_QUANTITY}
                    onClick={() => setQuantity(Math.max(MIN_QUANTITY, quantity - 1))}
                  >
                    <MinusIcon size={22} />
                  </button>
                  <span aria-live="polite" className="min-w-11 text-center text-xl font-extrabold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    aria-label="הוספת מארז"
                    className={stepBtn}
                    disabled={quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity(Math.min(MAX_QUANTITY, quantity + 1))}
                  >
                    <PlusIcon size={22} />
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-cf-muted">סה״כ לתשלום</span>
                  <span className="text-[34px] font-black leading-[1.1] tabular-nums" aria-live="polite">₪{totalPrice}</span>
                </div>
              </div>
            </div>

            <p className="m-0 rounded-[18px] bg-cf-cream px-[18px] py-3.5 text-[15px] leading-normal text-cf-body" aria-live="polite">
              {isFreeShipping ? (
                <strong className="font-bold text-cf-green-dark">יש לכם משלוח חינם!</strong>
              ) : (
                <>
                  <span>עוד ₪{remainingForFreeShipping} למשלוח חינם</span>
                  <span> · אפשר גם איסוף עצמי ללא עלות</span>
                </>
              )}
            </p>

            <button
              type="button"
              onClick={handleBuyClick}
              className={`${pill} min-h-[60px] w-full bg-cf-green px-6 text-[19px] font-extrabold text-white`}
            >
              {buttonText} – ₪{totalPrice}
            </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
