import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  ChevronRight, 
  CreditCard,
  Plus,
  Minus,
  CheckCircle2,
  X,
  MapPin
} from 'lucide-react';
import { isValidIsraeliPhone } from './checkoutValidation';
import { isShoppingIlPromoActive } from './shoppingIlPromo';
import { track, trackCartEvent, savePendingPurchase } from './analytics';
import {
  FREE_SHIPPING_THRESHOLD_AGOROT,
  SHIPPING_AGOROT,
  UNIT_PRICE_AGOROT,
  priceOrder
} from '../shared/pricing';

const CheckoutPage = () => {
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const paymentFailedRef = useRef<HTMLDivElement>(null);
  const checkoutTrackedRef = useRef(false);

  // 1. States
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
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

  // 2. הגדרות מחיר
  const UNIT_PRICE = UNIT_PRICE_AGOROT / 100;
  const SHIPPING_COST = SHIPPING_AGOROT / 100;
  const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_AGOROT / 100;

  // 3. חישובי סכומים — לתצוגה בלבד. אותה פונקציה (shared/pricing) רצה בשרת וקובעת את הסכום המחייב;
  // השרת לא מקבל מהדפדפן סכום, אחוז הנחה או עלות משלוח. אחוז ההנחה כאן (18 = 18%) מגיע מ-validate-coupon.
  const price = priceOrder({ quantity, deliveryMethod: shippingMethod, discountPercent: isCouponApplied ? discountPercent : 0 });
  const subtotal = price.subtotalAgorot / 100;
  const discount = price.discountAgorot / 100;
  const amountAfterDiscount = price.productsAfterDiscountAgorot / 100;
  const isFreeShipping = price.isFreeShipping;
  const currentShipping = price.shippingAgorot / 100;
  const totalPrice = price.totalAgorot / 100;

  // 4. זיהוי כמות מה-URL + חזרה מתשלום שנכשל
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
    if (params.get('payment') === 'failed') {
      setPaymentFailed(true);
      if (!checkoutTrackedRef.current) track('payment_failed');
    } else if (!checkoutTrackedRef.current) {
      // מאיפה הגיעו לצ'קאאוט: הפופאפ מוסיף קופון, כפתור הקנייה מוסיף כמות, אייקון הסל — כלום
      const source = params.get('coupon') ? 'promo_popup' : params.get('q') ? 'purchase_box' : 'cart_or_direct';
      trackCartEvent('begin_checkout', qParam >= 1 && qParam <= 10 ? qParam : 1, { source });
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
    setIsCouponApplied(false);
    setCouponError('');
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20" dir="rtl">
      {/* התראה צפה שקופצת מיד עם החזרה מתשלום שנכשל, בנוסף להודעה בתוך תיבת התשלום */}
      {paymentFailed && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-50 max-w-sm bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <span className="text-2xl">❌</span>
          <p className="font-bold text-sm">התשלום נכשל — לא בוצע חיוב</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b py-4 px-6 mb-8 flex justify-between items-center max-w-6xl mx-auto rounded-b-2xl shadow-sm">
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-1 hover:opacity-80">
          <ChevronRight size={18} /> חזרה לחנות
        </Link>
        <span className="font-black text-xl text-slate-800 tracking-tight">הסל שלי</span>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* עמודה ימנית */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* בחירת שיטת קבלה */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Truck className="text-blue-500" size={28} /> איך תרצו לקבל את החבילה?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => { setShippingMethod('delivery'); setPickupLocation(''); setShowPayment(false); }}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${shippingMethod === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className="text-right">
                    <p className="font-bold text-slate-800">משלוח עד הבית</p>
                    <p className="text-xs text-slate-500">3-5 ימי עסקים</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'delivery' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {shippingMethod === 'delivery' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <div 
                  onClick={() => { setShippingMethod('pickup'); setShowPayment(false); }}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${shippingMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className="text-right">
                    <p className="font-bold text-slate-800">איסוף עצמי</p>
                    <p className="text-xs text-green-600 font-bold underline">חינם</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">ת"א / כפר סבא</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'pickup' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {shippingMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {shippingMethod === 'pickup' && (
                <div className="mt-5 p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl text-blue-900 shadow-sm animate-fadeIn">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="text-blue-600 flex-shrink-0" size={22} />
                    <p className="font-black text-lg">אנא בחר מיקום לאיסוף עצמי *</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label 
                      onClick={() => { setPickupLocation('kfar-saba'); setShowPayment(false); }}
                      className={`flex items-center gap-3 p-3 bg-white rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${pickupLocation === 'kfar-saba' ? 'border-blue-600 shadow-sm' : 'border-slate-200'}`}
                    >
                      <input type="radio" name="pickup-location" checked={pickupLocation === 'kfar-saba'} onChange={() => {}} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                      <div className="text-right">
                        <span className="font-bold text-slate-800">כפר סבא</span>
                        <span className="text-xs text-slate-500 block">רח' - בן גוריון 7</span>
                      </div>
                    </label>

                    <label 
                      onClick={() => { setPickupLocation('tel-aviv'); setShowPayment(false); }}
                      className={`flex items-center gap-3 p-3 bg-white rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${pickupLocation === 'tel-aviv' ? 'border-blue-600 shadow-sm' : 'border-slate-200'}`}
                    >
                      <input type="radio" name="pickup-location" checked={pickupLocation === 'tel-aviv'} onChange={() => {}} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" />
                      <div className="text-right">
                        <span className="font-bold text-slate-800">תל אביב</span>
                        <span className="text-xs text-slate-500 block">רח' - משה וילנסקי 11</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* פרטי משלוח */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <CheckCircle2 className="text-blue-500" /> פרטי התקשרות ומשלוח
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="שם מלא *" value={fullName} onChange={(e) => { setFullName(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                <input type="tel" placeholder="טלפון *" value={phone} onChange={(e) => { setPhone(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                <input type="email" placeholder="אימייל לאישור הזמנה *" value={email} onChange={(e) => { setEmail(e.target.value); setShowPayment(false); }} className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                <input type="text" placeholder="ח.פ / עוסק מורשה (אופציונלי)" value={businessId} onChange={(e) => { setBusinessId(e.target.value); setShowPayment(false); }} className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                {shippingMethod === 'delivery' && (
                  <>
                    <input type="text" placeholder="עיר *" value={city} onChange={(e) => { setCity(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="כתובת ומספר בית *" value={address} onChange={(e) => { setAddress(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="מספר דירה (אופציונלי)" value={apartment} onChange={(e) => { setApartment(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="מיקוד (אופציונלי)" value={zip} onChange={(e) => { setZip(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* עמודה שמאלית */}
          <div className="lg:col-span-5 space-y-5 text-right">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black mb-6 border-b pb-4 text-slate-800">סיכום הזמנה</h2>

              <div className="flex flex-wrap justify-between items-center gap-3 mb-8 bg-slate-50 p-4 rounded-2xl">
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-800">מארז CleanFry</p>
                  <p className="text-sm text-slate-500">₪{UNIT_PRICE} ליחידה</p>
                </div>
                <div className="flex items-center gap-4 bg-white rounded-full p-1 border shadow-sm">
                  <button onClick={() => { if (quantity > 1) { setQuantity(q => q - 1); setShowPayment(false); } }} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 transition text-slate-400 hover:text-red-500"><Minus size={18} /></button>
                  <span className="font-black text-xl w-6 text-center tabular-nums">{quantity}</span>
                  <button onClick={() => { if (quantity < 10) { setQuantity(q => q + 1); setShowPayment(false); } }} className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 transition"><Plus size={18} /></button>
                </div>
              </div>

              {shippingMethod === 'delivery' && !isFreeShipping && (
                <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-700 text-sm">
                  <p className="font-bold">חסרים לך ₪{FREE_SHIPPING_THRESHOLD - amountAfterDiscount} למשלוח חינם!</p>
                </div>
              )}

              <div className="mb-8">
                <div className="flex gap-2">
                  <input type="text" placeholder="קוד קופון" value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponError(''); }} disabled={isCouponApplied || isValidatingCoupon} className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 text-right" />
                  {!isCouponApplied ? (
                    <button onClick={() => handleApplyCoupon()} disabled={isValidatingCoupon} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition disabled:opacity-50">{isValidatingCoupon ? 'בודק...' : 'החל'}</button>
                  ) : (
                    <button onClick={handleRemoveCoupon} className="bg-red-50 text-red-500 px-4 rounded-xl font-bold hover:bg-red-100 transition flex items-center gap-1"><X size={18} /> ביטול</button>
                  )}
                </div>
                {couponError && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{couponError}</p>
                )}
                {isCouponApplied && (
                  <div className="flex items-center justify-between gap-2 text-green-600 text-sm mt-3 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>קופון הופעל! חסכת ₪{discount}</span></div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-slate-600">
                <div className="flex justify-between"><span>סיכום ביניים ({quantity} יח'):</span><span className="font-bold">₪{subtotal}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>הנחה:</span><span>-₪{discount}</span></div>}
                <div className="flex justify-between"><span>דמי משלוח:</span><span className={currentShipping === 0 ? "text-green-600 font-bold" : ""}>{shippingMethod === 'pickup' ? "איסוף עצמי (חינם)" : (isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`)}</span></div>
                <div className="flex flex-wrap justify-between items-end gap-y-1 pt-6 mt-2 border-t-2 border-slate-100"><span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span><span className="text-brand-blue text-3xl sm:text-4xl md:text-5xl font-black tabular-nums">₪{totalPrice}</span></div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold">
                {isShoppingIlPromoActive() && (
                  <img src="/shopping-il-badge.svg" alt="Shopping IL by Google" width={36} height={36} loading="lazy" />
                )}
                <div className="flex items-center gap-2 opacity-40 grayscale">
                  <ShieldCheck size={16} className="text-blue-600" /><span>SSL SECURED</span><span>•</span><span>PCI COMPLIANT</span>
                </div>
              </div>
            </div>

            {/* תשלום */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-md border border-slate-100 text-right">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <CreditCard className="text-blue-500" /> תשלום מאובטח
              </h2>

              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm font-semibold flex items-start gap-2">
                <span className="text-base mt-0.5">⚠️</span>
                <p>שים לב: מערכת הסליקה מכבדת את כל כרטיסי האשראי, <strong>למעט כרטיסי אמריקן אקספרס ודיינרס</strong>.</p>
              </div>

              {paymentFailed && (
                <div ref={paymentFailedRef} className="mb-5 p-5 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 shadow-md animate-fadeIn flex items-start gap-3">
                  <span className="text-2xl leading-none">❌</span>
                  <div>
                    <p className="font-black text-base mb-1">התשלום לא הושלם</p>
                    <p className="text-sm font-medium">לא בוצע חיוב. ניתן לנסות שוב עם אותו כרטיס או כרטיס אחר, ואם הבעיה חוזרת צרו איתנו קשר.</p>
                  </div>
                </div>
              )}

              {priceNotice && !showPayment && (
                <div role="alert" className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-sm font-bold flex items-start gap-2 animate-fadeIn">
                  <span className="text-base mt-0.5">⚠️</span>
                  <p>{priceNotice}</p>
                </div>
              )}

              {orderExpired && !showPayment && (
                <div role="alert" className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-sm font-bold flex items-start gap-2 animate-fadeIn">
                  <span className="text-base mt-0.5">⏱️</span>
                  <p>תוקף ההזמנה פג (15 דקות). לחצו שוב על "המשך לתשלום" כדי לרענן את המחיר.</p>
                </div>
              )}

              {!showPayment && (
                <div>
                  <p className="text-slate-500 text-sm mb-4">מלא את כל פרטי החובה למעלה כדי לפתוח את טופס הסליקה המאובטח.</p>
                  <button onClick={handleProceedToPayment} disabled={isPreparingPayment} className="w-full gradient-brand text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:brightness-110 hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:brightness-100">
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
                  className="w-full h-[560px] border border-slate-100 rounded-2xl shadow-inner"
                  title="Tranzila Secure Payment"
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
