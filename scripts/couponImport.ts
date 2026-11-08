// לוגיקת הייבוא מ-Edge Config (טהורה, נבדקת ב-tests/couponImport.test.ts).
// הפורמט הישן: { CODE: 0.18 } או { CODE: { discount: 0.18, expiresAt: "2026-11-06T23:59:59+02:00" } },
// כשההנחה היא שבר (0.18 = 18%). במסד הנתונים האחוז נשמר כאחוז רגיל (18).
import { COUPON_CODE_PATTERN, normalizeCode } from '../api/_lib/coupons.js';
import type { CouponInput } from '../api/_lib/store.js';

export interface ImportPlan {
  valid: CouponInput[];
  invalid: { code: string; reason: string }[];
}

export function planImport(raw: unknown): ImportPlan {
  const plan: ImportPlan = { valid: [], invalid: [] };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    plan.invalid.push({ code: '(root)', reason: 'הערך "coupons" ב-Edge Config אינו אובייקט' });
    return plan;
  }

  const seen = new Set<string>();
  for (const [rawCode, entry] of Object.entries(raw as Record<string, unknown>)) {
    const code = normalizeCode(rawCode);
    if (!COUPON_CODE_PATTERN.test(code)) {
      plan.invalid.push({ code: rawCode, reason: 'קוד לא תקין (2–30 תווים: A-Z, 0-9, _ או -)' });
      continue;
    }
    if (seen.has(code)) {
      plan.invalid.push({ code: rawCode, reason: `כפילות אחרי נרמול ל-${code}` });
      continue;
    }

    const fraction = typeof entry === 'number' ? entry
      : entry && typeof entry === 'object' ? (entry as { discount?: unknown }).discount
      : undefined;
    if (typeof fraction !== 'number' || !Number.isFinite(fraction) || fraction <= 0 || fraction >= 1) {
      plan.invalid.push({ code, reason: `הנחה לא תקינה (${JSON.stringify(fraction)}); מצופה שבר בין 0 ל-1, למשל 0.18` });
      continue;
    }
    const percent = Math.round(fraction * 10000) / 100;

    let expiresAt: string | null = null;
    const rawExpiry = entry && typeof entry === 'object' ? (entry as { expiresAt?: unknown }).expiresAt : undefined;
    if (rawExpiry !== undefined && rawExpiry !== null && rawExpiry !== '') {
      const date = typeof rawExpiry === 'string' ? new Date(rawExpiry) : new Date(NaN);
      if (Number.isNaN(date.getTime())) {
        plan.invalid.push({ code, reason: `תאריך תפוגה לא תקין (${JSON.stringify(rawExpiry)})` });
        continue;
      }
      expiresAt = date.toISOString();
    }

    seen.add(code);
    plan.valid.push({ code, label: 'יובא מ-Edge Config', discount_percent: percent, is_active: true, starts_at: null, expires_at: expiresAt });
  }
  return plan;
}
