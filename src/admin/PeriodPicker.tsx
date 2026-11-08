import React from 'react';
import { addDays, israelDate } from './israelTime';

export type PeriodPreset = 'today' | '7days' | 'month' | 'custom';

export interface Period {
  preset: PeriodPreset;
  from: string;
  to: string;
}

export function presetPeriod(preset: Exclude<PeriodPreset, 'custom'>): Period {
  const today = israelDate();
  if (preset === 'today') return { preset, from: today, to: today };
  if (preset === '7days') return { preset, from: addDays(today, -6), to: today };
  return { preset, from: `${today.slice(0, 8)}01`, to: today };
}

const PRESETS: { id: Exclude<PeriodPreset, 'custom'>; label: string }[] = [
  { id: 'today', label: 'היום' },
  { id: '7days', label: '7 ימים אחרונים' },
  { id: 'month', label: 'החודש' }
];

export default function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const chip = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition ${active ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button key={p.id} type="button" className={chip(value.preset === p.id)} onClick={() => onChange(presetPeriod(p.id))}>
          {p.label}
        </button>
      ))}
      <button type="button" className={chip(value.preset === 'custom')} onClick={() => onChange({ ...value, preset: 'custom' })}>
        טווח מותאם
      </button>
      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            מ-
            <input type="date" value={value.from} max={value.to} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
              className="p-2 rounded-lg border border-slate-200 bg-white" />
          </label>
          <label className="flex items-center gap-1">
            עד
            <input type="date" value={value.to} min={value.from} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
              className="p-2 rounded-lg border border-slate-200 bg-white" />
          </label>
        </div>
      )}
    </div>
  );
}
