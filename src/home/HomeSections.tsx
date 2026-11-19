import { useId, useState, type MouseEvent, type ReactNode } from 'react';
import { FREE_SHIPPING_MIN_QUANTITY, LIST_PRICE_AGOROT, agorotToShekels } from '../../shared/pricing';
import {
  ClockIcon, CycleIcon, DropIcon, FlameOffIcon, GlassIcon, LeafIcon, PipeIcon, SpoonIcon, TrashIcon, TruckIcon,
} from './icons';
import { container, gutter, pill, sectionTitle } from './layout';
import { scrollToSection } from './scroll';

// גלילה חלקה לעוגן בדף (כפתורי ה-hero וה-CTA)
export const scrollToId = (id: string) => (e: MouseEvent) => {
  if (!scrollToSection(id)) return;
  e.preventDefault();
  window.history.replaceState(null, '', `/#${id}`);
};

// ---------- Hero ----------
export function Hero() {
  const price = agorotToShekels(LIST_PRICE_AGOROT);
  return (
    <section id="top" className={`${gutter} pb-[clamp(48px,6vw,88px)] pt-[clamp(32px,5vw,72px)]`}>
      <div className={`${container} flex flex-wrap items-center gap-[clamp(28px,4vw,64px)]`}>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[22px]">
          <span className="self-start rounded-full bg-cf-green-light px-4 py-2 text-sm font-bold text-cf-green-dark">
            אבקה למיצוק שמן בישול · 100% צמחי
          </span>
          {/* כותרת SEO נסתרת שהייתה בדף ונשארת */}
          <h2 className="sr-only">CleanFry - אבקה למיצוק שמן בישול, הפתרון המושלם למיצוק שמן טיגון משומש</h2>
          <h1 className="m-0 text-[clamp(48px,7vw,104px)] font-black leading-[0.95] tracking-[-0.02em] text-cf-navy">
            טיגון מושלם.
            <br />
            <span className="text-cf-green">ניקוי קל.</span>
            <span className="sr-only"> אבקה למיצוק שמן – ממצק שמן בישול</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[clamp(18px,1.6vw,22px)] leading-relaxed text-cf-body">
            הופכים שמן טיגון משומש לגוש מוצק, ופשוט זורקים לפח. בלי כיור סתום, בלי בקבוקים שומניים בארון, בלי נזילות בשקית הזבל.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/#shop" onClick={scrollToId('shop')} className={`${pill} min-h-14 bg-cf-green px-[34px] text-lg font-extrabold text-white no-underline`}>
              להזמנה – ₪{price}
            </a>
            <a href="/#how" onClick={scrollToId('how')} className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-cf-navy px-7 text-[17px] font-bold text-cf-navy no-underline transition-colors hover:bg-cf-navy hover:text-cf-cream">
              איך זה עובד?
            </a>
          </div>
        </div>

        <div className="relative min-w-0 flex-[1_1_460px]">
          <div className="aspect-[440/371] overflow-hidden rounded-[40px] bg-cf-blue-light">
            <img
              src="/hero-1280.webp"
              srcSet="/hero-640.webp 640w, /hero-960.webp 960w, /hero-1280.webp 1280w"
              sizes="(min-width: 1000px) 640px, 92vw"
              width={1280}
              height={1066}
              fetchPriority="high"
              alt="שמן בישול שהתמצק לגוש מושלך מהמחבת לפח, ולידו מארז CleanFry"
              className="block h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-[22px] right-6 flex items-center gap-3 rounded-[20px] bg-white px-5 py-3.5 shadow-[0_10px_30px_rgba(16,40,59,.12)]">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cf-yellow text-cf-navy">
              <ClockIcon size={22} />
            </span>
            <span className="flex flex-col leading-tight">
              <strong className="text-lg">כ-20 דקות</strong>
              <span className="text-sm text-cf-muted">משמן נוזלי לגוש מוצק</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- פס יתרונות ----------
export function TrustStrip() {
  const items: { icon: ReactNode; text: string }[] = [
    { icon: <LeafIcon size={22} className="text-cf-green" />, text: '100% רכיבים צמחיים' },
    { icon: <DropIcon size={22} className="text-cf-blue" />, text: 'מגן על צנרת הניקוז' },
    { icon: <CycleIcon size={22} className="text-cf-green" />, text: 'מתפרק באופן טבעי' },
    { icon: <TruckIcon size={22} className="text-cf-blue" />, text: `משלוח חינם מ-${FREE_SHIPPING_MIN_QUANTITY} מארזים` },
  ];
  return (
    <section aria-label="היתרונות בקצרה" className={`${gutter} border-y border-cf-border bg-white py-[22px]`}>
      <ul className={`${container} m-0 flex list-none flex-wrap justify-around gap-x-9 gap-y-[18px] p-0 text-[17px] font-bold`}>
        {items.map((item) => (
          <li key={item.text} className="flex items-center gap-2.5">{item.icon}{item.text}</li>
        ))}
      </ul>
    </section>
  );
}

// ---------- איך זה עובד ----------
const STEPS = [
  { title: 'מכבים את האש', desc: 'כיבוי מקור החום או הכיריים.', icon: <FlameOffIcon size={40} strokeWidth={1.8} />, bg: 'bg-cf-cream', num: 'text-cf-blue' },
  { title: 'מוסיפים ומערבבים', desc: 'הוספת אבקה כשהשמן חם וערבוב קל.', icon: <SpoonIcon size={40} strokeWidth={1.8} />, bg: 'bg-cf-green-light', num: 'text-cf-green-dark' },
  { title: 'מחכים שיתקרר', desc: 'המתנה להתמצקות (כ-20 דקות).', icon: <ClockIcon size={40} strokeWidth={1.8} />, bg: 'bg-cf-blue-light', num: 'text-cf-blue' },
  { title: 'זורקים לפח', desc: 'השלכת השמן המוצק לפח האשפה.', icon: <TrashIcon size={40} strokeWidth={1.8} />, bg: 'bg-cf-yellow', num: 'text-cf-navy' },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className={`${gutter} cf-on-navy bg-cf-navy py-[clamp(56px,7vw,104px)] text-cf-cream`}>
      <span id="how-it-works" className="block" aria-hidden="true" />
      <div className={container}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 id="how-title" className={sectionTitle}>
            ארבעה צעדים.
            <br />
            <span className="text-cf-lime">אפס בלגן.</span>
          </h2>
          <p className="m-0 max-w-[420px] text-[19px] leading-relaxed text-cf-on-navy">
            פשוט, מהיר ונקי – כך תהפכו את השמן המשומש לגוש מוצק
          </p>
        </div>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 p-0">
          {STEPS.map((step, i) => (
            <li key={step.title} className={`${step.bg} flex flex-col gap-3.5 rounded-[28px] p-7 text-cf-navy`}>
              <span className={`text-[56px] font-black leading-none ${step.num}`} aria-hidden="true">{i + 1}</span>
              {step.icon}
              <h3 className="m-0 text-2xl font-extrabold"><span className="sr-only">שלב {i + 1}: </span>{step.title}</h3>
              <p className="m-0 text-base leading-relaxed text-cf-body">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------- למה לא לשפוך לכיור ----------
const WHY = [
  { title: 'כיור שזורם', desc: 'השמן לא מגיע לצנרת בכלל, אז אין שומן שמצטבר ואין סתימות.', icon: <PipeIcon size={28} />, box: 'bg-cf-blue-light text-cf-blue' },
  { title: 'ירוק באמת', desc: 'רכיבים ממקור צמחי שהופכים את השמן לפסולת מוצקה שמתפרקת באופן טבעי.', icon: <LeafIcon size={28} />, box: 'bg-cf-green-light text-cf-green' },
  { title: 'פח בלי נזילות', desc: 'גוש מוצק במקום נוזל, כך שאין חשש שהשקית תדלוף או תסריח.', icon: <TrashIcon size={28} />, box: 'bg-cf-yellow text-cf-navy' },
  { title: 'לכל סוגי השמן', desc: 'קנולה, חמניות, תירס, זית ואפילו שומן מן החי.', icon: <GlassIcon size={28} />, box: 'bg-cf-blue-light text-cf-navy' },
];

export function WhySection() {
  return (
    <section id="why" aria-labelledby="why-title" className={`${gutter} py-[clamp(56px,7vw,104px)]`}>
      <div className={container}>
        <h2 id="why-title" className={`${sectionTitle} mb-3 text-center`}>למה לא פשוט לשפוך לכיור?</h2>
        <p className="mx-auto mb-11 mt-0 max-w-[720px] text-center text-[19px] leading-relaxed text-cf-body">
          שמן שנשפך לכיור מתקרר בצנרת, נצמד לדפנות וגורם לסתימות קשות ויקרות. משם הוא ממשיך לביוב העירוני ומזהם את הסביבה.
        </p>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5 p-0">
          {WHY.map((card) => (
            <li key={card.title} className="flex flex-col gap-3 rounded-[28px] border border-cf-border bg-white p-[30px]">
              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-[18px] ${card.box}`}>{card.icon}</span>
              <h3 className="m-0 text-[22px] font-extrabold">{card.title}</h3>
              <p className="m-0 text-base leading-relaxed text-cf-body">{card.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- ביקורות: מוכן, אבל מוסתר עד שיהיו ביקורות אמיתיות ----------
export interface Review { quote: string; name: string }
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section aria-labelledby="reviews-title" className={`${gutter} pb-[clamp(56px,7vw,104px)]`}>
      <div className={`${container} flex flex-col gap-6 rounded-[36px] bg-cf-blue-light p-[clamp(32px,5vw,64px)]`}>
        <h2 id="reviews-title" className="m-0 text-[clamp(30px,3.6vw,48px)] font-black">מה הלקוחות אומרים</h2>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4 p-0">
          {reviews.map((r) => (
            <li key={r.name + r.quote} className="rounded-[22px] bg-white p-6 text-base leading-relaxed text-cf-body">
              <blockquote className="m-0">{r.quote}</blockquote>
              <p className="mb-0 mt-3 font-bold text-cf-navy">{r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------- שאלות ותשובות (הנוסח הקיים באתר, ללא שינוי) ----------
const FAQS = [
  { q: 'איך נפטרים משמן טיגון משומש בצורה בטוחה?', a: 'הדרך הבטוחה ביותר היא להפוך את השמן למוצק באמצעות CleanFry. לאחר שהשמן מתקשה, ניתן פשוט להשליך אותו לפח האשפה הרגיל בתוך שקית, ללא חשש מנזילות או ריחות.' },
  { q: 'למה אסור לשפוך שמן לכיור?', a: 'שמן טיגון שמושלך לכיור מתקרר בצנרת, נצמד לדפנות וגורם לסתימות קשות ויקרות לתיקון. בנוסף, השמן מגיע למערכות הביוב העירוניות ומזהם את הסביבה.' },
  { q: 'האם CleanFry ידידותי לסביבה?', a: 'בהחלט. CleanFry מבוסס על רכיבים טבעיים שהופכים את השמן לפסולת מוצקה המתפרקת באופן טבעי (Biodegradable), ובכך מונעת זיהום של מקורות מים.' },
  { q: 'לאיזה סוגי שמן CleanFry מתאים?', a: 'המוצר מתאים לכל סוגי שמני המאכל: שמן קנולה, שמן חמניות, שמן תירס, שמן זית וכו׳, ואפילו לשומן מן החי.' },
  { q: 'האם האבקה למיצוק שמן בטוחה לשימוש?', a: 'בהחלט. CleanFry מבוססת על רכיבים ממקור צמחי, היא אינה רעילה ובטוחה לחלוטין לשימוש במטבח הביתי. האבקה פותחה במיוחד כדי לתת מענה אקולוגי ונקי לטיפול בשמן משומש ללא חשש. חשוב לציין שהאבקה היא לא למאכל ויש להרחיקה מילדים.' },
  { q: 'כמה אבקה צריך להוסיף כדי למצק את השמן?', a: 'המינון המומלץ הוא כף אחת של אבקת CleanFry לכל כוס שמן (כ-200-250 מ״ל). במידה והשמן מלוכלך מאוד משאריות טיגון, ניתן להוסיף מעט יותר כדי להבטיח מיצוק מלא ומהיר בתוך כ-20 דקות.' },
  { q: 'איך משליכים את השמן אחרי שהשתמשתי בממצק שמן בישול?', a: 'ברגע שהשמן התקרר והפך לגוש מוצק וקשיח, ניתן פשוט להפרד אותו מהמחבת או מהסיר בעזרת מרית ולהשליך אותו ישירות לפח האשפה הביתי. אין צורך בשקיות מיוחדות.' },
  { q: 'האם ניתן להשתמש בשמן שוב אחרי המיצוק?', a: 'לא. אבקת CleanFry נועדה למטרת פינוי והשלכה בטוחה של שמן משומש בלבד. ברגע שהשמן עבר תהליך מיצוק, הוא הופך לחומר מוצק שאינו מתאים לבישול חוזר.' },
];

// key מוצהר כאן כי לפרויקט אין @types/react ולכן JSX לא מוסיף אותו אוטומטית
function FaqItem({ q, a }: { q: string; a: string; key?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="overflow-hidden rounded-[22px] border border-cf-border bg-white">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-btn`}
          onClick={() => setOpen(!open)}
          className="flex min-h-16 w-full items-center justify-between gap-4 px-6 py-[18px] text-right text-lg font-bold text-cf-navy"
        >
          <span>{q}</span>
          <span aria-hidden="true" className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-cf-green-light text-xl font-bold text-cf-green-dark">
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} hidden={!open}>
        <p className="m-0 px-6 pb-[22px] text-base leading-[1.7] text-cf-body">{a}</p>
      </div>
    </li>
  );
}

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${gutter} pb-[clamp(56px,7vw,104px)]`}>
      <div className="mx-auto max-w-[920px]">
        <h2 id="faq-title" className={`${sectionTitle} mb-7 text-center`}>שאלות ותשובות</h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </ul>
      </div>
    </section>
  );
}

// ---------- באנר CTA ----------
export function CtaBanner() {
  return (
    <section aria-labelledby="cta-title" className={`${gutter} pb-[clamp(56px,7vw,104px)]`}>
      <div className={`${container} flex flex-wrap items-center justify-between gap-7 rounded-[40px] bg-cf-green px-[clamp(24px,5vw,72px)] py-[clamp(40px,6vw,80px)] text-white`}>
        <div className="min-w-0 flex-[1_1_420px]">
          <h2 id="cta-title" className={`${sectionTitle} mb-2.5`}>מוכנים לשדרג את המטבח?</h2>
          <p className="m-0 text-[19px] leading-relaxed text-white">שומרים על המטבח נקי ועל הסביבה ירוקה.</p>
        </div>
        <a href="/#shop" onClick={scrollToId('shop')} className={`${pill} min-h-[60px] bg-cf-cream px-10 text-[19px] font-extrabold text-cf-navy no-underline`}>
          הזמנה עכשיו
        </a>
      </div>
    </section>
  );
}
