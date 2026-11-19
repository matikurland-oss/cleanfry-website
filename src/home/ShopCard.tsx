import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackCartEvent } from '../analytics';
import {
  LIST_PRICE_AGOROT,
  MAX_QUANTITY,
  MIN_QUANTITY,
  TIERS,
  priceOrder,
  tierFor,
  type DeliveryMethod,
  type PickupLocation,
} from '../../shared/pricing';
import { formatShekels, nextTierMessage, packsLabel } from '../pricingDisplay';
import { CheckIcon, MinusIcon, PlusIcon, TruckIcon } from './icons';
import { container, gutter, pill, sectionTitle } from './layout';

const BULLETS = ['מתאים לכל שמני המאכל, וגם לשומן מן החי', 'כף אבקה לכל כוס שמן', 'בלי נזילות ובלי ריחות בפח'];

const PACKS = [
  { qty: 1, badge: '' },
  { qty: 3, badge: 'הכי נמכר' },
  { qty: 5, badge: 'הכי משתלם', best: true },
  { qty: 10, badge: 'מלאי לשנה' },
] as const;

type ShipOption = 'home' | PickupLocation;
const SHIP_OPTIONS: { id: ShipOption; label: string }[] = [
  { id: 'home', label: 'משלוח עד הבית' },
  { id: 'tel-aviv', label: 'איסוף מתל אביב' },
  { id: 'kfar-saba', label: 'איסוף מכפר סבא' },
];

// תוויות לטבלת המדרגות, לפי המדרגה (המחירים עצמם מגיעים מ-TIERS)
const TIER_TAGS: Record<number, string> = { 3: 'הכי נמכר', 5: 'הכי משתלם' };

/** מחיר מחוק: ״₪177״ עם ״במקום״ לקוראי מסך */
function Was({ agorot, className = '' }: { agorot: number; className?: string }) {
  return (
    <del className={`font-medium text-cf-muted decoration-[#B42318] decoration-2 ${className}`}>
      <span className="sr-only">במקום </span>₪{formatShekels(agorot)}
    </del>
  );
}

function tierRange(index: number) {
  const tier = TIERS[index];
  const upper = index > 0 ? TIERS[index - 1].min - 1 : null;
  if (upper === null) return `${tier.min} ומעלה`;
  return upper === tier.min ? packsLabel(tier.min) : `${tier.min}–${upper} מארזים`;
}

// כרטיס המוצר עם בורר מארזים. view_item נשלח פעם אחת כשאזור הקנייה נראה, add_to_cart במעבר לעגלה.
// כל המחירים מחושבים ב-shared/pricing.ts — אותה פונקציה שהשרת מחייב לפיה.
export default function ShopCard({ purchaseBoxRef }: { purchaseBoxRef: React.RefObject<HTMLDivElement | null> }) {
  const [quantity, setQuantity] = useState(3);
  const [ship, setShip] = useState<ShipOption>('home');
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

  const deliveryMethod: DeliveryMethod = ship === 'home' ? 'delivery' : 'pickup';
  const price = priceOrder({ quantity, deliveryMethod, coupon: null });
  const nudge = nextTierMessage(quantity, deliveryMethod, null);

  const handleBuyClick = () => {
    trackCartEvent('add_to_cart', quantity);
    const params = new URLSearchParams({ q: String(quantity) });
    if (ship !== 'home') {
      params.set('ship', 'pickup');
      params.set('loc', ship);
    }
    navigate(`/checkout?${params}`);
  };

  const stepBtn = 'flex h-[48px] w-[48px] items-center justify-center text-cf-navy transition-colors hover:bg-cf-cream disabled:cursor-not-allowed disabled:opacity-40';

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

          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 p-[clamp(18px,4vw,56px)]">
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

            {/* אזור הרכישה — עליו נמדד view_item */}
            <div ref={purchaseBoxRef} id="shop-buy" className="@container flex flex-col gap-5 pt-1.5">
              <div className="flex flex-col gap-3">
                <span id="packs-label" className="text-base font-bold">בחרו מארז – כמה שיותר, יותר זול למארז</span>
                <div role="group" aria-labelledby="packs-label" className="grid grid-cols-2 gap-3 pt-2 @[600px]:grid-cols-4">
                  {PACKS.map((p) => {
                    const tier = tierFor(p.qty);
                    const discounted = tier.priceAgorot < LIST_PRICE_AGOROT;
                    const save = p.qty * (LIST_PRICE_AGOROT - tier.priceAgorot);
                    const selected = p.qty === quantity;
                    return (
                      <button
                        key={p.qty}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setQuantity(p.qty)}
                        className={`relative flex min-w-0 flex-col gap-1 rounded-cf-card border-[3px] px-3.5 pb-3.5 pt-5 text-right text-cf-navy transition-colors ${selected ? 'border-cf-green bg-cf-green-light' : 'border-cf-border bg-cf-cream hover:border-cf-green/50'}`}
                      >
                        {p.badge && (
                          <span className={`absolute -top-3 right-3 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold ${'best' in p && p.best ? 'bg-cf-green text-white' : 'bg-cf-navy text-cf-cream'}`}>
                            {p.badge}
                          </span>
                        )}
                        <span className="text-[15px] font-bold text-cf-muted">{packsLabel(p.qty)}</span>
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[clamp(26px,2.4vw,32px)] font-black leading-none tabular-nums">₪{formatShekels(p.qty * tier.priceAgorot)}</span>
                          {discounted && <Was agorot={p.qty * LIST_PRICE_AGOROT} className="text-[17px] tabular-nums" />}
                        </span>
                        <span className="text-[15px] text-cf-body tabular-nums">
                          ₪{formatShekels(tier.priceAgorot)} למארז{discounted && <> <Was agorot={LIST_PRICE_AGOROT} /></>}
                        </span>
                        <span className="min-h-5 text-sm font-bold text-cf-green-dark">{save > 0 ? `חיסכון של ₪${formatShekels(save)}` : ''}</span>
                        <span className="text-[13px] text-cf-muted">
                          {tier.homeShippingAgorot === 0 ? 'משלוח עד הבית חינם' : `משלוח ₪${formatShekels(tier.homeShippingAgorot)} · איסוף חינם`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
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
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                  <span id="ship-label" className="text-[15px] font-bold">איך לקבל?</span>
                  <div role="group" aria-labelledby="ship-label" className="flex flex-wrap gap-2">
                    {SHIP_OPTIONS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={ship === o.id}
                        onClick={() => setShip(o.id)}
                        className={`min-h-11 rounded-full border-2 px-4 text-[15px] font-medium transition-colors ${ship === o.id ? 'border-cf-navy bg-cf-navy text-cf-cream' : 'border-cf-border bg-white text-cf-navy hover:border-cf-navy/40'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p
                aria-live="polite"
                className={`m-0 flex items-center gap-2.5 rounded-[18px] px-[18px] py-3.5 text-[15px] font-medium leading-normal ${nudge.good ? 'bg-cf-green-light text-cf-green-dark' : 'bg-cf-cream text-cf-navy'}`}
              >
                <TruckIcon size={22} className="shrink-0" />
                <span>{nudge.text}</span>
              </p>

              <button
                type="button"
                onClick={handleBuyClick}
                className={`${pill} min-h-[60px] w-full bg-cf-green px-6 text-center text-[clamp(17px,1.8vw,19px)] font-extrabold text-white`}
              >
                <span aria-live="polite">הוספה לסל – {packsLabel(quantity)} · ₪{formatShekels(price.totalAgorot)}</span>
              </button>
            </div>
          </div>
        </div>

        <table className="mt-6 w-full border-separate border-spacing-0 overflow-hidden rounded-[28px] border border-cf-border bg-white text-right">
          <caption className="sr-only">מחיר למארז ומשלוח לפי כמות המארזים בעגלה</caption>
          <thead>
            <tr className="bg-cf-navy text-cf-cream">
              {['כמות בעגלה', 'מחיר למארז', 'משלוח עד הבית', 'איסוף עצמי'].map((h) => (
                <th key={h} scope="col" className="px-2.5 py-3 text-sm font-bold sm:px-[18px] sm:py-3.5 sm:text-[15px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...TIERS].reverse().map((tier, i) => {
              const active = tier === price.tier;
              const tag = TIER_TAGS[tier.min];
              const cell = `border-t border-cf-border px-2.5 py-3 text-sm sm:px-[18px] sm:py-3.5 sm:text-base ${active ? 'bg-cf-green-light font-bold' : ''}`;
              return (
                <tr key={tier.min}>
                  <td className={cell}>
                    {tierRange(TIERS.length - 1 - i)}
                    {tag && (
                      <span className={`mt-1.5 block w-max rounded-full px-2.5 py-1 text-[12px] font-bold text-cf-green-dark sm:ms-2 sm:mt-0 sm:inline-block ${active ? 'bg-white' : 'bg-cf-green-light'}`}>
                        {tag}
                      </span>
                    )}
                  </td>
                  <td className={`${cell} tabular-nums`}>₪{formatShekels(tier.priceAgorot)}</td>
                  <td className={`${cell} tabular-nums`}>{tier.homeShippingAgorot === 0 ? 'חינם' : `₪${formatShekels(tier.homeShippingAgorot)}`}</td>
                  <td className={cell}>חינם</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
