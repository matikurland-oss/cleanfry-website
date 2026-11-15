import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '../useSEO';
import ShopCard from './ShopCard';
import CommunitySection from './CommunitySection';
import { CtaBanner, FaqSection, Hero, HowItWorks, Reviews, TrustStrip, WhySection, type Review } from './HomeSections';

// ביקורות יוצגו רק כשיהיו ביקורות אמיתיות (סקשן מוסתר עד אז)
const REVIEWS: Review[] = [];

export default function HomePage() {
  const purchaseBoxRef = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();

  useSEO({
    title: 'אבקה למיצוק שמן | ממצק שמן בישול מהיר - CleanFry',
    description: 'CleanFry היא אבקה למיצוק שמן צמחית ומהפכנית. ממצק שמן בישול שהופך שמן טיגון לגוש מוצק ב-20 דקות. פתרון נקי וירוק לשמירה על המטבח והניקוז. הזמינו עכשיו!',
    path: '/'
  });

  // הגעה מדף אחר לעוגן (למשל /#how): גלילה לעוגן אחרי הרינדור, אחרי ש-ScrollToTop גלל לראש הדף
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <div className="cf-focus bg-cf-cream font-display text-cf-navy">
      <Hero />
      <TrustStrip />
      <ShopCard purchaseBoxRef={purchaseBoxRef} />
      <HowItWorks />
      <WhySection />
      <Reviews reviews={REVIEWS} />
      <FaqSection />
      <CtaBanner />
      <CommunitySection />
    </div>
  );
}
