// אירועי משפך ל-GA4 (תג ה-gtag נטען ב-index.html). שמות האירועים לפי ההמלצות של GA4 לאיקומרס,
// כדי שדוחות המשפך והרכישות של GA יזהו אותם אוטומטית. track לא זורק אף פעם — חוסם פרסומות
// או gtag שלא נטען לא אמורים לשבור את האתר.
import { UNIT_PRICE_AGOROT } from '../shared/pricing';

type Gtag = (command: 'event', name: string, params?: Record<string, unknown>) => void;
declare global {
  interface Window {
    gtag?: Gtag;
  }
}

const CURRENCY = 'ILS';
const PENDING_PURCHASE_KEY = 'cleanfry_pending_purchase';

export function track(name: string, params: Record<string, unknown> = {}): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // מתעלמים — אנליטיקס אף פעם לא חוסם את הלקוח
  }
}

export function productItems(quantity: number) {
  return [{ item_id: 'cleanfry', item_name: 'CleanFry', price: UNIT_PRICE_AGOROT / 100, quantity }];
}

export function trackCartEvent(name: 'view_item' | 'add_to_cart' | 'begin_checkout', quantity: number, extra: Record<string, unknown> = {}): void {
  track(name, { currency: CURRENCY, value: (UNIT_PRICE_AGOROT / 100) * quantity, items: productItems(quantity), ...extra });
}

// הרכישה מסתיימת בעמוד אחר (/order-success, אחרי טרנזילה), ולכן שומרים את פרטי ההזמנה
// כשנוצרת, ושולחים purchase פעם אחת בלבד כשמגיעים לעמוד התודה (רענון לא ישלח שוב).
type PendingPurchase = { transactionId: string; value: number; quantity: number; coupon: string; shipping: number };

export function savePendingPurchase(purchase: PendingPurchase): void {
  try {
    sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(purchase));
  } catch {
    // sessionStorage לא זמין — פשוט לא נדווח את הרכישה
  }
}

export function trackPendingPurchase(): void {
  let purchase: PendingPurchase;
  try {
    const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_PURCHASE_KEY);
    purchase = JSON.parse(raw);
  } catch {
    return;
  }
  track('purchase', {
    transaction_id: purchase.transactionId,
    currency: CURRENCY,
    value: purchase.value,
    shipping: purchase.shipping,
    coupon: purchase.coupon || undefined,
    items: productItems(purchase.quantity)
  });
}

// קליק על וואטסאפ / טלפון / מייל מכל מקום באתר — מסלול "המרה" חלופי לרכישה באתר
function contactMethod(href: string): string | null {
  if (href.startsWith('tel:')) return 'phone';
  if (href.startsWith('mailto:')) return 'email';
  if (/^https:\/\/wa\.me\/\?text=/.test(href)) return 'whatsapp_share';
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'whatsapp';
  return null;
}

export function installContactClickTracking(): void {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!link) return;
    const method = contactMethod(link.getAttribute('href') || '');
    if (method) track('contact_click', { method, page_path: window.location.pathname });
  }, { capture: true });
}
