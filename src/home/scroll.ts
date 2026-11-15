// גלילה לעוגן בדף הבית.
// לעוגן הרכישה (#shop / #purchase) הגלילה מבטיחה שאזור הרכישה, כולל כפתור ההזמנה, יהיה גלוי במלואו.
const PURCHASE_IDS = new Set(['shop', 'purchase']);
const GAP = 16;

export function scrollToSection(id: string): boolean {
  if (PURCHASE_IDS.has(id)) {
    const card = document.getElementById('shop-card');
    const buy = document.getElementById('shop-buy');
    if (card && buy) {
      const topBar = document.getElementById('site-top')?.getBoundingClientRect().height ?? 0;
      const available = window.innerHeight - topBar - GAP * 2;
      const cardRect = card.getBoundingClientRect();
      const top = cardRect.height <= available
        // הכרטיס כולו נכנס במסך: ראש הכרטיס מתחת לפס העליון
        ? window.scrollY + cardRect.top - topBar - GAP
        // הכרטיס גבוה מהמסך: תחתית אזור הרכישה (כולל הכפתור) בתחתית המסך
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
