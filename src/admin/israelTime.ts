// המרות זמן לפי שעון ישראל (Asia/Jerusalem), ללא תלות באזור הזמן של הדפדפן של המנהל.
// במסד הנתונים הכול נשמר ב-UTC; בממשק מציגים ומזינים בשעון ישראל.

const TZ = 'Asia/Jerusalem';

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

function israelParts(date: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second)
  };
}

/** הפרש שעון ישראל מ-UTC בדקות, ברגע נתון (120 בחורף, 180 בקיץ) */
function israelOffsetMinutes(date: Date): number {
  const p = israelParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** תאריך היום בישראל, בפורמט YYYY-MM-DD */
export function israelDate(date: Date = new Date()): string {
  const p = israelParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** הוספת ימים לתאריך בפורמט YYYY-MM-DD */
export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO (UTC) → ערך לשדה datetime-local בשעון ישראל */
export function isoToIsraelLocal(iso: string | null): string {
  if (!iso) return '';
  const p = israelParts(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** ערך datetime-local בשעון ישראל → ISO (UTC). מחרוזת ריקה → null */
export function israelLocalToIso(local: string): string | null {
  if (!local) return null;
  const asUtc = new Date(`${local}:00Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  let result = new Date(asUtc.getTime() - israelOffsetMinutes(asUtc) * 60_000);
  // סביב מעבר שעון קיץ/חורף ההפרש ברגע התוצאה עשוי להיות שונה
  const corrected = israelOffsetMinutes(result);
  result = new Date(asUtc.getTime() - corrected * 60_000);
  return result.toISOString();
}

const displayFormatter = new Intl.DateTimeFormat('he-IL', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

export function formatIsraelDateTime(iso: string | null): string {
  return iso ? displayFormatter.format(new Date(iso)) : '—';
}
