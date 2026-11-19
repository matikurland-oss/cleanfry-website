// חישוב מחיר הזמנה — מקור האמת היחיד לכללי התמחור. רץ בשרת (create-order) כדי לקבוע את הסכום המחייב,
// ומיובא גם לדף הבית ול-CheckoutPage רק לצורך תצוגה. אין כאן שום סוד: זו לוגיקה טהורה.
//
// כללים (CLEANFRY-QUANTITY-TIERS-SPEC.md):
// - המדרגה נקבעת לפי כמות המארזים בהזמנה, ומחירה חל על כל המארזים. המשלוח עד הבית נקבע לפי אותה מדרגה.
// - איסוף עצמי תמיד חינם.
// - קופון חל על המוצרים בלבד ולא משנה את המדרגה או את המשלוח.
//   כפל מבצעים = כן: ההנחה על מחיר המדרגה.
//   כפל מבצעים = לא: ההנחה על מחיר המחירון (LIST_PRICE), והלקוח מקבל את הזול מבין מחיר המדרגה למחיר הקופון.
// - הנחה מעוגלת לאגורה (חצי ומעלה כלפי מעלה).
// כל הסכומים באגורות (מספרים שלמים). אחוז הנחה מיוצג כאחוז רגיל: 18 = 18%.

/** מחיר מארז בודד בלי מדרגה. זה גם המחיר המחוק שמוצג ליד מחירי המדרגות — חייב להיות מחיר שנגבה בפועל */
export const LIST_PRICE_AGOROT = 5900;

export interface Tier {
  /** כמות מינימלית למדרגה */
  min: number;
  priceAgorot: number;
  homeShippingAgorot: number;
}

/** מסודר מהגבוה לנמוך. המדרגה הנמוכה (min: 1) חייבת להיות במחיר המחירון */
export const TIERS: readonly Tier[] = [
  { min: 5, priceAgorot: 5100, homeShippingAgorot: 0 },
  { min: 3, priceAgorot: 5500, homeShippingAgorot: 3500 },
  { min: 1, priceAgorot: LIST_PRICE_AGOROT, homeShippingAgorot: 3500 }
];

/** הכמות שממנה המשלוח עד הבית חינם */
export const FREE_SHIPPING_MIN_QUANTITY = TIERS.find((t) => t.homeShippingAgorot === 0)!.min;

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
export const CURRENCY = 'ILS';

export type DeliveryMethod = 'delivery' | 'pickup';
export type PickupLocation = 'kfar-saba' | 'tel-aviv';

export interface CouponTerms {
  /** אחוז הנחה (0–100, לא כולל) */
  discountPercent: number;
  /** כפל מבצעים: true = ההנחה על מחיר המדרגה */
  stacks: boolean;
}

export interface PriceInput {
  quantity: number;
  deliveryMethod: DeliveryMethod;
  coupon: CouponTerms | null;
}

export interface PriceBreakdown {
  quantity: number;
  tier: Tier;
  /** מחיר המדרגה למארז */
  tierPriceAgorot: number;
  /** המחיר למארז שעליו חושב סכום המוצרים (מחיר המדרגה, או מחיר המחירון כשקופון בלי כפל מבצעים הוחל) */
  unitPriceAgorot: number;
  subtotalAgorot: number;
  discountAgorot: number;
  productsAfterDiscountAgorot: number;
  couponApplied: boolean;
  couponStacks: boolean | null;
  /** דמי המשלוח עד הבית במדרגה הזו (גם כשנבחר איסוף) */
  homeShippingAgorot: number;
  shippingAgorot: number;
  totalAgorot: number;
  /** כמות × מחיר מחירון */
  listSubtotalAgorot: number;
  /** חיסכון לעומת מחיר מארז בודד, בלי משלוח */
  savedAgorot: number;
}

export function isValidQuantity(quantity: unknown): quantity is number {
  return Number.isInteger(quantity) && (quantity as number) >= MIN_QUANTITY && (quantity as number) <= MAX_QUANTITY;
}

export function tierFor(quantity: number): Tier {
  return TIERS.find((t) => quantity >= t.min) ?? TIERS[TIERS.length - 1];
}

export function priceOrder({ quantity, deliveryMethod, coupon }: PriceInput): PriceBreakdown {
  if (!isValidQuantity(quantity)) throw new Error('invalid quantity');
  if (coupon && !(coupon.discountPercent >= 0 && coupon.discountPercent < 100)) throw new Error('invalid discount');

  const tier = tierFor(quantity);
  // חישוב בשלמים (נקודות בסיס) כדי שההשוואה והעיגול יהיו דטרמיניסטיים ולא תלויים בדיוק של float
  const basisPoints = coupon ? Math.round(coupon.discountPercent * 100) : 0;

  let unitPriceAgorot = tier.priceAgorot;
  let couponApplied = false;
  if (coupon && basisPoints > 0) {
    const couponBase = coupon.stacks ? tier.priceAgorot : LIST_PRICE_AGOROT;
    if (couponBase * (10000 - basisPoints) < tier.priceAgorot * 10000) {
      unitPriceAgorot = couponBase;
      couponApplied = true;
    }
  }

  const subtotalAgorot = unitPriceAgorot * quantity;
  const discountAgorot = couponApplied ? Math.floor((subtotalAgorot * basisPoints + 5000) / 10000) : 0;
  const productsAfterDiscountAgorot = subtotalAgorot - discountAgorot;
  const shippingAgorot = deliveryMethod === 'pickup' ? 0 : tier.homeShippingAgorot;
  const listSubtotalAgorot = LIST_PRICE_AGOROT * quantity;

  return {
    quantity,
    tier,
    tierPriceAgorot: tier.priceAgorot,
    unitPriceAgorot,
    subtotalAgorot,
    discountAgorot,
    productsAfterDiscountAgorot,
    couponApplied,
    couponStacks: coupon ? coupon.stacks : null,
    homeShippingAgorot: tier.homeShippingAgorot,
    shippingAgorot,
    totalAgorot: productsAfterDiscountAgorot + shippingAgorot,
    listSubtotalAgorot,
    savedAgorot: Math.max(0, listSubtotalAgorot - productsAfterDiscountAgorot)
  };
}

export interface InvoiceLine {
  product_name: string;
  product_quantity: number;
  product_price: number;
}

// פירוט החשבונית לטרנזילה (json_purchase_data) לפי המבנה השטוח שאושר בפועל.
// טרנזילה מאמתת ש-sum שווה בדיוק ל-Σ(product_price × product_quantity), לכן מחיר היחידה כבר נטו
// אחרי ההנחה. ההנחה חלה על המוצרים בלבד: שורת המשלוח/איסוף תמיד במחיר המשלוח המדויק.
// כשסכום המוצרים לא מתחלק בדיוק לאגורות, שארית העיגול (r אגורות, פחות מהכמות) נכנסת לשורות המוצר:
// r מארזים במחיר גבוה באגורה אחת מהשאר.
export function buildInvoiceLines(
  price: PriceBreakdown,
  deliveryMethod: DeliveryMethod,
  pickupLocation: PickupLocation | '' | null,
  couponCode: string | null
): InvoiceLine[] {
  const unitAgorot = Math.floor(price.productsAfterDiscountAgorot / price.quantity);
  const remainderAgorot = price.productsAfterDiscountAgorot - unitAgorot * price.quantity;
  const productName = `מארז CleanFry${couponCode && price.couponApplied && price.discountAgorot > 0 ? ` (קופון: ${couponCode})` : ''}`;

  const productLines: InvoiceLine[] = [];
  if (price.quantity - remainderAgorot > 0) {
    productLines.push({ product_name: productName, product_quantity: price.quantity - remainderAgorot, product_price: unitAgorot / 100 });
  }
  if (remainderAgorot > 0) {
    productLines.push({ product_name: productName, product_quantity: remainderAgorot, product_price: (unitAgorot + 1) / 100 });
  }

  return [
    ...productLines,
    {
      product_name: deliveryMethod === 'pickup'
        ? (pickupLocation === 'kfar-saba' ? 'איסוף עצמי - סניף כפר סבא' : 'איסוף עצמי - סניף תל אביב')
        : 'דמי משלוח עד הבית',
      product_quantity: 1,
      product_price: price.shippingAgorot / 100
    }
  ];
}

export const agorotToShekels = (agorot: number) => agorot / 100;
