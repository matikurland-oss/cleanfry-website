import React from 'react';

export type AdminTab = 'dashboard' | 'coupons' | 'influencers';

export const TAB_PATHS: Record<AdminTab, string> = {
  dashboard: '/admin',
  coupons: '/admin/coupons',
  influencers: '/admin/influencers'
};

/** הטאב לפי הכתובת. כל כתובת אחרת תחת /admin מובילה לדשבורד. */
export function tabFromPath(pathname: string): AdminTab {
  const path = pathname.replace(/\/+$/, '');
  if (path === TAB_PATHS.coupons) return 'coupons';
  if (path === TAB_PATHS.influencers) return 'influencers';
  return 'dashboard';
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: 'דשבורד' },
  { id: 'coupons', label: 'קופונים' },
  { id: 'influencers', label: 'משפיעניות' }
];

export default function AdminTabs({ active, attentionCount, onSelect }: {
  active: AdminTab;
  /** מספר הכרטיסים ב"דורש תשומת לב" */
  attentionCount: number;
  onSelect: (tab: AdminTab) => void;
}) {
  return (
    <nav className="-mx-4 px-4 overflow-x-auto">
      <div role="tablist" aria-label="אזורי הניהול" className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 w-max min-w-full">
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <a key={t.id} role="tab" aria-selected={selected} href={TAB_PATHS[t.id]}
              onClick={(e) => {
                // קליק רגיל עובר טאב בלי טעינה מחדש; קליק עם Ctrl/אמצעי פותח לשונית חדשה כרגיל
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                onSelect(t.id);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition ${
                selected ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {t.label}
              {t.id === 'dashboard' && attentionCount > 0 && (
                <span aria-label={`${attentionCount} הזמנות דורשות תשומת לב`}
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-black tabular-nums flex items-center justify-center ${
                    selected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'}`}>
                  {attentionCount}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
