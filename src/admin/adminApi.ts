// לקוח ה-API של אזור הניהול. מפתח ה-anon של Supabase משמש כאן רק להתחברות (Supabase Auth);
// כל הנתונים מגיעים מ-/api/admin/*, שבודק הרשאת מנהל בכל בקשה. RLS חוסם גישה ישירה לטבלאות.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export type CouponState = 'active' | 'paused' | 'not_started' | 'expired';

export interface AdminCoupon {
  id: string;
  code: string;
  label: string;
  discount_percent: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  state: CouponState;
  paid_orders: number;
  gross_collected_agorot: number;
  partner_id?: string | null;
}

export interface AdminPartner {
  id: string;
  username: string;
  display_name: string;
  commission_percent: number;
  is_active: boolean;
  created_at: string;
  coupons: { id: string; code: string; discount_percent: number; state: CouponState }[];
  totals: { orders_count: number; units: number; sales_agorot: number; commission_agorot: number };
}

export interface ReportRow {
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_label: string | null;
  paid_orders: number;
  units_sold: number;
  product_sales_agorot: number;
  discounts_agorot: number;
  gross_collected_agorot: number;
  refunds_agorot: number | null;
  net_collected_agorot: number | null;
}

export interface ReportResponse {
  from: string;
  to: string;
  refundsAvailable: boolean;
  rows: ReportRow[];
}

export interface AttentionOrder {
  id: string;
  public_ref: string;
  payment_status: 'pending' | 'awaiting_verification' | 'paid' | 'amount_mismatch';
  created_at: string;
  paid_at: string | null;
  paid_after_expiry: boolean;
  duplicate_payment: boolean;
  email_sent: boolean;
  email_attempts: number;
  total_agorot: number;
  coupon_code: string | null;
  customer_name: string;
  customer_phone: string;
  details: string;
}

export interface AdminOrder {
  id: string;
  public_ref: string;
  payment_status: 'paid' | 'awaiting_verification';
  manually_confirmed: boolean;
  created_at: string;
  paid_at: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_method: 'delivery' | 'pickup';
  pickup_location: 'kfar-saba' | 'tel-aviv' | null;
  shipping_city: string;
  quantity: number;
  products_agorot: number;
  discount_agorot: number;
  shipping_agorot: number;
  total_agorot: number;
  coupon_code: string | null;
}

export interface OrdersResponse {
  orders: AdminOrder[];
  totals: {
    orders: number;
    delivery_orders: number;
    pickup_orders: number;
    quantity: number;
    products_agorot: number;
    shipping_agorot: number;
    total_agorot: number;
  };
  pending: { orders: number; total_agorot: number };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = (await supabase?.auth.getSession())?.data.session;
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers
    },
    cache: 'no-store'
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, body.error || 'שגיאה בתקשורת עם השרת');
  return body as T;
}

const periodQuery = (from: string, to: string) => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

export const adminApi = {
  listCoupons: (from: string, to: string) =>
    request<{ coupons: AdminCoupon[] }>(`/api/admin/coupons?${periodQuery(from, to)}`).then((r) => r.coupons),
  createCoupon: (input: Record<string, unknown>) =>
    request<{ coupon: AdminCoupon }>('/api/admin/coupons', { method: 'POST', body: JSON.stringify(input) }),
  updateCoupon: (id: string, patch: Record<string, unknown>) =>
    request<{ coupon: AdminCoupon }>(`/api/admin/coupons?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  report: (from: string, to: string) => request<ReportResponse>(`/api/admin/report?${periodQuery(from, to)}`),
  attention: () => request<{ verificationConfigured: boolean; orders: AttentionOrder[] }>('/api/admin/payments'),
  resendEmail: (orderId: string) =>
    request<{ ok: true }>('/api/admin/payments', { method: 'POST', body: JSON.stringify({ orderId, action: 'resend_email' }) }),
  confirmPayment: (orderId: string) =>
    request<{ ok: true }>('/api/admin/payments', { method: 'POST', body: JSON.stringify({ orderId, action: 'confirm_payment' }) }),
  orders: (from: string, to: string) => request<OrdersResponse>(`/api/admin/orders?${periodQuery(from, to)}`),
  listPartners: () => request<{ partners: AdminPartner[] }>('/api/admin/partners').then((r) => r.partners),
  createPartner: (input: Record<string, unknown>) =>
    request<{ partner: AdminPartner }>('/api/admin/partners', { method: 'POST', body: JSON.stringify(input) }),
  updatePartner: (id: string, patch: Record<string, unknown>) =>
    request<{ partner: AdminPartner }>(`/api/admin/partners?id=${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) })
};

export async function partnerRequest<T>(path: string): Promise<T> {
  return request<T>(path);
}

/** שאלת וידוא לפני אישור ידני של מכירה */
export const confirmSaleQuestion = (ref: string, totalAgorot: number) =>
  `לאשר את הזמנה ${ref}?\n\nוידאת בממשק של טרנזילה שעסקה של ${formatShekels(totalAgorot)} עברה בהצלחה?\n` +
  'ההזמנה תיספר בדוחות. לא יישלח מייל ללקוח.';

export const formatShekels = (agorot: number | null) =>
  agorot === null ? 'לא זמין' : `₪${(agorot / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
