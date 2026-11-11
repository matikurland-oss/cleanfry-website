// אימות קלט לפעולות ניהול הקופונים ולבחירת תקופה בדוחות.
import { COUPON_CODE_PATTERN, MAX_COUPON_DISCOUNT_PERCENT, normalizeCode } from './coupons.js';
import type { CouponInput, CouponPatch } from './store.js';

const DISCOUNT_ERROR = `אחוז הנחה חייב להיות בין 0.01 ל-${MAX_COUPON_DISCOUNT_PERCENT}`;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function parseDiscount(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > MAX_COUPON_DISCOUNT_PERCENT) return null;
  if (Math.round(n * 100) !== n * 100) return null; // עד שתי ספרות אחרי הנקודה
  return n;
}

function parseDate(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === '' || value === undefined) return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? { ok: false } : { ok: true, value: date.toISOString() };
}

function checkDateOrder(startsAt: string | null | undefined, expiresAt: string | null | undefined): boolean {
  return !startsAt || !expiresAt || new Date(startsAt) < new Date(expiresAt);
}

export function validateCouponCreate(body: Record<string, unknown>): Result<CouponInput> {
  const code = normalizeCode(body.code);
  if (!COUPON_CODE_PATTERN.test(code)) return { ok: false, error: 'קוד קופון: 2–30 תווים, אותיות באנגלית, ספרות, מקף או קו תחתון' };
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (label.length > 100) return { ok: false, error: 'שם פנימי ארוך מדי' };
  const discount = parseDiscount(body.discount_percent);
  if (discount === null) return { ok: false, error: DISCOUNT_ERROR };
  const startsAt = parseDate(body.starts_at);
  const expiresAt = parseDate(body.expires_at);
  if (!startsAt.ok || !expiresAt.ok) return { ok: false, error: 'תאריך לא תקין' };
  if (!checkDateOrder(startsAt.value, expiresAt.value)) return { ok: false, error: 'תאריך התפוגה חייב להיות אחרי תאריך ההתחלה' };
  return {
    ok: true,
    value: {
      code,
      label,
      discount_percent: discount,
      is_active: body.is_active === undefined ? true : body.is_active === true,
      starts_at: startsAt.value,
      expires_at: expiresAt.value
    }
  };
}

export function validateCouponPatch(
  body: Record<string, unknown>,
  current: { starts_at: string | null; expires_at: string | null }
): Result<CouponPatch> {
  if ('code' in body) return { ok: false, error: 'לא ניתן לשנות קוד קופון. ליצירת קוד אחר צרו קופון חדש.' };
  const patch: CouponPatch = {};
  if ('label' in body) {
    if (typeof body.label !== 'string' || body.label.trim().length > 100) return { ok: false, error: 'שם פנימי לא תקין' };
    patch.label = body.label.trim();
  }
  if ('discount_percent' in body) {
    const discount = parseDiscount(body.discount_percent);
    if (discount === null) return { ok: false, error: DISCOUNT_ERROR };
    patch.discount_percent = discount;
  }
  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') return { ok: false, error: 'מצב לא תקין' };
    patch.is_active = body.is_active;
  }
  for (const key of ['starts_at', 'expires_at'] as const) {
    if (key in body) {
      const parsed = parseDate(body[key]);
      if (!parsed.ok) return { ok: false, error: 'תאריך לא תקין' };
      patch[key] = parsed.value;
    }
  }
  const startsAt = 'starts_at' in patch ? patch.starts_at : current.starts_at;
  const expiresAt = 'expires_at' in patch ? patch.expires_at : current.expires_at;
  if (!checkDateOrder(startsAt, expiresAt)) return { ok: false, error: 'תאריך התפוגה חייב להיות אחרי תאריך ההתחלה' };
  if (Object.keys(patch).length === 0) return { ok: false, error: 'אין שינויים' };
  return { ok: true, value: patch };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** טווח תאריכים בלוח השנה הישראלי (כולל שני הקצוות), עד שנתיים */
export function validatePeriod(from: string, to: string): Result<{ from: string; to: string }> {
  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) return { ok: false, error: 'טווח תאריכים לא תקין' };
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return { ok: false, error: 'טווח תאריכים לא תקין' };
  if (fromDate.toISOString().slice(0, 10) !== from || toDate.toISOString().slice(0, 10) !== to) return { ok: false, error: 'טווח תאריכים לא תקין' };
  if (fromDate > toDate) return { ok: false, error: 'תאריך ההתחלה אחרי תאריך הסיום' };
  if (toDate.getTime() - fromDate.getTime() > 731 * 86_400_000) return { ok: false, error: 'טווח ארוך מדי (עד שנתיים)' };
  return { ok: true, value: { from, to } };
}

// ---------------------------------------------------------------------------
// משפיעניות
// ---------------------------------------------------------------------------
export const MAX_PARTNER_COMMISSION_PERCENT = 50;
export const PARTNER_USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const COMMISSION_ERROR = `אחוז עמלה חייב להיות בין 0 ל-${MAX_PARTNER_COMMISSION_PERCENT}`;
const PASSWORD_ERROR = 'סיסמה: 12 עד 72 תווים, עם אות קטנה, אות גדולה וספרה באנגלית';

function parseCommission(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > MAX_PARTNER_COMMISSION_PERCENT) return null;
  if (Math.round(n * 100) !== n * 100) return null;
  return n;
}

// תואם להגדרת חוזק הסיסמה המומלצת ב-Supabase Auth (12 תווים, קטנה + גדולה + ספרה)
export const validPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 12 && value.length <= 72 &&
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);

function parseDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 60 ? name : null;
}

function parseCouponIds(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) return null;
  if (!value.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) return null;
  return [...new Set(value as string[])];
}

export interface PartnerCreateInput {
  username: string;
  password: string;
  display_name: string;
  commission_percent: number;
  coupon_ids: string[];
}

export function validatePartnerCreate(body: Record<string, unknown>): Result<PartnerCreateInput> {
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!PARTNER_USERNAME_PATTERN.test(username)) {
    return { ok: false, error: 'שם משתמש: 3–30 תווים, אותיות קטנות באנגלית, ספרות, מקף או קו תחתון' };
  }
  if (!validPassword(body.password)) return { ok: false, error: PASSWORD_ERROR };
  const displayName = parseDisplayName(body.display_name);
  if (displayName === null) return { ok: false, error: 'שם המשפיענית: 1–60 תווים' };
  const commission = parseCommission(body.commission_percent);
  if (commission === null) return { ok: false, error: COMMISSION_ERROR };
  const couponIds = parseCouponIds(body.coupon_ids);
  if (couponIds === null) return { ok: false, error: 'רשימת קופונים לא תקינה' };
  return {
    ok: true,
    value: { username, password: body.password, display_name: displayName, commission_percent: commission, coupon_ids: couponIds }
  };
}

export interface PartnerPatchInput {
  display_name?: string;
  commission_percent?: number;
  is_active?: boolean;
  password?: string;
  /** הרשימה המלאה של הקופונים שלה: קופונים שלא ברשימה יוצאים ממנה */
  coupon_ids?: string[];
}

export function validatePartnerPatch(body: Record<string, unknown>): Result<PartnerPatchInput> {
  if ('username' in body) return { ok: false, error: 'לא ניתן לשנות שם משתמש' };
  const patch: PartnerPatchInput = {};
  if ('display_name' in body) {
    const name = parseDisplayName(body.display_name);
    if (name === null) return { ok: false, error: 'שם המשפיענית: 1–60 תווים' };
    patch.display_name = name;
  }
  if ('commission_percent' in body) {
    const commission = parseCommission(body.commission_percent);
    if (commission === null) return { ok: false, error: COMMISSION_ERROR };
    patch.commission_percent = commission;
  }
  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') return { ok: false, error: 'מצב לא תקין' };
    patch.is_active = body.is_active;
  }
  if ('password' in body) {
    if (!validPassword(body.password)) return { ok: false, error: PASSWORD_ERROR };
    patch.password = body.password;
  }
  if ('coupon_ids' in body) {
    const ids = parseCouponIds(body.coupon_ids);
    if (ids === null) return { ok: false, error: 'רשימת קופונים לא תקינה' };
    patch.coupon_ids = ids;
  }
  if (Object.keys(patch).length === 0) return { ok: false, error: 'אין שינויים' };
  return { ok: true, value: patch };
}
