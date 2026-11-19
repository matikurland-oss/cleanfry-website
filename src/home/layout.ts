// מחלקות פריסה משותפות למעטפת ולדף הבית (רוחב תוכן 1320px, מרווח צדדי לפי הבריף)
export const container = 'mx-auto w-full max-w-[1320px]';
export const gutter = 'px-[clamp(16px,4vw,56px)]';
export const sectionTitle = 'm-0 text-[clamp(34px,4.4vw,60px)] font-black leading-[1.05] tracking-[-0.02em]';
// כפתור/תגית עגולים לגמרי
export const pill = 'inline-flex items-center justify-center rounded-full transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transform-none';

// ---------- רכיבי עיצוב משותפים לדפים הפנימיים (צ׳קאאוט, בלוג, צור קשר, דפי מדיניות ותודה) ----------
/** ריווח דף פנימי */
export const pageShell = `${gutter} py-[clamp(40px,6vw,80px)]`;
/** כותרת H1 של דף פנימי */
export const pageTitle = 'm-0 text-[clamp(32px,4vw,52px)] font-black leading-[1.08] tracking-[-0.02em] text-cf-navy';
/** כרטיס לבן מעוגל */
export const card = 'rounded-[28px] border border-cf-border bg-white p-[clamp(20px,3vw,36px)]';
/** כותרת בתוך כרטיס */
export const cardTitle = 'm-0 text-[22px] font-extrabold leading-[1.3] text-cf-navy sm:text-2xl';
/** שדה טופס */
export const field = 'min-h-12 w-full rounded-2xl border-2 border-cf-border bg-cf-cream px-4 py-3 text-right text-base text-cf-navy placeholder:text-cf-muted transition-colors focus:border-cf-blue focus:outline-none disabled:opacity-50';
/** כפתור ראשי (ירוק) */
export const btnPrimary = `${pill} min-h-14 bg-cf-green px-8 text-center text-lg font-extrabold text-white no-underline hover:bg-cf-green-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`;
/** כפתור משני (כחול כהה) */
export const btnSecondary = `${pill} min-h-12 bg-cf-navy px-6 text-center font-bold text-cf-cream no-underline hover:bg-cf-body disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0`;
/** כפתור מתאר */
export const btnOutline = `${pill} min-h-12 border-2 border-cf-border bg-white px-6 text-center font-bold text-cf-navy no-underline hover:border-cf-navy/40`;
/** קישור טקסט */
export const textLink = 'font-bold text-cf-green-dark underline underline-offset-4 hover:text-cf-green';
/** תיבות הודעה לפי סוג (ניגודיות 4.5:1 ומעלה) */
export const notice = {
  info: 'rounded-[18px] bg-cf-blue-light px-[18px] py-3.5 text-[15px] leading-relaxed text-cf-navy',
  success: 'rounded-[18px] bg-cf-green-light px-[18px] py-3.5 text-[15px] font-medium leading-relaxed text-cf-green-dark',
  warning: 'rounded-[18px] bg-cf-yellow px-[18px] py-3.5 text-[15px] font-medium leading-relaxed text-cf-navy',
  error: 'rounded-[18px] border-2 border-[#F4B5AE] bg-[#FDECEA] px-[18px] py-3.5 text-[15px] font-medium leading-relaxed text-[#8A1C12]',
};
