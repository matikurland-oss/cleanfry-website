import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');

  // הגדרות מחיר
  const UNIT_PRICE = 59;
  const SHIPPING_COST = 30;
  const FREE_SHIPPING_THRESHOLD = 249;

  // זיהוי כמות מה-URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
  }, [location]);

  // חישובים
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  
  // לוגיקת משלוח: אם איסוף עצמי זה 0, אחרת בודק אם מעל רף משלוח חינם
  const currentShipping = shippingMethod === 'pickup' ? 0 : (isFreeShipping ? 0 : SHIPPING_COST);

  const handleApplyCoupon = () => {
    const code = coupon.toUpperCase().trim();
    
    // קביעת קוד קופון של 20% - ניתן לשנות את השם כאן
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b py-4 px-6 mb-8 flex justify-between items-center max-w-6xl mx-auto rounded-b-2xl shadow-sm">
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-1 hover:opacity-80">
          <ChevronRight size={18} /> חזרה לחנות
        </Link>
        <span className="font-black text-xl text-slate-800 tracking-tight">CleanFry Checkout</span>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* עמודה ימנית: פרטים ושיטת קבלה */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* בחירת שיטת קבלה */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Truck className="text-blue-500" size={28} /> איך תרצו לקבל את החבילה?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setShippingMethod('delivery')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${shippingMethod === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div>
                    <p className="font-bold text-slate-800">משלוח עד הבית</p>
                    <p className="text-xs text-slate-500">3-5 ימי עסקים</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'delivery' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {shippingMethod === 'delivery' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <div 
                  onClick={() => setShippingMethod('pickup')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${shippingMethod === 'pickup' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div>
                    <p className="font-bold text-slate-800">איסוף עצמי</p>
                    <p className="text-xs text-green-600 font-bold underline">חינם</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'pickup' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {shippingMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {shippingMethod === 'pickup' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-800 flex gap-3 overflow-hidden text-right"
                  >
                    <MapPin className="flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-bold mb-1 underline">איסוף עצמי ניתן מתל אביב או כפר סבא בלבד:</p>
                      <p>• תל אביב: רח' משה וילנסקי</p>
                      <p>• כפר סבא: רח' בן גוריון</p>
                      <p className="mt-2 text-xs font-medium opacity-90 italic">* אנחנו נתקשר ונתאם את נקודת האיסוף הנוחה לכם לאחר ביצוע ההזמנה.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* פרטי משלוח/קשר */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <CheckCircle2 className="text-blue-500" /> פרטי התקשרות
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="שם מלא" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                <input 
                  type="tel" 
                  placeholder="טלפון" 
                  className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" 
                />
                <input type="email" placeholder="אימייל לאישור הזמנה" className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                
                {shippingMethod === 'delivery' && (
                  <>
                    <input type="text" placeholder="עיר" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                    <input type="text" placeholder="כתובת ומספר בית" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right" />
                  </>
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 text-right">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800">
                <CreditCard className="text-blue-500" /> תשלום מאובטח
              </h2>
              <p className="text-slate-500 text-sm italic">הסליקה תתבצע בדף מאובטח לאחר לחיצה על כפתור ההזמנה.</p>
            </div>
          </div>

          {/* עמודה שמאלית: סיכום הזמנה */}
          <div className="lg:col-span-5 text-right">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-8">
              <h2 className="text-2xl font-black mb-6 border-b pb-4 text-slate-800">סיכום הזמנה</h2>
              
              <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-2xl">
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-800">מארז CleanFry</p>
                  <p className="text-sm text-slate-500">₪{UNIT_PRICE} ליחידה</p>
                </div>
                <div className="flex items-center gap-4 bg-white rounded-full p-1 border shadow-sm">
                  <button onClick={() => quantity > 1 && setQuantity(q => q - 1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-50 transition text-slate-400 hover:text-red-500"><Minus size={18} /></button>
                  <span className="font-black text-xl w-6 text-center tabular-nums">{quantity}</span>
                  <button onClick={() => quantity < 10 && setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 transition"><Plus size={18} /></button>
                </div>
              </div>

              {shippingMethod === 'delivery' && !isFreeShipping && (
                <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-700 text-sm text-right">
                  <p className="font-bold">חסרים לך ₪{FREE_SHIPPING_THRESHOLD - subtotal} למשלוח חינם!</p>
                  <div className="w-full bg-orange-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${(subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }}></div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="קוד קופון" 
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={isCouponApplied}
                    className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 disabled:opacity-50 text-right"
                  />
                  {!isCouponApplied ? (
                    <button onClick={handleApplyCoupon} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition">החל</button>
                  ) : (
                    <button onClick={handleRemoveCoupon} className="bg-red-50 text-red-500 px-4 rounded-xl font-bold hover:bg-red-100 transition flex items-center gap-1">
                      <X size={18} /> ביטול
                    </button>
                  )}
                </div>
                {isCouponApplied && (
                  <div className="flex items-center justify-between gap-2 text-green-600 text-sm mt-3 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>קופון הופעל! חסכת ₪{discount.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-slate-600">
                <div className="flex justify-between">
                  <span>סיכום ביניים ({quantity} יח'):</span>
                  <span className="font-bold underline decoration-blue-200 underline-offset-4">₪{subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>דמי משלוח:</span>
                  <span className={currentShipping === 0 ? "text-green-600 font-bold" : ""}>
                    {shippingMethod === 'pickup' ? "איסוף עצמי (חינם)" : (isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>הנחה:</span>
                    <span>-₪{discount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                  <span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span>
                  <span className="text-4xl font-black text-blue-600 tabular-nums">₪{totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl mt-8 font-black text-2xl shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <ShieldCheck size={28} />
                בצע הזמנה
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
