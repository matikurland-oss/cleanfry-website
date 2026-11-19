import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackCartEvent } from '../analytics';
import {
  FREE_SHIPPING_MIN_QUANTITY,
  MAX_QUANTITY,
  MIN_QUANTITY,
  REGULAR_HOME_SHIPPING_AGOROT,
  priceOrder,
  type DeliveryMethod,
  type PickupLocation,
} from '../../shared/pricing';
import { formatShekels, orderSavings, packsLabel, savingsText, shippingNote } from '../pricingDisplay';
import { CheckIcon, MinusIcon, PlusIcon, TruckIcon } from './icons';
import { gutter, pill } from './layout';
import { scrollToSection } from './scroll';

const BULLETS = ['מתאים לכל שמני המאכל, וגם לשומן מן החי', 'כף אבקה לכל כוס שמן', 'בלי נזילות ובלי ריחות בפח'];

/** כרטיסי המארזים. כמות אחרת (עד MAX_QUANTITY) נבחרת בבורר הכמות */
const PACK_QUANTITIES = [1, 3, 5] as const;

const IMAGES = [
  { id: 'shop', label: 'מארז המוצר', alt: 'מארז CleanFry – אבקה למיצוק שמן בישול, על שיש המטבח' },
  { id: 'hero', label: 'השלכת השמן המוצק', alt: 'גוש שמן מוצק שנוצר עם CleanFry מושלך לפח בלי נזילות' },
] as const;
const imageSrcSet = (id: string) => `/${id}-640.webp 640w, /${id}-960.webp 960w, /${id}-1280.webp 1280w`;

type ShipOption = 'home' | PickupLocation;
const SHIP_OPTIONS: { id: ShipOption; label: string }[] = [
  { id: 'home', label: 'משלוח עד הבית' },
  { id: 'tel-aviv', label: 'איסוף מתל אביב' },
  { id: 'kfar-saba', label: 'איסוף מכפר סבא' },
];

/** מחיר מחוק. קורא המסך מקבל srText (למשל ״במקום 35 שקלים״) במקום הסכום המחוק */
function Was({ agorot, srText, className = '' }: { agorot: number; srText: string; className?: string }) {
  return (
    <del className={`font-medium decoration-2 ${className}`}>
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true">₪{formatShekels(agorot)}</span>
    </del>
  );
}

const shippingWas = (className: string) => (
  <Was
    agorot={REGULAR_HOME_SHIPPING_AGOROT}
    srText={`במקום ${formatShekels(REGULAR_HOME_SHIPPING_AGOROT)} שקלים`}
    className={`ms-1.5 ${className}`}
  />
);

// אזור המוצר והרכישה בדף הבית. view_item נשלח פעם אחת כשאזור הבחירה נראה, add_to_cart במעבר לעגלה
// (מהכפתור הראשי או מהפס הקבוע במובייל — אותו handler).
// כל המחירים מחושבים ב-shared/pricing.ts — אותה פונקציה שהשרת מחייב לפיה.
export default function ShopCard({ purchaseBoxRef }: { purchaseBoxRef: React.RefObject<HTMLDivElement | null> }) {
  const [quantity, setQuantity] = useState(3);
  const [ship, setShip] = useState<ShipOption>('home');
  const [imageIndex, setImageIndex] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [buyBelowView, setBuyBelowView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const buyRef = useRef<HTMLButtonElement>(null);
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

  // פס הרכישה במובייל: מוצג כשאזור המוצר במסך והכפתור הראשי עוד לא נראה (מתחת למסך).
  // אחרי שעוברים את הכפתור הפס נעלם, כדי לא לכסות את שאר הדף.
  useEffect(() => {
    const section = sectionRef.current;
    const buy = buyRef.current;
    if (!section || !buy) return;
    const sectionObserver = new IntersectionObserver(([entry]) => setSectionInView(entry.isIntersecting));
    const buyObserver = new IntersectionObserver(([entry]) => {
      setBuyBelowView(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    }, { threshold: 0.5 });
    sectionObserver.observe(section);
    buyObserver.observe(buy);
    return () => {
      sectionObserver.disconnect();
      buyObserver.disconnect();
    };
  }, []);

  const deliveryMethod: DeliveryMethod = ship === 'home' ? 'delivery' : 'pickup';
  const price = priceOrder({ quantity, deliveryMethod, coupon: null });
  const savings = orderSavings(price, deliveryMethod);
  const savingLine = savingsText(savings);
  const shipLabel = SHIP_OPTIONS.find((o) => o.id === ship)!.label;
  const total = `₪${formatShekels(price.totalAgorot)}`;
  const image = IMAGES[imageIndex];

  const handleBuyClick = () => {
    trackCartEvent('add_to_cart', quantity);
    const params = new URLSearchParams({ q: String(quantity) });
    if (ship !== 'home') {
      params.set('ship', 'pickup');
      params.set('loc', ship);
    }
    navigate(`/checkout?${params}`);
  };

  const goToPacks = (e: React.MouseEvent) => {
    if (scrollToSection('shop')) e.preventDefault();
  };

  const stepBtn = 'flex h-[48px] w-[48px] items-center justify-center text-cf-navy transition-colors hover:bg-cf-cream disabled:cursor-not-allowed disabled:opacity-40';
  const block = 'min-w-0 rounded-[28px] md:rounded-[36px]';

  return (
    <section ref={sectionRef} id="shop" aria-labelledby="shop-title" className={`${gutter} py-[clamp(48px,7vw,104px)]`}>
      <span id="purchase" className="block" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-7">
        {/* תמונה וטקסט */}
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-11">
          <div className="min-w-0">
            <div className={`overflow-hidden ${block} bg-cf-green-light`}>
              <img
                src={`/${image.id}-960.webp`}
                srcSet={imageSrcSet(image.id)}
                sizes="(min-width: 1260px) 568px, (min-width: 768px) calc(50vw - 62px), calc(100vw - 32px)"
                width={1280}
                height={1066}
                loading="lazy"
                alt={image.alt}
                className="block aspect-[1280/1066] h-auto w-full object-cover"
              />
            </div>
            <div role="group" aria-label="תמונות המוצר" className="mt-3 flex gap-2.5">
              {IMAGES.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`הצגת ${img.label}`}
                  aria-pressed={i === imageIndex}
                  onClick={() => setImageIndex(i)}
                  className={`h-[58px] w-[68px] rounded-[14px] border-2 bg-transparent p-[3px] transition-colors ${i === imageIndex ? 'border-cf-green' : 'border-cf-border hover:border-cf-green/50'}`}
                >
                  <img src={`/${img.id}-640.webp`} width={640} height={533} alt="" loading="lazy" className="block h-full w-full rounded-[9px] object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-start gap-4 md:gap-5">
            <span className="rounded-full bg-cf-green-light px-4 py-2 text-[12px] font-bold text-cf-green-dark sm:text-sm">CleanFry — אבקה למיצוק שמן בישול</span>
            <h2 id="shop-title" className="m-0 text-[clamp(36px,4.4vw,56px)] font-black leading-[1.08] tracking-[-0.02em]">
              בחרו מארז.
              <br />
              <span className="text-cf-green">חסכו יותר.</span>
            </h2>
            <h3 className="m-0 text-[clamp(21px,2.1vw,28px)] font-extrabold leading-[1.3]">CleanFry – אבקה למיצוק שמן בישול</h3>
            <p className="m-0 max-w-[640px] text-[clamp(16px,1.6vw,18px)] leading-relaxed text-cf-body">
              אבקה חדשנית, 100% ממקור צמחי, למיצוק שמן בישול. הופכת את השמן המשומש לגוש מוצק וקשיח, המאפשר השלכה בטוחה ונקייה לאשפה. זהו פתרון ידידותי לסביבה השומר על מטבח נקי ומגן על צנרת הניקוז.
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] leading-normal text-cf-body sm:text-base">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-center gap-2.5">
                  <CheckIcon size={20} className="shrink-0 text-cf-green" />
                  {b}
                </li>
              ))}
            </ul>
            <a href="#shop" onClick={goToPacks} className="flex min-h-11 items-center font-bold text-cf-green-dark underline underline-offset-[5px]">
              לבחירת המארז שלכם <span aria-hidden="true" className="ms-1">↓</span>
            </a>
          </div>
        </div>

        {/* בחירה וסיכום — עליו נמדד view_item */}
        <div ref={purchaseBoxRef} id="shop-card" className="flex flex-wrap items-start gap-7">
          <section aria-labelledby="packs-label" className={`${block} flex flex-[999_1_560px] flex-col gap-[26px] border border-cf-border bg-white p-[clamp(18px,3vw,36px)]`}>
            <h3 id="packs-label" className="m-0 text-[22px] font-extrabold leading-[1.3] sm:text-2xl">כמה מארזים בשבילכם?</h3>

            <div role="group" aria-labelledby="packs-label" className="grid gap-3.5 sm:grid-cols-3 sm:pt-1.5">
              {PACK_QUANTITIES.map((qty) => {
                const p = priceOrder({ quantity: qty, deliveryMethod: 'delivery', coupon: null });
                const selected = qty === quantity;
                const tagged = qty === FREE_SHIPPING_MIN_QUANTITY;
                return (
                  <button
                    key={qty}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setQuantity(qty)}
                    className={`relative grid min-w-0 grid-cols-[1fr_auto] gap-x-3 gap-y-2 rounded-[20px] border-[3px] px-4 py-[18px] text-right text-cf-navy transition-colors sm:flex sm:flex-col sm:gap-3 sm:rounded-cf-card sm:px-3.5 sm:pb-[18px] sm:pt-[22px] ${tagged ? 'mt-1.5 pt-[23px] sm:mt-0' : ''} ${selected ? 'border-cf-green bg-cf-green-light' : 'border-cf-border bg-cf-cream hover:border-cf-green/50'}`}
                  >
                    {tagged && (
                      <span className="absolute -top-[13px] right-3.5 whitespace-nowrap rounded-full bg-cf-green px-3 py-[5px] text-[12px] font-bold text-white">משלוח חינם</span>
                    )}
                    <span className="col-start-1 row-start-1 text-[15px] font-bold text-cf-muted">{packsLabel(qty)}</span>
                    <span className="col-start-2 row-span-2 row-start-1 flex flex-col items-end justify-center gap-[7px] sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-start sm:gap-2">
                      <span className="text-[30px] font-black leading-none tabular-nums lg:text-[34px]">₪{formatShekels(p.productsAfterDiscountAgorot)}</span>
                      {p.savedAgorot > 0 && (
                        <Was
                          agorot={p.listSubtotalAgorot}
                          srText={`מחיר רגיל ${formatShekels(p.listSubtotalAgorot)} שקלים`}
                          className="text-base text-cf-muted decoration-[#B42318] tabular-nums sm:text-lg"
                        />
                      )}
                    </span>
                    <span className="col-start-1 row-start-2 flex flex-col gap-1 sm:mt-auto sm:gap-2">
                      <span className="text-[13px] font-bold text-cf-green-dark sm:text-sm">
                        {p.savedAgorot > 0 ? `חוסכים ₪${formatShekels(p.savedAgorot)}` : 'מחיר רגיל'}
                      </span>
                      <span className="text-[12px] leading-normal text-cf-muted sm:text-[13px]">
                        {p.homeShippingAgorot === 0 ? 'משלוח חינם' : <>משלוח ₪{formatShekels(p.homeShippingAgorot)}</>}
                        {p.homeShippingAgorot > 0 && p.homeShippingAgorot < REGULAR_HOME_SHIPPING_AGOROT && shippingWas('decoration-[#B42318]')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span id="qty-label" className="text-[15px] font-bold">או כמות אחרת</span>
                <div role="group" aria-labelledby="qty-label" className="inline-flex items-center self-start overflow-hidden rounded-full border-2 border-cf-navy">
                  <button
                    type="button"
                    aria-label="הורדת מארז"
                    className={stepBtn}
                    disabled={quantity <= MIN_QUANTITY}
                    onClick={() => setQuantity(Math.max(MIN_QUANTITY, quantity - 1))}
                  >
                    <MinusIcon size={22} />
                  </button>
                  <span aria-live="polite" className="min-w-10 text-center text-xl font-extrabold tabular-nums">{quantity}</span>
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
              </div>
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                <span id="ship-label" className="text-[15px] font-bold">איך לקבל?</span>
                <div role="group" aria-labelledby="ship-label" className="flex flex-wrap gap-2">
                  {SHIP_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={ship === o.id}
                      onClick={() => setShip(o.id)}
                      className={`min-h-11 rounded-full border-2 px-[11px] text-[13px] font-medium transition-colors sm:px-4 sm:text-[15px] ${ship === o.id ? 'border-cf-navy bg-cf-navy text-cf-cream' : 'border-cf-border bg-white text-cf-navy hover:border-cf-navy/40'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="m-0 flex items-center gap-2.5 rounded-[18px] bg-cf-green-light px-[18px] py-3.5 text-[15px] font-medium leading-snug text-cf-green-dark sm:text-base">
              <TruckIcon size={22} className="shrink-0" />
              <span>{shippingNote()}</span>
            </p>
          </section>

          <aside id="shop-buy" aria-labelledby="summary-title" className={`${block} cf-on-navy flex flex-[1_1_320px] flex-col gap-4 bg-cf-navy p-[26px] text-cf-cream sm:p-[30px]`}>
            <h3 id="summary-title" className="m-0 text-[22px] font-extrabold leading-[1.3]">סיכום הזמנה</h3>
            <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-4">
              <div className="flex justify-between gap-3 text-[17px] text-cf-on-navy">
                <span>{packsLabel(quantity)}</span>
                <span className="tabular-nums">₪{formatShekels(price.productsAfterDiscountAgorot)}</span>
              </div>
              <div className="flex justify-between gap-3 text-[17px] text-cf-on-navy">
                <span>{shipLabel}</span>
                <span className="tabular-nums">
                  {price.shippingAgorot === 0 ? 'חינם' : `₪${formatShekels(price.shippingAgorot)}`}
                  {savings.shippingAgorot > 0 && shippingWas('text-cf-on-navy decoration-cf-lime')}
                </span>
              </div>
              {savingLine && <p className="m-0 text-[15px] font-bold leading-normal text-cf-lime">{savingLine}</p>}
              <div className="flex items-baseline justify-between gap-3 border-t border-cf-muted pt-4 font-bold text-cf-cream">
                <span>סה״כ לתשלום</span>
                <strong className="text-[30px] font-black tabular-nums sm:text-[36px]">{total}</strong>
              </div>
            </div>
            <button
              ref={buyRef}
              type="button"
              onClick={handleBuyClick}
              className={`${pill} min-h-[60px] w-full bg-cf-green px-[18px] py-2.5 text-center text-lg font-extrabold text-white hover:bg-cf-green-dark`}
            >
              הוספה לסל · {total}
            </button>
            <p className="m-0 text-[13px] leading-relaxed text-cf-on-navy">הסכום כולל את המארזים ואת אופן הקבלה שבחרתם.</p>
          </aside>
        </div>
      </div>

      {/* פס רכישה קבוע במובייל */}
      {sectionInView && buyBelowView && (
        <div className="cf-on-navy fixed inset-x-0 bottom-0 z-30 flex items-center gap-5 bg-cf-navy px-[18px] pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 text-cf-cream lg:hidden">
          <div>
            <span className="block text-[11px] text-cf-on-navy">סה״כ לתשלום</span>
            <strong className="text-2xl font-black tabular-nums">{total}</strong>
          </div>
          <button
            type="button"
            onClick={handleBuyClick}
            aria-label={`הוספה לסל · ${packsLabel(quantity)} · ${total}`}
            className={`${pill} min-h-12 flex-1 bg-cf-green px-4 text-base font-extrabold text-white hover:bg-cf-green-dark`}
          >
            הוספה לסל
          </button>
        </div>
      )}
    </section>
  );
}
