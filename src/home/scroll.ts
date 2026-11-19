// גלילה לעוגן בדף הבית.
// לעוגן הרכישה (#shop / #purchase) הגלילה מביאה לאזור הבחירה (#shop-card: מארזים + סיכום) ומבטיחה גישה לכפתור ההזמנה:
// - הבחירה והסיכום נכנסים במסך: ראש האזור מתחת לפסים העליונים.
// - לא נכנסים, ובמסך צר (פס רכישה קבוע בתחתית): ראש אזור הבחירה מתחת לפסים; הכפתור זמין בפס הקבוע.
// - לא נכנסים, במסך רחב: תחתית הסיכום (#shop-buy, כולל הכפתור) בתחתית המסך.
const PURCHASE_IDS = new Set(['shop', 'purchase']);
const GAP = 16;
/** חייב להתאים ל-lg:hidden של פס הרכישה ב-ShopCard (lg = 1024px) */
const STICKY_BAR_QUERY = '(max-width: 1023.98px)';

export function scrollToSection(id: string): boolean {
  if (PURCHASE_IDS.has(id)) {
    const card = document.getElementById('shop-card');
    const buy = document.getElementById('shop-buy');
    if (card && buy) {
      const topBar = document.getElementById('site-top')?.getBoundingClientRect().height ?? 0;
      const available = window.innerHeight - topBar - GAP * 2;
      const cardRect = card.getBoundingClientRect();
      const alignTop = cardRect.height <= available || window.matchMedia(STICKY_BAR_QUERY).matches;
      const top = alignTop
        ? window.scrollY + cardRect.top - topBar - GAP
        : window.scrollY + buy.getBoundingClientRect().bottom - window.innerHeight + GAP;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      return true;
    }
  }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth' });
  return true;
}
