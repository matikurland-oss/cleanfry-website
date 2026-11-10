// ניהול הסכמת עוגיות: שמירה ב-localStorage, התראה למאזינים (Navbar וכו') כשההסכמה משתנה,
// וטעינה מותנית-הסכמה של סקריפט המעקב של MailerLite (שעד כה נטען תמיד ב-index.html, ללא הסכמה).
export type CookieConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'cleanfry_cookie_consent';
type Listener = (choice: CookieConsentChoice | null) => void;
const listeners = new Set<Listener>();

export function getCookieConsent(): CookieConsentChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: CookieConsentChoice | null): void {
  try {
    if (choice === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, choice);
    }
  } catch {
    // localStorage לא זמין (למשל מצב גלישה פרטית חסום) - ממשיכים בלי לשמור, רק מעדכנים מאזינים
  }
  listeners.forEach((listener) => listener(choice));
}

export function subscribeCookieConsent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type MlFn = { (...args: unknown[]): void; q?: unknown[][] };
declare global {
  interface Window {
    ml?: MlFn;
  }
}

let mailerLiteLoaded = false;

export function loadMailerLiteTracking(): void {
  if (mailerLiteLoaded || document.getElementById('mailerlite-tracking')) return;
  mailerLiteLoaded = true;

  if (!window.ml) {
    const ml: MlFn = (...args: unknown[]) => {
      ml.q = ml.q || [];
      ml.q.push(args);
    };
    window.ml = ml;
  }
  const script = document.createElement('script');
  script.id = 'mailerlite-tracking';
  script.async = true;
  script.src = 'https://assets.mailerlite.com/js/universal.js';
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
  window.ml('account', '2287697');
}

// Microsoft Clarity — הקלטות סשן ומפות חום, לזיהוי איפה ולמה גולשים נוטשים. נטען רק אחרי הסכמה,
// ורק אם הוגדר VITE_CLARITY_PROJECT_ID (בלי מזהה — לא נטען כלום).
type ClarityFn = { (...args: unknown[]): void; q?: unknown[][] };
declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

let clarityLoaded = false;

export function loadClarityTracking(): void {
  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined;
  if (!projectId || clarityLoaded || document.getElementById('clarity-tracking')) return;
  clarityLoaded = true;

  if (!window.clarity) {
    const clarity: ClarityFn = (...args: unknown[]) => {
      clarity.q = clarity.q || [];
      clarity.q.push(args);
    };
    window.clarity = clarity;
  }
  const script = document.createElement('script');
  script.id = 'clarity-tracking';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);
}
