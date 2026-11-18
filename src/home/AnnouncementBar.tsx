import { Fragment } from 'react';
import { FREE_SHIPPING_MIN_QUANTITY } from '../../shared/pricing';

const MESSAGES = [
  `משלוח חינם מ-${FREE_SHIPPING_MIN_QUANTITY} מארזים`,
  'איסוף עצמי ללא עלות',
  '100% רכיבים ממקור צמחי',
  'שומרים על הצנרת ועל הסביבה',
];

const Items = () => (
  <>
    {MESSAGES.map((msg) => (
      <Fragment key={msg}>
        <span className="whitespace-nowrap px-6">{msg}</span>
        <span className="text-cf-lime" aria-hidden="true">✦</span>
      </Fragment>
    ))}
  </>
);

// פס הודעות רץ. קוראי מסך מקבלים את ההודעות פעם אחת; העותקים לשם הלולאה מוסתרים מהם.
// האנימציה נעצרת כש-prefers-reduced-motion מוגדר (ר' index.css).
export default function AnnouncementBar() {
  return (
    <div className="overflow-hidden bg-cf-navy py-3 font-display text-[15px] font-medium text-cf-cream" role="region" aria-label="הודעות">
      <div className="cf-marquee-track">
        <div className="flex items-center"><Items /></div>
        <div className="flex items-center" aria-hidden="true"><Items /></div>
        <div className="flex items-center" aria-hidden="true"><Items /></div>
        <div className="flex items-center" aria-hidden="true"><Items /></div>
      </div>
    </div>
  );
}
