// חישוב מחיר הזמנה — מקור האמת היחיד לכללי התמחור. רץ בשרת (create-order) כדי לקבוע את הסכום המחייב,
// ומיובא גם ל-CheckoutPage רק לצורך תצוגה מקדימה. אין כאן שום סוד: זו לוגיקה טהורה.
//
// כללים (נשמרו מהקוד הקודם ב-CheckoutPage):
// - ההנחה חלה על מחיר המוצרים בלבד, ומעוגלת לשקל שלם (חצי ומעלה — כלפי מעלה).
// - סף משלוח חינם נבדק מול סכום המוצרים אחרי ההנחה.
// - איסוף עצמי תמיד חינם.
// כל הסכומים באגורות (מספרים שלמים). אחוז הנחה מיוצג כאחוז רגיל: 18 = 18%.

export const UNIT_PRICE_AGOROT = 5900;
export const SHIPPING_AGOROT = 3500;
export const FREE_SHIPPING_THRESHOLD_AGOROT = 19900;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
export const CURRENCY = 'ILS';

export type DeliveryMethod = 'delivery' | 'pickup';
export type PickupLocation = 'kfar-saba' | 'tel-aviv';

export interface PriceInput {
  quantity: number;
  deliveryMethod: DeliveryMethod;
  /** אחוז הנחה (0–100), או 0 כשאין קופון */
  discountPercent: number;
}

export interface PriceBreakdown {
  quantity: number;
  unitPriceAgorot: number;
  subtotalAgorot: number;
  discountAgorot: number;
  productsAfterDiscountAgorot: number;
  isFreeShipping: boolean;
  shippingAgorot: number;
  totalAgorot: number;
}

export function isValidQuantity(quantity: unknown): quantity is number {
  return Number.isInteger(quantity) && (quantity as number) >= MIN_QUANTITY && (quantity as number) <= MAX_QUANTITY;
}

export function priceOrder({ quantity, deliveryMethod, discountPercent }: PriceInput): PriceBreakdown {
  if (!isValidQuantity(quantity)) throw new Error('invalid quantity');
  if (!(discountPercent >= 0 && discountPercent < 100)) throw new Error('invalid discount');

  const subtotalShekels = (UNIT_PRICE_AGOROT / 100) * quantity;
  // חישוב בשלמים (נקודות בסיס) כדי שעיגול של חצי שקל יהיה דטרמיניסטי ולא תלוי בדיוק של float
  const basisPoints = Math.round(discountPercent * 100);
  const discountShekels = Math.floor((subtotalShekels * basisPoints + 5000) / 10000);

  const subtotalAgorot = subtotalShekels * 100;
  const discountAgorot = discountShekels * 100;
  const productsAfterDiscountAgorot = subtotalAgorot - discountAgorot;
  const isFreeShipping = productsAfterDiscountAgorot >= FREE_SHIPPING_THRESHOLD_AGOROT;
  const shippingAgorot = deliveryMethod === 'pickup' || isFreeShipping ? 0 : SHIPPING_AGOROT;

  return {
    quantity,
    unitPriceAgorot: UNIT_PRICE_AGOROT,
    subtotalAgorot,
    discountAgorot,
    productsAfterDiscountAgorot,
    isFreeShipping,
    shippingAgorot,
    totalAgorot: productsAfterDiscountAgorot + shippingAgorot
  };
}

export interface InvoiceLine {
  product_name: string;
  product_quantity: number;
  product_price: number;
}

// פירוט החשבונית לטרנזילה (json_purchase_data) לפי המבנה השטוח שאושר בפועל.
// טרנזילה מאמתת ש-sum שווה בדיוק ל-Σ(product_price × product_quantity), לכן מחיר היחידה כבר נטו
// אחרי ההנחה, ושארית העיגול לאגורה נספגת בשורת המשלוח/איסוף.
export function buildInvoiceLines(
  price: PriceBreakdown,
  deliveryMethod: DeliveryMethod,
  pickupLocation: PickupLocation | '' | null,
  couponCode: string | null
): InvoiceLine[] {
  const unitAgorot = Math.round(price.productsAfterDiscountAgorot / price.quantity);
  const remainderAgorot = price.productsAfterDiscountAgorot - unitAgorot * price.quantity;
  const couponSuffix = couponCode && price.discountAgorot > 0 ? ` (קופון: ${couponCode})` : '';

  return [
    { product_name: `מארז CleanFry${couponSuffix}`, product_quantity: price.quantity, product_price: unitAgorot / 100 },
    {
      product_name: deliveryMethod === 'pickup'
        ? (pickupLocation === 'kfar-saba' ? 'איסוף עצמי - סניף כפר סבא' : 'איסוף עצמי - סניף תל אביב')
        : 'דמי משלוח עד הבית',
      product_quantity: 1,
      product_price: (price.shippingAgorot + remainderAgorot) / 100
    }
  ];
}

export const agorotToShekels = (agorot: number) => agorot / 100;
