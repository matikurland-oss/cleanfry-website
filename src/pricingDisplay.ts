// טקסטים לתצוגת התמחור (דף הבית והעגלה). לוגיקת המחיר עצמה נמצאת ב-shared/pricing.ts — כאן רק ניסוח.
// nextTierMessage הוא תרגום נאמן של הפונקציה בקובץ הרפרנס (cleanfry-bundles-reference.html).
import {
  FREE_SHIPPING_MIN_QUANTITY,
  REGULAR_HOME_SHIPPING_AGOROT,
  priceOrder,
  TIERS,
  type CouponTerms,
  type DeliveryMethod,
  type PriceBreakdown
} from '../shared/pricing';

/** ₪ בלי אגורות כשהסכום שלם, אחרת שתי ספרות: 159.25, 433.50, 255 */
export function formatShekels(agorot: number): string {
  const rounded = Math.round(agorot);
  return rounded % 100 === 0 ? String(rounded / 100) : (rounded / 100).toFixed(2);
}

export const packsLabel = (n: number) => (n === 1 ? 'מארז אחד' : `${n} מארזים`);

export interface TierMessage {
  /** true = כבר במחיר הטוב ביותר (רקע ירוק) */
  good: boolean;
  text: string;
  /** כמה מארזים להוסיף כדי להגיע למדרגה הבאה (0 כשאין מה להוסיף) */
  addQuantity: number;
}

export function nextTierMessage(quantity: number, deliveryMethod: DeliveryMethod, coupon: CouponTerms | null): TierMessage {
  const now = priceOrder({ quantity, deliveryMethod, coupon });
  const home = deliveryMethod === 'delivery';
  const next = [...TIERS].reverse().find((t) => t.min > quantity);

  const best: TierMessage = {
    good: true,
    addQuantity: 0,
    text: (coupon && now.couponApplied
      ? 'קיבלתם את המחיר הכי טוב עם הקופון'
      : `קיבלתם את המחיר הכי טוב: ₪${formatShekels(now.tierPriceAgorot)} למארז`) +
      (home && now.shippingAgorot === 0 ? ' ומשלוח חינם' : '')
  };
  if (!next) return best;

  const add = next.min - quantity;
  const then = priceOrder({ quantity: next.min, deliveryMethod, coupon });
  const nowUnit = now.productsAfterDiscountAgorot / quantity;
  const thenUnit = then.productsAfterDiscountAgorot / next.min;
  const cheaperUnit = thenUnit < nowUnit - 0.1;
  const cheaperShip = home && next.homeShippingAgorot < now.homeShippingAgorot;
  if (!cheaperUnit && !cheaperShip) return best;

  if (cheaperShip && next.homeShippingAgorot === 0 && add === 1) {
    const diff = then.totalAgorot - now.totalAgorot;
    const benefit = cheaperUnit ? `₪${formatShekels(thenUnit)} למארז ומשלוח חינם` : 'משלוח חינם';
    // המשלוח שנחסך יכול לכסות את המארז הנוסף כולו, ואפילו יותר
    const text = diff > 0
      ? `עוד מארז אחד ב-₪${formatShekels(diff)} בלבד` +
        (cheaperUnit ? `: ${benefit}` : ' ותקבלו משלוח חינם') +
        ` (₪${formatShekels(then.totalAgorot)} במקום ₪${formatShekels(now.totalAgorot)})`
      : diff === 0
        ? `עוד מארז אחד בלי תוספת תשלום: ${benefit} (₪${formatShekels(then.totalAgorot)} בשני המקרים)`
        : `עם עוד מארז תשלמו פחות: ₪${formatShekels(then.totalAgorot)} במקום ₪${formatShekels(now.totalAgorot)} (${benefit})`;
    return { good: false, addQuantity: add, text };
  }

  const parts: string[] = [];
  if (cheaperUnit) parts.push(`מחיר של ₪${formatShekels(thenUnit)} למארז` + (then.couponApplied ? ' אחרי הקופון' : ''));
  if (cheaperShip) {
    parts.push(next.homeShippingAgorot === 0
      ? 'משלוח חינם'
      : `משלוח ב-₪${formatShekels(next.homeShippingAgorot)} במקום ₪${formatShekels(now.homeShippingAgorot)}`);
  }
  return { good: false, addQuantity: add, text: `הוסיפו ${packsLabel(add)} ותקבלו ${parts.join(' ו')}` };
}

export interface OrderSavings {
  /** חיסכון במוצרים לעומת מחיר מארז בודד (נטו, אחרי קופון אם הוחל) */
  productsAgorot: number;
  /** הפרש בין משלוח רגיל למשלוח בפועל. באיסוף עצמי אפס — אין חיסכון על משלוח שלא נרכש */
  shippingAgorot: number;
  totalAgorot: number;
}

export function orderSavings(price: PriceBreakdown, deliveryMethod: DeliveryMethod): OrderSavings {
  const productsAgorot = price.savedAgorot;
  const shippingAgorot = deliveryMethod === 'delivery' ? Math.max(0, REGULAR_HOME_SHIPPING_AGOROT - price.shippingAgorot) : 0;
  return { productsAgorot, shippingAgorot, totalAgorot: productsAgorot + shippingAgorot };
}

/** ״סה״כ חסכתם ₪28 — ₪12 במוצרים ו־₪16 במשלוח״. מחרוזת ריקה כשאין חיסכון */
export function savingsText({ productsAgorot, shippingAgorot, totalAgorot }: OrderSavings): string {
  if (totalAgorot <= 0) return '';
  const head = `סה״כ חסכתם ₪${formatShekels(totalAgorot)}`;
  if (productsAgorot > 0 && shippingAgorot > 0) {
    return `${head} — ₪${formatShekels(productsAgorot)} במוצרים ו־₪${formatShekels(shippingAgorot)} במשלוח`;
  }
  return `${head} ${shippingAgorot > 0 ? 'במשלוח' : 'במוצרים'}`;
}

/** הסבר המשלוח באזור הרכישה. הספים והמחירים נגזרים מהמדרגות */
export function shippingNote(): string {
  const reduced = [...TIERS].reverse().find((t) => t.homeShippingAgorot > 0 && t.homeShippingAgorot < REGULAR_HOME_SHIPPING_AGOROT);
  const reducedPart = reduced
    ? `מ-${reduced.min} מארזים משלוח עד הבית ב-₪${formatShekels(reduced.homeShippingAgorot)}, ומ-${FREE_SHIPPING_MIN_QUANTITY} מארזים המשלוח עלינו.`
    : `מ-${FREE_SHIPPING_MIN_QUANTITY} מארזים המשלוח עד הבית עלינו.`;
  return `${reducedPart} איסוף עצמי מתל אביב או מכפר סבא תמיד בחינם.`;
}
