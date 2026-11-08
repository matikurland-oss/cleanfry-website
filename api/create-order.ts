// פונקציית Serverless: יצירת הזמנה ממתינה לפני פתיחת טופס התשלום (מחליפה את sign-order).
//
// השרת קובע לבד את המחיר, תקפות הקופון, ההנחה והמשלוח — שום סכום, אחוז או עלות משלוח מהלקוח לא
// משמשים לחישוב. הלקוח שולח את הסכום שהוצג לו (displayedTotal) רק כדי שנוכל לזהות שינוי: אם הסכום
// שהשרת חישב שונה (למשל כי הקופון הושהה בינתיים), מחזירים 409 עם המחיר המעודכן ולא יוצרים הזמנה,
// כך שהלקוח לעולם לא מועבר לתשלום בסכום שלא הוצג לו.
//
// ההזמנה נשמרת במסד הנתונים עם מחיר נעול ל-15 דקות. לטרנזילה נשלחת רק הפניה אטומה וחתומה להזמנה.
import { isValidIsraeliPhone } from '../src/checkoutValidation.js';
import { couponState, INVALID_COUPON_MESSAGE, normalizeCode, type CouponRow } from './_lib/coupons.js';
import { deps } from './_lib/deps.js';
import { bodyObject, noStore, rateLimitKey, str, type ApiRequest, type ApiResponse } from './_lib/http.js';
import { createOrderReference } from './_lib/orderReference.js';
import {
  buildInvoiceLines,
  CURRENCY,
  isValidQuantity,
  priceOrder,
  type DeliveryMethod,
  type PickupLocation,
  type PriceBreakdown
} from '../shared/pricing.js';

export const PRICE_LOCK_MINUTES = 15;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pricingForClient(price: PriceBreakdown, coupon: CouponRow | null) {
  return {
    quantity: price.quantity,
    subtotal: price.subtotalAgorot / 100,
    discount: price.discountAgorot / 100,
    shipping: price.shippingAgorot / 100,
    total: price.totalAgorot / 100,
    coupon: coupon ? { code: coupon.code, discountPercent: coupon.discount_percent } : null
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  noStore(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = bodyObject(req);
  const quantity = Number(body.quantity);
  const deliveryMethod = body.deliveryMethod as DeliveryMethod;
  const pickupLocation = (body.pickupLocation || null) as PickupLocation | null;
  const couponCode = normalizeCode(body.couponCode);
  const displayedTotal = Number(body.displayedTotal);
  const customer = {
    name: str(body.name, 60),
    phone: str(body.phone, 20),
    email: str(body.email, 80),
    businessId: str(body.businessId, 15),
    city: str(body.city, 60),
    address: str(body.address, 100),
    apartment: str(body.apartment, 20),
    zip: str(body.zip, 10)
  };

  const invalid = (message: string) => res.status(400).json({ error: 'invalid_input', message });
  if (!isValidQuantity(quantity)) return invalid('כמות לא תקינה');
  if (deliveryMethod !== 'delivery' && deliveryMethod !== 'pickup') return invalid('שיטת קבלה לא תקינה');
  if (deliveryMethod === 'pickup' && pickupLocation !== 'kfar-saba' && pickupLocation !== 'tel-aviv') return invalid('אנא בחר מיקום לאיסוף עצמי');
  if (!customer.name || !customer.phone || !customer.email) return invalid('אנא מלא את פרטי החובה: שם מלא, טלפון ואימייל');
  if (!isValidIsraeliPhone(customer.phone)) return invalid('מספר טלפון לא תקין');
  if (!EMAIL_PATTERN.test(customer.email)) return invalid('כתובת אימייל לא תקינה');
  if (deliveryMethod === 'delivery' && (!customer.city || !customer.address)) return invalid('אנא מלא עיר, כתובת ומספר בית');
  if (!Number.isFinite(displayedTotal)) return invalid('סכום לא תקין');

  const { store, now } = deps();
  try {
    if (!(await store.hitRateLimit(rateLimitKey('order', req), 15, 600))) {
      res.status(429).json({ error: 'rate_limited', message: 'יותר מדי ניסיונות, נסו שוב בעוד כמה דקות' });
      return;
    }

    const currentTime = now();
    let coupon: CouponRow | null = null;
    if (couponCode) {
      const found = await store.getCouponByCode(couponCode);
      coupon = found && couponState(found, currentTime) === 'active' ? found : null;
    }

    const price = priceOrder({ quantity, deliveryMethod, discountPercent: coupon?.discount_percent ?? 0 });

    // הקופון שהלקוח ביקש כבר לא תקף, או שהסכום שהוצג לו שונה ממה שהשרת חישב: עוצרים ומציגים את השינוי
    if (couponCode && !coupon) {
      res.status(409).json({
        error: 'coupon_invalid',
        message: `${INVALID_COUPON_MESSAGE} — הקופון כבר לא בתוקף. הסכום לתשלום עודכן ל-₪${price.totalAgorot / 100}.`,
        pricing: pricingForClient(price, null)
      });
      return;
    }
    if (Math.round(displayedTotal * 100) !== price.totalAgorot) {
      res.status(409).json({
        error: 'price_changed',
        message: `הסכום לתשלום עודכן ל-₪${price.totalAgorot / 100}. אנא בדקו ולחצו שוב להמשך.`,
        pricing: pricingForClient(price, coupon)
      });
      return;
    }

    const invoiceLines = buildInvoiceLines(price, deliveryMethod, pickupLocation, coupon?.code ?? null);
    const order = await store.createOrder({
      quantity,
      delivery_method: deliveryMethod,
      pickup_location: deliveryMethod === 'pickup' ? pickupLocation : null,
      unit_price_agorot: price.unitPriceAgorot,
      subtotal_agorot: price.subtotalAgorot,
      discount_agorot: price.discountAgorot,
      shipping_agorot: price.shippingAgorot,
      total_agorot: price.totalAgorot,
      currency: CURRENCY,
      coupon_id: coupon?.id ?? null,
      coupon_code_snapshot: coupon?.code ?? null,
      discount_percent_snapshot: coupon?.discount_percent ?? null,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      customer_business_id: customer.businessId,
      shipping_city: deliveryMethod === 'delivery' ? customer.city : '',
      shipping_address: deliveryMethod === 'delivery' ? customer.address : '',
      shipping_apartment: deliveryMethod === 'delivery' ? customer.apartment : '',
      shipping_zip: deliveryMethod === 'delivery' ? customer.zip : '',
      invoice_lines: invoiceLines,
      price_locked_until: new Date(currentTime.getTime() + PRICE_LOCK_MINUTES * 60_000).toISOString()
    });

    res.status(200).json({
      orderRef: order.public_ref,
      expiresAt: order.price_locked_until,
      pricing: pricingForClient(price, coupon),
      payment: {
        sum: price.totalAgorot / 100,
        jsonPurchaseData: encodeURIComponent(JSON.stringify(invoiceLines)),
        remarks: createOrderReference(order.id)
      }
    });
  } catch {
    res.status(503).json({ error: 'server_error', message: 'אירעה שגיאה בהכנת ההזמנה. נסו שוב.' });
  }
}
