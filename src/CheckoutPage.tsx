import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
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
import { motion, AnimatePresence } from 'framer-motion';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // States לפרטי הזמנה
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');

  // States לפרטי לקוח עבור טרנזילה
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState(''); 

  // States אופציונליים לחשבונית
  const [invoiceName, setInvoiceName] = useState('');
  const [companyId, setCompanyId] = useState('');

  // שליטה בהצגת ה-iFrame של התשלום
  const [showPayment, setShowPayment] = useState(false);

  // הגדרות מחיר לטסט
  const UNIT_PRICE = 1;
  const SHIPPING_COST = 0;
  const FREE_SHIPPING_THRESHOLD = 249;

  // זיהוי כמות מה-URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
  }, [location]);

  // מנגנון האזנה חכם: תופס מתי ה-iFrame משתנה או שולח הודעת הצלחה
  useEffect(() => {
    const handleTranzilaMessage = (event: MessageEvent) => {
      // תפיסת הודעות postMessage רגילות
      const data = event.data;
      if (data && (data.Response === '000' || data.res === '000' || data === 'Response=000' || data === 'res=000')) {
        navigate('/thanks?type=order');
        return;
      }

      // הגנה עוקפת: אם ה-iFrame מנסה לטעון בתוכו את דף ה-thanks, נשבור את המסגרת ונעביר את כל האתר
      try {
        if (typeof data === 'string' && (data.includes('thanks') || data.includes('type=order'))) {
          navigate('/thanks?type=order');
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('message', handleTranzilaMessage);
    return () => window.removeEventListener('message', handleTranzilaMessage);
  }, [navigate]);

  // חישובים
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  
  const currentShipping = shippingMethod === 'pickup' ? 0 : (isFreeShipping ? 0 : SHIPPING_COST);

  const handleApplyCoupon = () => {
    const code = coupon.toUpperCase().trim();
    if (code === 'CLEAN20' || code === 'SAVE20') { 
      setDiscount(subtotal * 0.20);
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

  const totalPrice = subtotal - discount + currentShipping;

  const handleProceedToPayment = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      alert('אנא מלא את פרטי החובה: שם מלא, טלפון ואימייל');
      return;
    }
    if (shippingMethod === 'delivery' && (!city.trim() || !address.trim())) {
      alert('נבחר משלוח עד הבית. אנא מלא עיר, כתובת ומספר בית כדי להמשיך לטופס התשלום.');
      return;
    }
    setShowPayment(true);
  };

  const fullAddressString = apartment.trim() 
    ? `${address}, דירה ${apartment}` 
    : address;

  // בניית ה-URL עבור ה-iFrame של טרנזילה
  const tranzilaUrl = `https://direct.tranzila.com/cleanfry/iframe.php?sum=${totalPrice.toFixed(0)}&currency=1&lang=il&tranmode=A&contact=${encodeURIComponent(fullName)}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&city=${encodeURIComponent(city)}&address=${encodeURIComponent(fullAddressString)}&company=${encodeURIComponent(invoiceName)}&pdesc=${encodeURIComponent(companyId)}`;

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
            
            {/* שיטת קבלה */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Truck className="text-blue-500" size={28} /> איך תרצו לקבל את החבילה?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => { setShippingMethod('delivery'); setShowPayment(false); }}
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
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">ת"א / כפר סבא בלבד</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'pickup' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {shippingMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {shippingMethod === 'pickup' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-blue-800 flex gap-3 overflow-hidden shadow-md"
                  >
                    <MapPin className="flex-shrink-0 mt-1 text-blue-600" size={20} />
                    <div className="text-right">
                      <p className="font-bold mb-1 text-lg underline decoration-blue-300 underline-offset-4">איסוף עצמי ניתן מתל אביב או כפר סבא בלבד:</p>
                      <p className="font-medium">• תל אביב: רח' משה וילנסקי 11</p>
                      <p className="font-medium">• כפר סבא: רח' בן גוריון 7</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* פרטי התקשרות */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <CheckCircle2 className="text-blue-500" /> פרטי התקשרות ומשלוח
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" placeholder="שם מלא *" value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setShowPayment(false); }}
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                />
                <input 
                  type="tel" placeholder="טלפון *" value={phone}
                  onChange={(e) => { setPhone(e.target.value); setShowPayment(false); }}
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                />
                <input 
                  type="email" placeholder="אימייל לאישור הזמנה *" value={email}
                  onChange={(e) => { setEmail(e.target.value); setShowPayment(false); }}
                  className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                />
                
                {shippingMethod === 'delivery' && (
                  <>
                    <input 
                      type="text" placeholder="עיר *" value={city}
                      onChange={(e) => { setCity(e.target.value); setShowPayment(false); }}
                      className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                    />
                    <input 
                      type="text" placeholder="כתובת ומספר בית *" value={address}
                      onChange={(e) => { setAddress(e.target.value); setShowPayment(false); }}
                      className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                    />
                    <input 
                      type="text" placeholder="מספר דירה (אופציונלי)" value={apartment}
                      onChange={(e) => { setApartment(e.target.value); setShowPayment(false); }}
                      className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                    />
                  </>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-md font-bold mb-3 text-slate-700">פרטי חשבונית (אופציונלי)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="חשבונית על שם" value={invoiceName}
                    onChange={(e) => { setInvoiceName(e.target.value); setShowPayment(false); }}
                    className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                  />
                  <input 
                    type="text" placeholder="ח.פ / ת.ז" value={companyId}
                    onChange={(e) => { setCompanyId(e.target.value); setShowPayment(false); }}
                    className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                  />
                </div>
              </div>
            </div>

            {/* חלק תשלום מאובטח */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800">
                <CreditCard className="text-blue-500" /> תשלום מאובטח
              </h2>
              
              {!showPayment ? (
                <div>
                  <p className="text-slate-500 text-sm mb-4">מלא את כל פרטי החובה למעלה כדי לפתוח את טופס הסליקה המאובטח.</p>
                  <button 
                    onClick={handleProceedToPayment}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-md hover:bg-blue-700 transition-all"
                  >
                    המשך לתשלום מאובטח
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full mt-2">
                  <iframe 
                    src={tranzilaUrl}
                    className="w-full h-[480px] border border-slate-100 rounded-2xl shadow-inner"
                    title="Tranzila Secure Payment"
                    id="tranzila-iframe"
                  />
                </motion.div>
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

              <div className="space-y-3 pt-4 border-t border-slate-100 text-slate-600">
                <div className="flex justify-between">
                  <span>סיכום ביניים ({quantity} יח'):</span>
                  <span className="font-bold">₪{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>דמי משלוח:</span>
                  <span className={currentShipping === 0 ? "text-green-600 font-bold" : ""}>
                    {shippingMethod === 'pickup' ? "איסוף עצמי (חינם)" : (isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`)}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                  <span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span>
                  <span className="text-4xl font-black text-blue-600 tabular-nums">₪{totalPrice.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
