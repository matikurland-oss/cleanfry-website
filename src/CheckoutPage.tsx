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

const CheckoutPage = () => {
  const location = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const paymentFailedRef = useRef<HTMLDivElement>(null);

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
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState(''); 

  const [paymentFailed, setPaymentFailed] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // 2. הגדרות מחיר
  const UNIT_PRICE = 59;
  const SHIPPING_COST = 35;
  const FREE_SHIPPING_THRESHOLD = 249;
  const FORMSPREE_URL = "https://formspree.io/f/xvzwnrla";

  // 3. חישובי סכומים
  // ההנחה נגזרת מאחוז הקופון בכל רינדור, כך שהיא תמיד מעודכנת גם אם הלקוח שינה כמות אחרי הפעלת הקופון.
  // אחוז ההנחה מגיע מאימות בצד השרת (api/validate-coupon) ולא מרשימה בקוד הלקוח.
  // ההנחה מחושבת על מחיר המוצרים בלבד (subtotal) — המשלוח מתווסף במלואו אחרי ההנחה.
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const currentShipping = shippingMethod === 'pickup' ? 0 : (isFreeShipping ? 0 : SHIPPING_COST);
  const discount = isCouponApplied ? Math.round(subtotal * discountPercent) : 0;
  const totalPrice = Math.round(subtotal - discount + currentShipping);

  // 4. זיהוי כמות מה-URL + חזרה מתשלום שנכשל
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
    if (params.get('payment') === 'failed') setPaymentFailed(true);
  }, [location]);

  // גלילה אוטומטית להודעת "התשלום נכשל" ברגע שהיא מופיעה, כדי שהלקוח לא יפספס אותה
  useEffect(() => {
    if (paymentFailed) {
      paymentFailedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [paymentFailed]);

  // 5. שליחת הטופס ל-iframe של טרנזילה ברגע פתיחת אזור התשלום
  useEffect(() => {
    if (showPayment && formRef.current) {
      formRef.current.submit();
    }
  }, [showPayment]);

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
  const handleApplyCoupon = async () => {
    const code = coupon.toUpperCase().trim();
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

      if (result.valid) {
        setDiscountPercent(result.discountPercent);
        setIsCouponApplied(true);
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

  const handleProceedToPayment = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      alert('אנא מלא את פרטי החובה: שם מלא, טלפון ואימייל');
      return;
    }
    if (shippingMethod === 'delivery' && (!city.trim() || !address.trim())) {
      alert('נבחר משלוח עד הבית. אנא מלא עיר, כתובת ומספר בית כדי להמשיך לטופס התשלום.');
      return;
    }
    if (shippingMethod === 'pickup' && !pickupLocation) {
      alert('אנא בחר מיקום לאיסוף עצמי כדי להמשיך.');
      return;
    }

    // שמירת פרטי ההזמנה לפני המעבר לעמוד התשלום של טרנזילה —
    // עמוד התודה (order-success) קורא אותם אחרי החזרה ושולח את מייל ההתראה
    const pickupText = pickupLocation === 'kfar-saba' ? 'איסוף עצמי - כפר סבא (בן גוריון 7)' : 'איסוף עצמי - תל אביב (משה וילנסקי 11)';
    sessionStorage.setItem('cleanfry_shipping_method', shippingMethod);
    sessionStorage.setItem('cleanfry_pending_order', JSON.stringify({
      "נושא": "הזמנה חדשה מאתר CleanFry",
      "שם הלקוח": fullName,
      "טלפון": phone,
      "אימייל": email,
      "כמות מארזים": quantity,
      "שיטת קבלה": shippingMethod === 'delivery' ? 'משלוח עד הבית' : pickupText,
      "כתובת": shippingMethod === 'delivery' ? `${city}, ${address}${apartment.trim() ? `, דירה ${apartment}` : ''}` : pickupText,
      "קוד קופון שהופעל": isCouponApplied ? coupon.toUpperCase().trim() : 'לא הוגדר קופון',
      "סה\"כ שולם": `₪${totalPrice}`
    }));

    setShowPayment(true);
  };

  // קביעת הכתובות הדינמיות שיוצגו בראש החשבונית
  const tranzilaCity = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'כפר סבא' : 'תל אביב') : city;
  const tranzilaAddress = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'בן גוריון 7' : 'משה וילנסקי 11') : (apartment.trim() ? `${address}, דירה ${apartment}` : address);

  // בניית מערך הפריטים לחשבונית
  // טרנזילה מצפה למערך שטוח של פריטים (ללא עטיפת אובייקט), וסכום כל השורות חייב להיות שווה בדיוק לשדה sum.
  // לפי התיעוד הרשמי אין שדה ייעודי להנחה/קופון ואין דוגמה למחיר שלילי — בבדיקה בפועל שורת "מוצר"
  // במחיר שלילי גרמה לטרנזילה להתעלם מכל הפירוט ולהציג שורה גנרית אחת. לכן ההנחה "מוטמעת" במחיר
  // המוצר עצמו (מוריד את המחיר ליחידה), כך שכל השורות נשארות בערך חיובי, והקופון מצוין בשם המוצר.
  // דמי המשלוח נשארים תמיד במחיר המלא ואינם מוזלים על ידי הקופון.
  const roundToAgorot = (value: number) => Math.round(value * 100) / 100;
  const discountAppliedToProduct = Math.min(discount, subtotal);
  const discountAppliedToShipping = Math.max(0, discount - subtotal);
  const productLinePrice = roundToAgorot((subtotal - discountAppliedToProduct) / quantity);
  const shippingLinePrice = roundToAgorot(Math.max(0, currentShipping - discountAppliedToShipping));

  const productName = isCouponApplied && discount > 0
    ? `מארז CleanFry (קופון ${coupon.toUpperCase().trim()} — נחסכו ₪${discount})`
    : 'מארז CleanFry';

  const jsonProductsList = [
    {
      product_name: productName,
      product_quantity: quantity,
      product_price: productLinePrice
    }
  ];

  // איסוף עצמי מופיע בחשבונית כשורה בעלות 0, משלוח בתשלום מופיע עם עלותו (במחיר המלא, ללא הנחה)
  if (shippingMethod === 'pickup') {
    jsonProductsList.push({
      product_name: pickupLocation === 'kfar-saba' ? "איסוף עצמי - סניף כפר סבא" : "איסוף עצמי - סניף תל אביב",
      product_quantity: 1,
      product_price: 0
    });
  } else {
    jsonProductsList.push({
      product_name: "דמי משלוח עד הבית",
      product_quantity: 1,
      product_price: shippingLinePrice
    });
  }

  // לפי תיעוד טרנזילה: JSON ללא רווחים/שברי שורה. שליחה דרך טופס HTML רגיל (לא AJAX),
  // כך שהדפדפן עצמו מבצע את קידוד ה-POST הנדרש — אין לקודד ידנית כדי למנוע קידוד כפול.
  const encodedJsonPurchaseData = JSON.stringify(jsonProductsList);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
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
                {shippingMethod === 'delivery' && (
                  <>
                    <input type="text" placeholder="עיר *" value={city} onChange={(e) => { setCity(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="כתובת ומספר בית *" value={address} onChange={(e) => { setAddress(e.target.value); setShowPayment(false); }} className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="מספר דירה (אופציונלי)" value={apartment} onChange={(e) => { setApartment(e.target.value); setShowPayment(false); }} className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                  </>
                )}
              </div>
            </div>

            {/* תשלום */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800">
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

              {!showPayment && (
                <div>
                  <p className="text-slate-500 text-sm mb-4">מלא את כל פרטי החובה למעלה כדי לפתוח את טופס הסליקה המאובטח.</p>
                  <button onClick={handleProceedToPayment} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-md hover:bg-blue-700 transition-all">המשך לתשלום מאובטח</button>
                </div>
              )}

              {/* אינטגרציית iframe לפי התיעוד הרשמי של טרנזילה (iframenew.php) */}
              <form
                ref={formRef}
                action="https://direct.tranzila.com/cleanfry/iframenew.php"
                method="POST"
                target="tranzila-target-frame"
                className="hidden"
              >
                <input type="hidden" name="sum" value={totalPrice} />
                <input type="hidden" name="currency" value="1" />
                <input type="hidden" name="cred_type" value="1" />
                <input type="hidden" name="tranmode" value="A" />
                <input type="hidden" name="lang" value="il" />
                <input type="hidden" name="contact" value={fullName} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="city" value={tranzilaCity} />
                <input type="hidden" name="address" value={tranzilaAddress} />
                <input type="hidden" name="company" value={fullName} />
                <input type="hidden" name="u71" value="1" />
                <input type="hidden" name="inv_items" value="1" />
                <input type="hidden" name="json_purchase_data" value={encodedJsonPurchaseData} />
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

          {/* עמודה שמאלית */}
          <div className="lg:col-span-5 text-right">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-8">
              <h2 className="text-2xl font-black mb-6 border-b pb-4 text-slate-800">סיכום הזמנה</h2>
              
              <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl">
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
                  <p className="font-bold">חסרים לך ₪{FREE_SHIPPING_THRESHOLD - subtotal} למשלוח חינם!</p>
                </div>
              )}

              <div className="mb-8">
                <div className="flex gap-2">
                  <input type="text" placeholder="קוד קופון" value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponError(''); }} disabled={isCouponApplied || isValidatingCoupon} className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 text-right" />
                  {!isCouponApplied ? (
                    <button onClick={handleApplyCoupon} disabled={isValidatingCoupon} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition disabled:opacity-50">{isValidatingCoupon ? 'בודק...' : 'החל'}</button>
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
                <div className="flex justify-between"><span>דמי משלוח:</span><span className={currentShipping === 0 ? "text-green-600 font-bold" : ""}>{shippingMethod === 'pickup' ? "איסוף עצמי (חינם)" : (isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>הנחה:</span><span>-₪{discount}</span></div>}
                <div className="flex justify-between items-end pt-6 border-t border-slate-100"><span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span><span className="text-4xl font-black text-blue-600 tabular-nums">₪{totalPrice}</span></div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 opacity-40 grayscale text-[10px] font-bold">
                <ShieldCheck size={16} className="text-blue-600" /><span>SSL SECURED</span><span>•</span><span>PCI COMPLIANT</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
