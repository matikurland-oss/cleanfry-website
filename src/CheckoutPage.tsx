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

  // 1. הגדרת ה-States המקוריים + תמיכה באיסוף עצמי
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocation, setPickupLocation] = useState<'kfar-saba' | 'tel-aviv' | ''>(''); 

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState(''); 

  const [showPayment, setShowPayment] = useState(false);

  // 2. הגדרות מחיר מקוריות
  const UNIT_PRICE = 1; 
  const SHIPPING_COST = 0;
  const FREE_SHIPPING_THRESHOLD = 249;
  const FORMSPREE_URL = "https://formspree.io/f/xvzwnrla";

  // 3. חישובי סכומים
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const currentShipping = shippingMethod === 'pickup' ? 0 : (isFreeShipping ? 0 : SHIPPING_COST);
  const totalPrice = subtotal - discount + currentShipping;

  const basePricePerUnitBeforeVat = UNIT_PRICE / 1.18;
  const totalDiscountBeforeVat = discount / 1.18;

  // 4. זיהוי כמות מה-URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
  }, [location]);

  // 5. מנגנון האזנה לטרנזילה ו-Formspree המקורי
  useEffect(() => {
    const sendOrderNotificationEmail = async () => {
      if (!fullName.trim() || !phone.trim()) return;

      let pickupText = '';
      if (shippingMethod === 'pickup') {
        pickupText = pickupLocation === 'kfar-saba' ? 'איסוף עצמי - כפר סבא' : 'איסוף עצמי - תל אביב';
      }

      try {
        await fetch(FORMSPREE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "נושא": "הזמנה חדשה מאתר CleanFry",
            "שם הלקוח": fullName,
            "טלפון": phone,
            "אימייל": email,
            "כמות מארזים": quantity,
            "שיטת קבלה": shippingMethod === 'delivery' ? 'משלוח עד הבית' : pickupText,
            "כתובת": shippingMethod === 'delivery' ? `${city}, ${address}, דירה ${apartment}` : pickupText,
            "קוד קופון שהופעל": isCouponApplied ? coupon.toUpperCase().trim() : 'לא הוגדר קופון',
            "סה\"כ שולם": `₪${totalPrice.toFixed(0)}`
          })
        });
      } catch (error) {
        console.error("Failed to send notification email:", error);
      }
    };

    const checkIframeRedirect = setInterval(() => {
      try {
        const iframe = document.getElementById('tranzila-iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          const iframeUrl = iframe.contentWindow.location.href;
          if (iframeUrl.includes(window.location.origin)) {
            clearInterval(checkIframeRedirect);
            sessionStorage.setItem('cleanfry_shipping_method', shippingMethod);
            sendOrderNotificationEmail();
            if (window.top) {
              window.top.location.href = `${window.location.origin}/order-success`;
            }
          }
        }
      } catch (e) {}
    }, 1000);

    const handleTranzilaMessage = async (event: MessageEvent) => {
      if (!event.origin.includes('tranzila.com') && !event.origin.includes('tranzila.co.il')) return;

      let data = event.data;
      if (typeof data === 'string') {
        try {
          const urlParams = new URLSearchParams(data);
          if (urlParams.has('Response') || urlParams.has('res')) {
            data = { Response: urlParams.get('Response'), res: urlParams.get('res') };
          }
        } catch (e) {}
      }

      const isSuccess = data && (data.Response === '000' || data.res === '000' || data === 'Response=000' || data === 'res=000');

      if (isSuccess) {
        clearInterval(checkIframeRedirect);
        sessionStorage.setItem('cleanfry_shipping_method', shippingMethod);
        await sendOrderNotificationEmail();
        
        if (window.top) {
          window.top.location.href = `${window.location.origin}/order-success`;
        }
      }
    };

    window.addEventListener('message', handleTranzilaMessage);
    return () => {
      window.removeEventListener('message', handleTranzilaMessage);
      clearInterval(checkIframeRedirect);
    };
  }, [fullName, phone, email, shippingMethod, pickupLocation, city, address, apartment, quantity, totalPrice, coupon, isCouponApplied]);

  // הפעלת הטופס
  useEffect(() => {
    if (showPayment && formRef.current) {
      formRef.current.submit();
    }
  }, [showPayment]);

  // 6. פונקציות הטופס
  const handleApplyCoupon = () => {
    const code = coupon.toUpperCase().trim();
    if (code === 'CLEAN20' || code === 'SAVE20') { 
      setDiscount(subtotal * 0.20);
      setIsCouponApplied(true);
    } else if (code === 'FIRST15' || code === 'ROTEM') {
      setDiscount(subtotal * 0.15);
      setIsCouponApplied(true);
    } else if (code === 'CLEAN10') {
      setDiscount(subtotal * 0.10);
      setIsCouponApplied(true);
    } else {
      alert('קוד קופון לא תקין');
      handleRemoveCoupon();
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon('');
    setDiscount(0);
    setIsCouponApplied(false);
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
    setShowPayment(true);
  };

  // התאמת הכתובת הנשלחת לטרנזילה לפי סוג המשלוח
  const tranzilaCity = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'כפר סבא' : 'תל אביב') : city;
  const tranzilaAddress = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'בן גוריון 7' : 'משה וילנסקי 11') : (apartment.trim() ? `${address}, דירה ${apartment}` : address);

  // אובייקט ה-JSON המקורי והפשוט
  const jsonProductsList = [
    {
      product_name: "מארז CleanFry",
      product_quantity: quantity,
      product_price: Number(basePricePerUnitBeforeVat.toFixed(2))
    }
  ];

  if (currentShipping > 0) {
    jsonProductsList.push({
      product_name: "דמי משלוח",
      product_quantity: 1,
      product_price: Number((currentShipping / 1.18).toFixed(2))
    });
  }

  const tranzilaPurchasePayload: any = {
    products: jsonProductsList
  };

  if (isCouponApplied && discount > 0) {
    tranzilaPurchasePayload.discount = Number(totalDiscountBeforeVat.toFixed(2));
    tranzilaPurchasePayload.discount_desc = `קופון הנחה: ${coupon.toUpperCase().trim()}`;
  }
  
  const encodedJsonPurchaseData = encodeURIComponent(JSON.stringify(tranzilaPurchasePayload));

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20" dir="rtl">
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

              {/* שדה בחירת מיקום חובה לאיסוף עצמי */}
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
                      <input 
                        type="radio" 
                        name="pickup-location" 
                        checked={pickupLocation === 'kfar-saba'} 
                        onChange={() => {}} 
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                      />
                      <div className="text-right">
                        <span className="font-bold text-slate-800">כפר סבא</span>
                        <span className="text-xs text-slate-500 block">רח' בן גוריון 7</span>
                      </div>
                    </label>

                    <label 
                      onClick={() => { setPickupLocation('tel-aviv'); setShowPayment(false); }}
                      className={`flex items-center gap-3 p-3 bg-white rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${pickupLocation === 'tel-aviv' ? 'border-blue-600 shadow-sm' : 'border-slate-200'}`}
                    >
                      <input 
                        type="radio" 
                        name="pickup-location" 
                        checked={pickupLocation === 'tel-aviv'} 
                        onChange={() => {}} 
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" 
                      />
                      <div className="text-right">
                        <span className="font-bold text-slate-800">תל אביב</span>
                        <span className="text-xs text-slate-500 block">רח' משה וילנסקי 11</span>
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
                <p>שים לב: מערכת הסליקה מכבדת את כל כרטיסי האשראי, **למעט כרטיסי אמריקן אקספרס (American Express) ודיינרס (Diners)**.</p>
              </div>
              
              {!showPayment ? (
                <div>
                  <p className="text-slate-500 text-sm mb-4">מלא את כל פרטי החובה למעלה כדי לפתוח את טופס הסליקה המאובטח.</p>
                  <button onClick={handleProceedToPayment} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-md hover:bg-blue-700 transition-all">המשך לתשלום מאובטח</button>
                </div>
              ) : (
                <div className="w-full mt-2">
                  <form 
                    ref={formRef}
                    action="https://direct.tranzila.com/cleanfry/iframe.php" 
                    method="POST" 
                    target="tranzila-target-frame"
                    className="hidden"
                  >
                    <input type="hidden" name="sum" value={totalPrice.toFixed(0)} />
                    <input type="hidden" name="currency" value="1" />
                    <input type="hidden" name="lang" value="il" />
                    <input type="hidden" name="tranmode" value="A" />
                    <input type="hidden" name="u71" value="1" />
                    <input type="hidden" name="inv_items" value="1" />
                    <input type="hidden" name="contact" value={fullName} />
                    <input type="hidden" name="phone" value={phone} />
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="city" value={tranzilaCity} />
                    <input type="hidden" name="address" value={tranzilaAddress} />
                    <input type="hidden" name="company" value={fullName} />
                    <input type="hidden" name="json_purchase_data" value={encodedJsonPurchaseData} />
                    <input type="hidden" name="expari" value="0" />
                  </form>

                  <iframe 
                    name="tranzila-target-frame"
                    id="tranzila-iframe" 
                    className="w-full h-[480px] border border-slate-100 rounded-2xl shadow-inner" 
                    title="Tranzila Secure Payment" 
                  />
                </div>
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
                  <input type="text" placeholder="קוד קופון" value={coupon} onChange={(e) => { setCoupon(e.target.value); setShowPayment(false); }} disabled={isCouponApplied} className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 text-right" />
                  {!isCouponApplied ? (
                    <button onClick={handleApplyCoupon} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition">החל</button>
                  ) : (
                    <button onClick={handleRemoveCoupon} className="bg-red-50 text-red-500 px-4 rounded-xl font-bold hover:bg-red-100 transition flex items-center gap-1"><X size={18} /> ביטול</button>
                  )}
                </div>
                {isCouponApplied && (
                  <div className="flex items-center justify-between gap-2 text-green-600 text-sm mt-3 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>קופון הופעל! חסכת ₪{discount.toFixed(0)}</span></div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-slate-600">
                <div className="flex justify-between"><span>סיכום ביניים ({quantity} יח'):</span><span className="font-bold">₪{subtotal}</span></div>
                <div className="flex justify-between"><span>דמי משלוח:</span><span className={currentShipping === 0 ? "text-green-600 font-bold" : ""}>{shippingMethod === 'pickup' ? "איסוף עצמי (חינם)" : (isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>הנחה:</span><span>-₪{discount.toFixed(0)}</span></div>}
                <div className="flex justify-between items-end pt-6 border-t border-slate-100"><span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span><span className="text-4xl font-black text-blue-600 tabular-nums">₪{totalPrice.toFixed(0)}</span></div>
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
