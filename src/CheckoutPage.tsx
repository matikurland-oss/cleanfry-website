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
  CheckCircle2
} from 'lucide-react';

const CheckoutPage = () => {
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // הגדרות מחיר לפי הלוגיקה שלך
  const UNIT_PRICE = 59;
  const SHIPPING_COST = 30;
  const FREE_SHIPPING_THRESHOLD = 249;

  // זיהוי כמות ראשונית מה-URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
  }, [location]);

  // חישובים
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const currentShipping = isFreeShipping ? 0 : SHIPPING_COST;
  
  const handleApplyCoupon = () => {
    const code = coupon.toUpperCase().trim();
    if (code === 'CLEAN10') {
      setDiscount(subtotal * 0.1);
      setIsCouponApplied(true);
    } else {
      alert('קוד קופון לא תקין');
      setDiscount(0);
      setIsCouponApplied(false);
    }
  };

  const totalPrice = subtotal - discount + currentShipping;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b py-4 px-6 mb-8 flex justify-between items-center max-w-6xl mx-auto rounded-b-2xl shadow-sm">
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-1 hover:opacity-80">
          <ChevronRight size={18} /> חזרה לחנות
        </Link>
        <span className="font-black text-xl text-slate-800">Checkout</span>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* טופס פרטי משלוח */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Truck className="text-blue-500" /> לאן לשלוח?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="שם מלא" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <input type="tel" placeholder="טלפון" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <input type="email" placeholder="אימייל" className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <input type="text" placeholder="עיר" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                <input type="text" placeholder="כתובת ומספר בית" className="p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" /> תשלום מאובטח
              </h2>
              <p className="text-slate-500 text-sm">הסליקה תתבצע בדף מאובטח לאחר לחיצה על כפתור ההזמנה.</p>
            </div>
          </div>

          {/* סיכום הזמנה */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-8">
              <h2 className="text-2xl font-black mb-6 border-b pb-4">סיכום הזמנה</h2>
              
              {/* בורר כמות */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="font-bold text-lg text-slate-800">מארז CleanFry</p>
                  <p className="text-sm text-slate-500">₪{UNIT_PRICE} ליחידה</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-100 rounded-full p-1 border">
                  <button onClick={() => quantity > 1 && setQuantity(q => q - 1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-red-50 transition"><Minus size={18} /></button>
                  <span className="font-black text-xl w-6 text-center">{quantity}</span>
                  <button onClick={() => quantity < 10 && setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center hover:bg-blue-700 transition"><Plus size={18} /></button>
                </div>
              </div>

              {/* מד התקדמות למשלוח חינם */}
              {!isFreeShipping && (
                <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-orange-700 text-sm">
                  <p className="font-bold">חסרים לך ₪{FREE_SHIPPING_THRESHOLD - subtotal} למשלוח חינם!</p>
                  <div className="w-full bg-orange-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${(subtotal / FREE_SHIPPING_THRESHOLD) * 100}%` }}></div>
                  </div>
                </div>
              )}
              {isFreeShipping && (
                <div className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-100 text-green-700 text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span className="font-bold">מזל טוב! קיבלת משלוח חינם!</span>
                </div>
              )}

              {/* קופון */}
              <div className="flex gap-2 mb-8">
                <input 
                  type="text" 
                  placeholder="קוד קופון" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
                <button onClick={handleApplyCoupon} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition">החל</button>
              </div>

              {/* פירוט כספי */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>סיכום ביניים ({quantity} יח'):</span>
                  <span>₪{subtotal}</span>
                </div>
                
                <div className="flex justify-between text-slate-500">
                  <span>דמי משלוח:</span>
                  <span className={isFreeShipping ? "text-green-600 font-bold" : ""}>
                    {isFreeShipping ? "חינם" : `₪${SHIPPING_COST}`}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>הנחה:</span>
                    <span>-₪{discount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-6">
                  <span className="text-xl font-black text-slate-800">סה"כ לתשלום:</span>
                  <span className="text-4xl font-black text-blue-600">₪{totalPrice.toFixed(0)}</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-5 rounded-2xl mt-8 font-black text-2xl shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                <ShieldCheck size={28} />
                תשלום בטוח
              </button>
              
              <div className="mt-6 flex justify-center gap-2 opacity-30 grayscale text-[10px] font-bold">
                <span className="border px-2 py-1 rounded">SSL SECURED</span>
                <span className="border px-2 py-1 rounded">PCI COMPLIANT</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
