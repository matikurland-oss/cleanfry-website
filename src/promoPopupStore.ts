// ניהול מצב "נסגר" של פופאפ המבצע: שמירה ב-localStorage (מפתח ייחודי למבצע הזה, כדי
// שמבצע עתידי אחר לא יידחק בטעות ע"י סגירת המבצע הנוכחי), בדיוק כמו cookieConsentStore.ts.
const STORAGE_KEY = 'cleanfry_promo_shoppingil18_dismissed';
type Listener = (dismissed: boolean) => void;
const listeners = new Set<Listener>();

export function isPromoDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPromo(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // localStorage לא זמין - ממשיכים בלי לשמור, רק מעדכנים מאזינים
  }
  listeners.forEach((listener) => listener(true));
}

export function subscribePromoDismissed(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
