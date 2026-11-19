import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ChevronRight, CreditCard, X, MapPin } from 'lucide-react';
import { isValidIsraeliPhone } from './checkoutValidation';
import { isShoppingIlPromoActive } from './shoppingIlPromo';
import { track, trackCartEvent, savePendingPurchase } from './analytics';
import {
  LIST_PRICE_AGOROT,
  MAX_QUANTITY,
  REGULAR_HOME_SHIPPING_AGOROT,
  priceOrder
} from '../shared/pricing';
import { formatShekels, nextTierMessage, orderSavings, packsLabel, savingsText } from './pricingDisplay';
import { CheckIcon, MinusIcon, PlusIcon, TruckIcon } from './home/icons';
import { btnPrimary, card, cardTitle, field, notice, pageShell, pageTitle, pill } from './home/layout';

/** מחיר מחוק (על רקע כחול כהה) עם ״במקום״ לקוראי מסך */
const Was = ({ agorot }: { agorot: number }) => (
  <del className="font-medium text-cf-on-navy decoration-cf-lime decoration-2">
    <span className="sr-only">במקום </span>₪{formatShekels(agorot)}
  </del>
);

const CheckoutPage = () => {
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const paymentFailedRef = useRef<HTMLDivElement>(null);
  const checkoutTrackedRef = useRef(false);

  // 1. States
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  // כפל מבצעים של הקופון (מגיע מהשרת עם בדיקת הקופון)
  const [stacksPromotions, setStacksPromotions] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocation, setPickupLocation] = useState<'kfar-saba' | 'tel-aviv' | ''>(''); 

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [zip, setZip] = useState(''); 

  const [paymentFailed, setPaymentFailed] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [priceNotice, setPriceNotice] = useState('');
  const [orderExpired, setOrderExpired] = useState(false);
  // שדות הטופס לטרנזילה — מגיעים מהשרת (api/create-order), שקבע את הסכום המחייב בעצמו
  const [payment, setPayment] = useState<{ sum: number; jsonPurchaseData: string; remarks: string; expiresAt: string } | null>(null);

  // 2-3. חישובי סכומים — לתצוגה בלבד. אותה פונקציה (shared/pricing) רצה בשרת וקובעת את הסכום המחייב;
  // השרת לא מקבל מהדפדפן סכום, אחוז הנחה או עלות משלוח. אחוז ההנחה (18 = 18%) וכפל המבצעים מגיעים מ-validate-coupon.
  const couponTerms = isCouponApplied ? { discountPercent, stacks: stacksPromotions } : null;
  const price = priceOrder({ quantity, deliveryMethod: shippingMethod, coupon: couponTerms });
  const discount = price.discountAgorot / 100;
  const currentShipping = price.shippingAgorot / 100;
  const totalPrice = price.totalAgorot / 100;
  const struck = price.unitPriceAgorot < LIST_PRICE_AGOROT;
  const nudge = nextTierMessage(quantity, shippingMethod, couponTerms);

  // 4. זיהוי כמות מה-URL + חזרה מתשלום שנכשל
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= MAX_QUANTITY) setQuantity(qParam);
    // שיטת הקבלה שנבחרה בדף הבית
    if (params.get('ship') === 'pickup') {
      setShippingMethod('pickup');
      const loc = params.get('loc');
      if (loc === 'tel-aviv' || loc === 'kfar-saba') setPickupLocation(loc);
    }
    if (params.get('payment') === 'failed') {
      setPaymentFailed(true);
      if (!checkoutTrackedRef.current) track('payment_failed');
    } else if (!checkoutTrackedRef.current) {
      // מאיפה הגיעו לצ'קאאוט: הפופאפ מוסיף קופון, כפתור הקנייה מוסיף כמות, אייקון הסל — כלום
      const source = params.get('coupon') ? 'promo_popup' : params.get('q') ? 'purchase_box' : 'cart_or_direct';
      trackCartEvent('begin_checkout', qParam >= 1 && qParam <= MAX_QUANTITY ? qParam : 1, { source });
    }
    checkoutTrackedRef.current = true;
    const couponParam = params.get('coupon');
    if (couponParam) {
      setCoupon(couponParam);
      handleApplyCoupon(couponParam);
    }
  }, [location]);

  // גלילה אוטומטית להודעת "התשלום נכשל" ברגע שהיא מופיעה, כדי שהלקוח לא יפספס אותה
  useEffect(() => {
    if (paymentFailed) {
      paymentFailedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [paymentFailed]);

  // 5. שליחת הטופס ל-iframe של טרנזילה ברגע פתיחת אזור התשלום
  useEffect(() => {
    if (showPayment && payment && formRef.current) {
      formRef.current.submit();
    }
  }, [showPayment]);

  // כל שינוי שסוגר את אזור התשלום מבטל את ההזמנה שהוכנה; הלחיצה הבאה יוצרת הזמנה חדשה במחיר עדכני
  useEffect(() => {
    if (!showPayment) setPayment(null);
  }, [showPayment]);

  // המחיר נעול בשרת ל-15 דקות. אחרי זה מסתירים את טופס התשלום ומבקשים ליצור הזמנה חדשה, כדי
  // שהקופון והמחיר ייבדקו שוב. (זו נוחות בלבד — השרת מסמן תשלום שהגיע באיחור לבדיקה ידנית.)
  useEffect(() => {
    if (!payment) return;
    const timeout = setTimeout(() => {
      setShowPayment(false);
      setOrderExpired(true);
      track('checkout_payment_expired');
    }, Math.max(0, new Date(payment.expiresAt).getTime() - Date.now()));
    return () => clearTimeout(timeout);
  }, [payment]);

  // 5ב. זיהוי תוצאת התשלום מתוך ה-iframe.
  // הערה: success_url_address/fail_url_address שאנחנו שולחים לא תמיד גוברים על כתובת ברירת המחדל
  // שמוגדרת בממשק הניהול של טרנזילה, ולכן ה-iframe עלול לנחות על עמוד לא-תקין בדומיין שלנו.
  // כדי לא להציג ללקוח דף שבור, בודקים כל חצי שנייה אם ה-iframe כבר הגיע לדומיין שלנו,
  // מחלצים משם את קוד התוצאה של טרנזילה, ומנווטים בעצמנו לעמוד הנכון.
  useEffect(() => {
    if (!showPayment) return;

    const interval = setInterval(() => {
      let iframeHref = '';
      try {
        const iframe = document.getElementById('tranzila-iframe') as HTMLIFrameElement | null;
        iframeHref = iframe?.contentWindow?.location.href || '';
      } catch (e) {
        return; // ה-iframe עדיין בדומיין של טרנזילה (cross-origin) — ממשיכים לחכות
      }

      if (!iframeHref.startsWith(window.location.origin)) return;

      clearInterval(interval);
      // Tranzila עלולה להטמיע את פרמטרי התוצאה בתוך ה-path כשהם מקודדים כפול (%3D/%26),
      // ולכן בודקים את שתי הצורות האפשריות של קוד ההצלחה
      const isSuccess = /[?&]Response=000(&|$)/.test(iframeHref) || iframeHref.includes('Response%3D000');
      window.top!.location.href = isSuccess
        ? `${window.location.origin}/order-success`
        : `${window.location.origin}/checkout?payment=failed`;
    }, 500);

    return () => clearInterval(interval);
  }, [showPayment]);

  // 6. קופונים — האימות מתבצע בשרת (api/validate-coupon), לא ברשימה חשופה בקוד הלקוח
  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? coupon).toUpperCase().trim();
    if (!code) return;

    setCouponError('');
    setIsValidatingCoupon(true);
    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const result = await response.json();

      track('coupon_apply', { coupon: code, success: !!result.valid });
      if (result.valid) {
        setCoupon(result.code);
        setDiscountPercent(result.discountPercent);
        setStacksPromotions(result.stacksPromotions === true);
        setIsCouponApplied(true);
        setPriceNotice('');
        setShowPayment(false);
      } else {
        setCouponError(result.message || 'קוד קופון לא תקין');
      }
    } catch (error) {
      setCouponError('שגיאה באימות הקופון, נסו שוב');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon('');
    setDiscountPercent(0);
    setStacksPromotions(false);
    setIsCouponApplied(false);
    setCouponError('');
    setShowPayment(false);
  };

  const changeQuantity = (next: number) => {
    setQuantity(Math.min(MAX_QUANTITY, Math.max(1, next)));
    setShowPayment(false);
  };

  const handleProceedToPayment = async () => {
    const formError = (field: string, message: string) => {
      track('checkout_form_error', { field });
      alert(message);
    };
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      formError('contact_details', 'אנא מלא את פרטי החובה: שם מלא, טלפון ואימייל');
      return;
    }
    if (!isValidIsraeliPhone(phone)) {
      formError('phone', 'מספר טלפון לא תקין — יש להזין מספר ישראלי תקין');
      return;
    }
    if (shippingMethod === 'delivery' && (!city.trim() || !address.trim())) {
      formError('address', 'נבחר משלוח עד הבית. אנא מלא עיר, כתובת ומספר בית כדי להמשיך לטופס התשלום.');
      return;
    }
    if (shippingMethod === 'pickup' && !pickupLocation) {
      formError('pickup_location', 'אנא בחר מיקום לאיסוף עצמי כדי להמשיך.');
      return;
    }
    track('add_shipping_info', { currency: 'ILS', value: totalPrice, shipping_tier: shippingMethod });

    sessionStorage.setItem('cleanfry_shipping_method', shippingMethod);

    // יוצרים הזמנה ממתינה בשרת. השרת מחשב בעצמו את המחיר ובודק שוב את הקופון; הסכום שמוצג כאן
    // נשלח רק כדי לזהות שינוי. אם המחיר השתנה (למשל הקופון הושהה) — מציגים את הסכום החדש ולא
    // ממשיכים לתשלום עד לחיצה נוספת.
    setIsPreparingPayment(true);
    setPriceNotice('');
    setOrderExpired(false);
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          deliveryMethod: shippingMethod,
          pickupLocation: shippingMethod === 'pickup' ? pickupLocation : '',
          couponCode: isCouponApplied ? coupon.toUpperCase().trim() : '',
          displayedTotal: totalPrice,
          name: fullName,
          phone,
          email,
          businessId: businessId.trim(),
          city,
          address,
          apartment,
          zip
        })
      });
      const result = await response.json();

      if (response.status === 409) {
        if (!result.pricing?.coupon) {
          setCoupon('');
          setDiscountPercent(0);
          setIsCouponApplied(false);
        } else {
          setDiscountPercent(result.pricing.coupon.discountPercent);
          setStacksPromotions(result.pricing.coupon.stacksPromotions === true);
        }
        track('checkout_price_changed');
        setPriceNotice(result.message);
        return;
      }
      if (!response.ok || !result.payment) {
        track('checkout_error', { status: response.status });
        alert(result.message || 'אירעה שגיאה בהכנת ההזמנה. נסו שוב.');
        return;
      }

      track('add_payment_info', { currency: 'ILS', value: result.payment.sum, coupon: isCouponApplied ? coupon : undefined });
      savePendingPurchase({
        transactionId: result.orderRef,
        value: result.payment.sum,
        quantity,
        coupon: isCouponApplied ? coupon : '',
        shipping: currentShipping
      });

      setPayment({ ...result.payment, expiresAt: result.expiresAt });
      setShowPayment(true);
    } catch (error) {
      track('checkout_error', { status: 'network' });
      alert('אירעה שגיאה בהכנת ההזמנה. נסו שוב.');
    } finally {
      setIsPreparingPayment(false);
    }
  };

  // קביעת הכתובות הדינמיות שיוצגו בראש החשבונית
  const tranzilaCity = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'כפר סבא' : 'תל אביב') : city;
  const tranzilaAddress = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'בן גוריון 7' : 'משה וילנסקי 11') : (apartment.trim() ? `${address}, דירה ${apartment}` : address);

  // פירוט החשבונית (json_purchase_data) נבנה בשרת — ראו buildInvoiceLines ב-shared/pricing.ts.
  // כבר מקודד ב-encodeURIComponent לפי ההנחיה של טרנזילה.

  const savingLine = savingsText(orderSavings(price, shippingMethod));
  const reducedShipping = shippingMethod === 'delivery' && price.shippingAgorot > 0 && price.shippingAgorot < REGULAR_HOME_SHIPPING_AGOROT;
  const optionBtn = (selected: boolean) =>
    `flex min-h-[76px] w-full items-center justify-between gap-3 rounded-[20px] border-[3px] p-4 text-right text-cf-navy transition-colors ${selected ? 'border-cf-green bg-cf-green-light' : 'border-cf-border bg-cf-cream hover:border-cf-green/50'}`;
  const radioDot = (selected: boolean) => (
    <span aria-hidden="true" className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${selected ? 'border-cf-green bg-cf-green' : 'border-cf-muted/50 bg-white'}`}>
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
    </span>
  );
  const textInput = (props: { value: string; onChange: (v: string) => void; placeholder: string; type?: string; wide?: boolean; autoComplete?: string }) => (
    <input
      type={props.type ?? 'text'}
      placeholder={props.placeholder}
      aria-label={props.placeholder.replace(' *', '')}
      aria-required={props.placeholder.endsWith('*') || undefined}
      autoComplete={props.autoComplete}
      value={props.value}
      onChange={(e) => { props.onChange(e.target.value); setShowPayment(false); }}
      className={`${field} ${props.wide ? 'md:col-span-2' : ''}`}
    />
  );
  const pickupLocations = [
    { id: 'kfar-saba', name: 'כפר סבא', street: 'רח\' - בן גוריון 7' },
    { id: 'tel-aviv', name: 'תל אביב', street: 'רח\' - משה וילנסקי 11' }
  ] as const;

  return (
    <div className={pageShell}>
      {/* התראה צפה שקופצת מיד עם החזרה מתשלום שנכשל, בנוסף להודעה בתוך תיבת התשלום */}
      {paymentFailed && (
        <div role="alert" className="fixed inset-x-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-[18px] bg-[#B42318] px-5 py-4 text-white shadow-2xl animate-fadeIn sm:inset-x-auto sm:right-4">
          <X size={22} className="shrink-0" aria-hidden="true" />
          <p className="m-0 text-[15px] font-bold">התשלום נכשל — לא בוצע חיוב</p>
        </div>
      )}

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-8 flex flex-col gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-1 self-start font-bold text-cf-green-dark no-underline hover:underline">
            <ChevronRight size={18} aria-hidden="true" /> חזרה לחנות
          </Link>
          <h1 className={pageTitle}>הסל שלי</h1>
        </div>

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12">

          {/* עמודה ימנית */}
          <div className="flex flex-col gap-7 lg:col-span-7">

            {/* בחירת שיטת קבלה */}
            <section aria-labelledby="ship-title" className={card}>
              <h2 id="ship-title" className={`${cardTitle} mb-6 flex items-center gap-2.5`}>
                <TruckIcon size={28} className="shrink-0 text-cf-green" /> איך תרצו לקבל את החבילה?
              </h2>

              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={shippingMethod === 'delivery'}
                  onClick={() => { setShippingMethod('delivery'); setPickupLocation(''); setShowPayment(false); }}
                  className={optionBtn(shippingMethod === 'delivery')}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[17px] font-bold">משלוח עד הבית</span>
                    <span className="text-sm text-cf-muted">3-5 ימי עסקים</span>
                  </span>
                  {radioDot(shippingMethod === 'delivery')}
                </button>

                <button
                  type="button"
                  aria-pressed={shippingMethod === 'pickup'}
                  onClick={() => { setShippingMethod('pickup'); setShowPayment(false); }}
                  className={optionBtn(shippingMethod === 'pickup')}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[17px] font-bold">איסוף עצמי</span>
                    <span className="text-sm font-bold text-cf-green-dark">חינם</span>
                    <span className="text-[13px] text-cf-muted">ת"א / כפר סבא</span>
                  </span>
                  {radioDot(shippingMethod === 'pickup')}
                </button>
              </div>

              {shippingMethod === 'pickup' && (
                <div role="radiogroup" aria-labelledby="pickup-title" className="mt-5 rounded-[20px] bg-cf-blue-light p-5 animate-fadeIn">
                  <p id="pickup-title" className="mb-4 mt-0 flex items-center gap-2 text-lg font-extrabold text-cf-navy">
                    <MapPin className="shrink-0 text-cf-blue" size={22} aria-hidden="true" /> אנא בחר מיקום לאיסוף עצמי *
                  </p>

                  <div className="flex flex-col gap-3">
                    {pickupLocations.map((loc) => (
                      <label
                        key={loc.id}
                        onClick={() => { setPickupLocation(loc.id); setShowPayment(false); }}
                        className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white p-3.5 transition-colors ${pickupLocation === loc.id ? 'border-cf-green' : 'border-cf-border hover:border-cf-green/50'}`}
                      >
                        <input type="radio" name="pickup-location" checked={pickupLocation === loc.id} onChange={() => {}} className="h-5 w-5 accent-cf-green" />
                        <span className="flex flex-col">
                          <span className="font-bold text-cf-navy">{loc.name}</span>
                          <span className="text-sm text-cf-muted">{loc.street}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* פרטי משלוח */}
            <section aria-labelledby="details-title" className={card}>
              <h2 id="details-title" className={`${cardTitle} mb-6 flex items-center gap-2.5`}>
                <CheckIcon size={26} className="shrink-0 text-cf-green" /> פרטי התקשרות ומשלוח
              </h2>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {textInput({ placeholder: 'שם מלא *', value: fullName, onChange: setFullName, autoComplete: 'name' })}
                {textInput({ placeholder: 'טלפון *', type: 'tel', value: phone, onChange: setPhone, autoComplete: 'tel' })}
                {textInput({ placeholder: 'אימייל לאישור הזמנה *', type: 'email', value: email, onChange: setEmail, wide: true, autoComplete: 'email' })}
                {textInput({ placeholder: 'ח.פ / עוסק מורשה (אופציונלי)', value: businessId, onChange: setBusinessId, wide: true })}
                {shippingMethod === 'delivery' && (
                  <>
                    {textInput({ placeholder: 'עיר *', value: city, onChange: setCity, autoComplete: 'address-level2' })}
                    {textInput({ placeholder: 'כתובת ומספר בית *', value: address, onChange: setAddress, autoComplete: 'street-address' })}
                    {textInput({ placeholder: 'מספר דירה (אופציונלי)', value: apartment, onChange: setApartment })}
                    {textInput({ placeholder: 'מיקוד (אופציונלי)', value: zip, onChange: setZip, autoComplete: 'postal-code' })}
                  </>
                )}
              </div>
            </section>
          </div>

          {/* עמודה שמאלית */}
          <div className="flex flex-col gap-7 lg:col-span-5">
            <section aria-labelledby="summary-title" className="cf-on-navy flex flex-col gap-5 rounded-[28px] bg-cf-navy p-[clamp(22px,3vw,32px)] text-cf-cream md:rounded-[36px]">
              <h2 id="summary-title" className="m-0 text-[22px] font-extrabold leading-[1.3] sm:text-2xl">סיכום הזמנה</h2>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white/[0.07] p-4">
                <div>
                  <p className="m-0 text-lg font-bold">מארז CleanFry</p>
                  <p className="m-0 text-sm text-cf-on-navy tabular-nums">
                    ₪{formatShekels(price.tierPriceAgorot)} למארז{price.tierPriceAgorot < LIST_PRICE_AGOROT && <> <Was agorot={LIST_PRICE_AGOROT} /></>}
                  </p>
                </div>
                <div className="inline-flex items-center overflow-hidden rounded-full border-2 border-cf-on-navy/60">
                  <button type="button" aria-label="הורדת מארז" disabled={quantity <= 1} onClick={() => changeQuantity(quantity - 1)} className="flex h-11 w-11 items-center justify-center text-cf-cream transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"><MinusIcon size={20} /></button>
                  <span aria-live="polite" className="min-w-9 text-center text-xl font-extrabold tabular-nums">{quantity}</span>
                  <button type="button" aria-label="הוספת מארז" disabled={quantity >= MAX_QUANTITY} onClick={() => changeQuantity(quantity + 1)} className="flex h-11 w-11 items-center justify-center text-cf-cream transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"><PlusIcon size={20} /></button>
                </div>
              </div>

              {/* הודעת המדרגה הבאה (מחליפה את ״חסרים לך ₪X למשלוח חינם״) */}
              <div aria-live="polite" className={`flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-4 py-3.5 text-[15px] ${nudge.good ? 'bg-cf-green-light text-cf-green-dark' : 'bg-cf-yellow text-cf-navy'}`}>
                <p className="m-0 flex items-center gap-2 font-bold"><TruckIcon size={20} className="shrink-0" />{nudge.text}</p>
                {nudge.addQuantity > 0 && quantity + nudge.addQuantity <= MAX_QUANTITY && (
                  <button type="button" onClick={() => changeQuantity(quantity + nudge.addQuantity)} className={`${pill} min-h-11 bg-cf-navy px-4 font-bold text-cf-cream`}>
                    {nudge.addQuantity === 1 ? 'הוספת מארז' : `הוספת ${packsLabel(nudge.addQuantity)}`}
                  </button>
                )}
              </div>

              <div>
                <div className="flex gap-2">
                  <input type="text" placeholder="קוד קופון" aria-label="קוד קופון" value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponError(''); }} disabled={isCouponApplied || isValidatingCoupon} className={`${field} flex-1 bg-white`} />
                  {!isCouponApplied ? (
                    <button type="button" onClick={() => handleApplyCoupon()} disabled={isValidatingCoupon} className={`${pill} min-h-12 bg-cf-cream px-6 font-bold text-cf-navy disabled:opacity-50`}>{isValidatingCoupon ? 'בודק...' : 'החל'}</button>
                  ) : (
                    <button type="button" onClick={handleRemoveCoupon} className={`${pill} min-h-12 gap-1 border-2 border-cf-on-navy/60 px-4 font-bold text-cf-cream`}><X size={18} aria-hidden="true" /> ביטול</button>
                  )}
                </div>
                {couponError && (
                  <p role="alert" className="mb-0 mt-2 text-sm font-medium text-[#FFB4A8]">{couponError}</p>
                )}
                {isCouponApplied && price.couponApplied && (
                  <p className="mb-0 mt-3 flex items-center gap-2 text-sm font-bold text-cf-lime"><CheckIcon size={16} className="shrink-0" />קופון הופעל! חסכת ₪{formatShekels(price.discountAgorot)}</p>
                )}
                {isCouponApplied && price.couponApplied && !stacksPromotions && price.tierPriceAgorot < LIST_PRICE_AGOROT && (
                  <p className="mb-0 mt-2 text-sm text-cf-on-navy">הקופון מחליף את מחיר החבילה (אין כפל מבצעים), כי הוא זול יותר.</p>
                )}
                {isCouponApplied && !price.couponApplied && (
                  <p className="mb-0 mt-3 text-sm font-bold text-cf-lime">מחיר החבילה זול מהקופון, אז קיבלתם אותו במקום הקופון (אין כפל מבצעים).</p>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-cf-muted pt-4 text-[17px] text-cf-on-navy">
                <div className="flex flex-wrap justify-between gap-x-3 tabular-nums">
                  <span>{quantity} × <span className="inline-flex items-baseline gap-1.5">₪{formatShekels(price.unitPriceAgorot)}{struck && <Was agorot={LIST_PRICE_AGOROT} />}</span></span>
                  <span className="inline-flex items-baseline gap-1.5 font-bold text-cf-cream">₪{formatShekels(price.subtotalAgorot)}{struck && <Was agorot={price.listSubtotalAgorot} />}</span>
                </div>
                {price.couponApplied && discount > 0 && <div className="flex justify-between font-bold text-cf-lime"><span>קופון {coupon.toUpperCase().trim()} ({discountPercent}%):</span><span className="tabular-nums">-₪{formatShekels(price.discountAgorot)}</span></div>}
                <div className="flex justify-between gap-3">
                  <span>דמי משלוח:</span>
                  <span className={currentShipping === 0 ? 'font-bold text-cf-lime' : 'tabular-nums'}>
                    {shippingMethod === 'pickup' ? 'איסוף עצמי (חינם)' : (currentShipping === 0 ? 'חינם' : `₪${formatShekels(price.shippingAgorot)}`)}
                    {reducedShipping && <> <Was agorot={REGULAR_HOME_SHIPPING_AGOROT} /></>}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-y-1 border-t border-cf-muted pt-4">
                  <span className="text-lg font-bold text-cf-cream">סה"כ לתשלום:</span>
                  <span aria-live="polite" className="text-[clamp(34px,4vw,44px)] font-black leading-none text-cf-cream tabular-nums">₪{formatShekels(price.totalAgorot)}</span>
                </div>
                <p className="m-0 text-sm text-cf-on-navy tabular-nums">יוצא ₪{formatShekels(price.totalAgorot / quantity)} למארז כולל הכל</p>
                {savingLine && <p className="m-0 text-[15px] font-bold text-cf-lime tabular-nums">{savingLine}</p>}
              </div>

              <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-cf-on-navy">
                {isShoppingIlPromoActive() && (
                  <img src="/shopping-il-badge.svg" alt="Shopping IL by Google" width={36} height={36} loading="lazy" />
                )}
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} aria-hidden="true" /><span>SSL SECURED</span><span aria-hidden="true">•</span><span>PCI COMPLIANT</span>
                </span>
              </div>
            </section>

            {/* תשלום */}
            <section aria-labelledby="payment-title" className={card}>
              <h2 id="payment-title" className={`${cardTitle} mb-6 flex items-center gap-2.5`}>
                <CreditCard className="shrink-0 text-cf-green" aria-hidden="true" /> תשלום מאובטח
              </h2>

              <p className={`${notice.warning} mb-5 mt-0`}>
                שים לב: מערכת הסליקה מכבדת את כל כרטיסי האשראי, <strong>למעט כרטיסי אמריקן אקספרס ודיינרס</strong>.
              </p>

              {paymentFailed && (
                <div ref={paymentFailedRef} className={`${notice.error} mb-5 animate-fadeIn`}>
                  <p className="mb-1 mt-0 text-base font-extrabold">התשלום לא הושלם</p>
                  <p className="m-0">לא בוצע חיוב. ניתן לנסות שוב עם אותו כרטיס או כרטיס אחר, ואם הבעיה חוזרת צרו איתנו קשר.</p>
                </div>
              )}

              {priceNotice && !showPayment && (
                <p role="alert" className={`${notice.warning} mb-5 mt-0 font-bold animate-fadeIn`}>{priceNotice}</p>
              )}

              {orderExpired && !showPayment && (
                <p role="alert" className={`${notice.warning} mb-5 mt-0 font-bold animate-fadeIn`}>תוקף ההזמנה פג (15 דקות). לחצו שוב על "המשך לתשלום" כדי לרענן את המחיר.</p>
              )}

              {!showPayment && (
                <div>
                  <p className="mb-4 mt-0 text-[15px] text-cf-body">מלא את כל פרטי החובה למעלה כדי לפתוח את טופס הסליקה המאובטח.</p>
                  <button type="button" onClick={handleProceedToPayment} disabled={isPreparingPayment} className={`${btnPrimary} min-h-[60px] w-full text-xl`}>
                    {isPreparingPayment ? 'מכין הזמנה...' : 'המשך לתשלום מאובטח'}
                  </button>
                </div>
              )}

              {/* אינטגרציית iframe לפי התיעוד הרשמי והעדכני של טרנזילה (directng.tranzila.com) */}
              <form
                ref={formRef}
                action="https://directng.tranzila.com/cleanfry/iframenew.php"
                method="POST"
                target="tranzila-target-frame"
                className="hidden"
              >
                <input type="hidden" name="supplier" value="cleanfry" />
                <input type="hidden" name="sum" value={payment?.sum ?? ''} />
                <input type="hidden" name="currency" value="1" />
                <input type="hidden" name="cred_type" value="1" />
                <input type="hidden" name="tranmode" value="A" />
                <input type="hidden" name="lang" value="il" />
                <input type="hidden" name="Ilang" value="HEB" />
                <input type="hidden" name="contact" value={fullName} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="city" value={tranzilaCity} />
                <input type="hidden" name="address" value={tranzilaAddress} />
                <input type="hidden" name="zip" value={zip.trim() || '0000000'} />
                <input type="hidden" name="country" value="Israel" />
                <input type="hidden" name="company" value={fullName} />
                <input type="hidden" name="u71" value="1" />
                <input type="hidden" name="inv_items" value="1" />
                {/* אין IMaam בכוונה: העסק רשום כעוסק פטור, שלא גובה ולא מציג מע"מ בחשבונית */}
                <input type="hidden" name="json_purchase_data" value={payment?.jsonPurchaseData ?? ''} />
                <input type="hidden" name="remarks" value={payment?.remarks ?? ''} />
                <input type="hidden" name="notify_url_address" value={`${window.location.origin}/api/tranzila-notify`} />
                <input type="hidden" name="success_url_address" value={`${window.location.origin}/payment-success.html`} />
                <input type="hidden" name="fail_url_address" value={`${window.location.origin}/payment-fail.html`} />
              </form>

              {showPayment && (
                <iframe
                  name="tranzila-target-frame"
                  id="tranzila-iframe"
                  className="h-[560px] w-full rounded-[20px] border border-cf-border"
                  title="Tranzila Secure Payment"
                />
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
