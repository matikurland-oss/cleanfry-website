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
  const isSubmittedRef = useRef(false);

  // --- States המלאים ---
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocation, setPickupLocation] = useState<'kfar-saba' | 'tel-aviv' | ''>(''); 
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState(''); 
  const [showPayment, setShowPayment] = useState(false);

  // --- הגדרות קבועות ---
  const UNIT_PRICE = 59; 
  const SHIPPING_COST = 35;
  const FREE_SHIPPING_THRESHOLD = 249;
  const FORMSPREE_URL = "https://formspree.io/f/xvzwnrla";

  // --- חישובי סכומים ---
  const subtotal = UNIT_PRICE * quantity;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const currentShipping = shippingMethod === 'pickup' ? 0 : (isFreeShipping ? 0 : SHIPPING_COST);
  const totalPrice = Math.round(subtotal + currentShipping);

  // --- מנגנון URL ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = parseInt(params.get('q') || '1');
    if (qParam >= 1 && qParam <= 10) setQuantity(qParam);
  }, [location]);

  // --- לוגיקת טרנזילה ומייל ---
  useEffect(() => {
    const sendOrderNotificationEmail = async () => {
      if (!fullName.trim() || !phone.trim()) return;
      let pickupText = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'איסוף עצמי - כפר סבא' : 'איסוף עצמי - תל אביב') : 'משלוח עד הבית';
      
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
            "שיטת קבלה": pickupText,
            "כתובת": shippingMethod === 'delivery' ? `${city}, ${address}, דירה ${apartment}` : pickupText,
            "סה\"כ שולם": `₪${totalPrice}`
          })
        });
      } catch (error) { console.error("Email failed", error); }
    };

    const handleTranzilaMessage = async (event: MessageEvent) => {
      if (!event.origin.includes('tranzila')) return;
      let data = event.data;
      if (typeof data === 'string') {
        try {
          const urlParams = new URLSearchParams(data);
          data = { Response: urlParams.get('Response'), res: urlParams.get('res') };
        } catch (e) {}
      }
      if (data && (data.Response === '000' || data.res === '000')) {
        await sendOrderNotificationEmail();
        if (window.top) window.top.location.href = `${window.location.origin}/order-success`;
      }
    };
    window.addEventListener('message', handleTranzilaMessage);
    return () => window.removeEventListener('message', handleTranzilaMessage);
  }, [fullName, phone, email, shippingMethod, pickupLocation, city, address, apartment, quantity, totalPrice]);

  useEffect(() => {
    if (showPayment && formRef.current && !isSubmittedRef.current) {
      isSubmittedRef.current = true;
      formRef.current.submit();
    }
  }, [showPayment]);

  const handleApplyCoupon = () => {
    alert('קוד הקופון שהוזן אינו תקף כרגע.');
    setCoupon('');
  };

  const handleProceedToPayment = () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) { alert('נא למלא פרטי חובה'); return; }
    if (shippingMethod === 'pickup' && !pickupLocation) { alert('נא לבחור מיקום איסוף'); return; }
    setShowPayment(true);
  };

  const tranzilaCity = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'כפר סבא' : 'תל אביב') : city;
  const tranzilaAddress = shippingMethod === 'pickup' ? (pickupLocation === 'kfar-saba' ? 'בן גוריון 7' : 'משה וילנסקי 11') : (apartment.trim() ? `${address}, דירה ${apartment}` : address);

  const jsonProductsList: any[] = [{ product_name: "מארז CleanFry", product_quantity: quantity, product_price: UNIT_PRICE / 1.18 }];
  if (currentShipping > 0) jsonProductsList.push({ product_name: "דמי משלוח", product_quantity: 1, product_price: currentShipping / 1.18 });

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
          
          {/* עמודה ימנית: טופס */}
          <div className="lg:col-span-7 space-y-6 text-right">
            
            {/* שיטת קבלה */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-slate-800">
                <Truck className="text-blue-500" size={28} /> איך תרצו לקבל את החבילה?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setShippingMethod('delivery'); setPickupLocation(''); setShowPayment(false); }} className={`p-4 rounded-2xl border-2 transition-all ${shippingMethod === 'delivery' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>משלוח עד הבית</button>
                <button onClick={() => { setShippingMethod('pickup'); setShowPayment(false); }} className={`p-4 rounded-2xl border-2 transition-all ${shippingMethod === 'pickup' ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}>איסוף עצמי</button>
              </div>
              {shippingMethod === 'pickup' && (
                <div className="mt-5 space-y-3 animate-fadeIn">
                  <button onClick={() => setPickupLocation('kfar-saba')} className={`w-full p-4 rounded-xl border ${pickupLocation === 'kfar-saba' ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>כפר סבא - בן גוריון 7</button>
                  <button onClick={() => setPickupLocation('tel-aviv')} className={`w-full p-4 rounded-xl border ${pickupLocation === 'tel-aviv' ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>תל אביב - משה וילנסקי 11</button>
                </div>
              )}
            </div>

            {/* פרטי משלוח */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black mb-6"><CheckCircle2 className="inline text-blue-500" /> פרטי משלוח</h2>
              <input type="text" placeholder="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-4 mb-4 bg-slate-50 rounded-2xl" />
              <input type="tel" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 mb-4 bg-slate-50 rounded-2xl" />
              <input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl" />
            </div>

            {/* קופון */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <input type="text" placeholder="קוד קופון" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="w-full p-4 mb-4 bg-slate-50 rounded-2xl" />
              <button onClick={handleApplyCoupon} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold">החל קופון</button>
            </div>

            <button onClick={handleProceedToPayment} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-2xl shadow-lg">לתשלום מאובטח</button>

            {/* טופס טרנזילה */}
            {showPayment && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <form ref={formRef} action="https://direct.tranzila.com/cleanfry/iframe.php" method="POST" target="tranzila-target-frame" className="hidden">
                  <input type="hidden" name="sum" value={totalPrice} />
                  <input type="hidden" name="contact" value={fullName} />
                  <input type="hidden" name="phone" value={phone} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="city" value={tranzilaCity} />
                  <input type="hidden" name="address" value={tranzilaAddress} />
                  <input type="hidden" name="company" value={fullName} />
                  <input type="hidden" name="json_purchase_data" value={JSON.stringify({ products: jsonProductsList })} />
                </form>
                <iframe name="tranzila-target-frame" id="tranzila-iframe" className="w-full h-[480px]" title="Payment" />
              </div>
            )}
          </div>

          {/* עמודה שמאלית: סיכום */}
          <div className="lg:col-span-5">
             <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-8">
               <h2 className="text-2xl font-black mb-6">סיכום הזמנה</h2>
               <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl">
                 <div>
                   <p className="font-bold text-lg">מארז CleanFry</p>
                   <p className="text-slate-500">₪{UNIT_PRICE} ליחידה</p>
                 </div>
                 <div className="flex items-center gap-4 border rounded-full p-1">
                   <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full hover:bg-slate-100"><Minus size={18} /></button>
                   <span className="font-black text-xl">{quantity}</span>
                   <button onClick={() => setQuantity(q => Math.min(10, q + 1))} className="w-10 h-10 rounded-full hover:bg-slate-100"><Plus size={18} /></button>
                 </div>
               </div>
               <div className="border-t pt-4 space-y-2">
                 <div className="flex justify-between"><span>סה"כ ביניים:</span><span className="font-black">₪{subtotal}</span></div>
                 <div className="flex justify-between"><span>משלוח:</span><span>{shippingMethod === 'pickup' ? 'חינם' : (isFreeShipping ? 'חינם' : `₪${SHIPPING_COST}`)}</span></div>
                 <div className="flex justify-between pt-4 border-t text-2xl font-black"><span>סה"כ לתשלום:</span><span>₪{totalPrice}</span></div>
               </div>
               <div className="mt-8 flex justify-center items-center gap-2 opacity-50"><ShieldCheck size={16} /> <span>SSL SECURED</span></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
