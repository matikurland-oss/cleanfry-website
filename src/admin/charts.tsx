// גרפים פשוטים לדשבורד הניהול, בלי ספריית גרפים. סדרה אחת בכל גרף, בצבע אחד,
// עם תווית טקסט לכל ערך (המידע לא נמסר רק בצבע) ו-title לריחוף.
import React from 'react';

const BAR = 'bg-blue-500';

/** עמודות אנכיות לאורך זמן. הציר נקרא מימין לשמאל, כמו העמוד. */
export function ColumnChart({ data, format, label }: {
  data: { key: string; label: string; value: number; title: string }[];
  format: (v: number) => string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const best = data.find((d) => d.value === max && max > 0);
  // כשיש הרבה ימים מציגים רק חלק מהתוויות בציר, כדי שלא יתנגשו
  const every = Math.ceil(data.length / 10);
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-[2px] h-36 border-b border-slate-200">
        {data.map((d) => (
          <div key={d.key} className="flex-1 min-w-0 h-full flex flex-col justify-end group" title={d.title}>
            <div className={`${BAR} rounded-t-[4px] group-hover:bg-blue-700 transition-colors`}
              style={{ height: max > 0 ? `${(d.value / max) * 100}%` : 0, minHeight: d.value > 0 ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] mt-1 text-[10px] text-slate-400 tabular-nums">
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 min-w-0 text-center overflow-visible whitespace-nowrap">
            {i % every === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      {best && <figcaption className="text-xs text-slate-500 mt-2">היום החזק: {best.label} · {format(best.value)}</figcaption>}
    </figure>
  );
}

/** פסים אופקיים: התפלגות או השוואה בין כמה קטגוריות */
export function BarList({ data, label }: {
  data: { key: string; label: string; value: number; display: string }[];
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <ul aria-label={label} className="space-y-2">
      {data.map((d) => (
        <li key={d.key} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-sm" title={`${d.label}: ${d.display}`}>
          <span className="text-slate-600 truncate">{d.label}</span>
          <span className="h-3 bg-slate-100 rounded-[4px] overflow-hidden">
            <span className={`block h-full ${BAR} rounded-[4px]`} style={{ width: max > 0 ? `${(d.value / max) * 100}%` : 0 }} />
          </span>
          <span className="font-bold tabular-nums text-slate-800 whitespace-nowrap">{d.display}</span>
        </li>
      ))}
    </ul>
  );
}
