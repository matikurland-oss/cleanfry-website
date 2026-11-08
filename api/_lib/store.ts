// שכבת הנתונים: ממשק אחד + מימוש מול Supabase. הבדיקות מחליפות אותו במימוש בזיכרון (tests/memoryStore.ts).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CouponRow } from './coupons';
import type { InvoiceLine } from '../../shared/pricing';

export interface NewOrder {
  quantity: number;
  delivery_method: 'delivery' | 'pickup';
  pickup_location: 'kfar-saba' | 'tel-aviv' | null;
  unit_price_agorot: number;
  subtotal_agorot: number;
  discount_agorot: number;
  shipping_agorot: number;
  total_agorot: number;
  currency: string;
  coupon_id: string | null;
  coupon_code_snapshot: string | null;
  discount_percent_snapshot: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_business_id: string;
  shipping_city: string;
  shipping_address: string;
  shipping_apartment: string;
  shipping_zip: string;
  invoice_lines: InvoiceLine[];
  price_locked_until: string;
}

export type PaymentStatus = 'pending' | 'awaiting_verification' | 'paid' | 'amount_mismatch';

export interface OrderRow extends NewOrder {
  id: string;
  public_ref: string;
  payment_status: PaymentStatus;
  fulfillment_status: 'new' | 'fulfilled' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  paid_after_expiry: boolean;
  duplicate_payment: boolean;
  confirmation_email_sent_at: string | null;
  confirmation_email_attempts: number;
  confirmation_email_last_error: string | null;
}

export interface PaymentEventInput {
  provider_txn_index: string | null;
  order_id: string | null;
  response_code: string | null;
  sum_raw: string | null;
  currency_raw: string | null;
  confirmation_code: string | null;
  payload: Record<string, string>;
}

export interface PaymentEventRow extends PaymentEventInput {
  id: string;
  received_at: string;
  attempts: number;
  processed_at: string | null;
  outcome: string | null;
  processing_error: string | null;
}

export type EventOutcome =
  | 'recorded'
  | 'duplicate'
  | 'declined'
  | 'unverified'
  | 'verification_failed'
  | 'invalid_reference'
  | 'amount_mismatch';

export interface RecordPaymentResult {
  payment_recorded: boolean;
  order_newly_paid: boolean;
  order_payment_status: PaymentStatus;
}

export interface CouponInput {
  code: string;
  label: string;
  discount_percent: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

export type CouponPatch = Partial<Omit<CouponInput, 'code'>>;

export interface Actor {
  /** null בפעולות מערכת (ייבוא) */
  id: string | null;
  email: string;
}

export interface CouponReportRow {
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_label: string | null;
  paid_orders: number;
  units_sold: number;
  product_sales_agorot: number;
  discounts_agorot: number;
  gross_collected_agorot: number;
  refunds_agorot: number;
}

export interface Store {
  hitRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean>;

  getCouponByCode(code: string): Promise<CouponRow | null>;
  getCoupon(id: string): Promise<CouponRow | null>;
  listCoupons(): Promise<CouponRow[]>;
  createCoupon(input: CouponInput, actor: Actor, action?: 'create' | 'import'): Promise<CouponRow>;
  updateCoupon(id: string, patch: CouponPatch, actor: Actor): Promise<CouponRow>;

  createOrder(order: NewOrder): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  markAwaitingVerification(orderId: string): Promise<void>;
  recordPayment(orderId: string, txnIndex: string, amountAgorot: number, currency: string): Promise<RecordPaymentResult>;
  recordEmailAttempt(orderId: string, error: string | null): Promise<void>;
  listOrdersNeedingEmail(maxAttempts: number): Promise<OrderRow[]>;
  listAttentionOrders(): Promise<OrderRow[]>;

  insertPaymentEvent(event: PaymentEventInput): Promise<string>;
  finishPaymentEvent(id: string, outcome: EventOutcome, error: string | null, orderId: string | null): Promise<void>;
  failPaymentEvent(id: string, error: string): Promise<void>;
  listEventsToReprocess(limit: number, maxAttempts: number): Promise<PaymentEventRow[]>;

  couponReport(from: string, to: string): Promise<CouponReportRow[]>;
  isAdmin(userId: string): Promise<boolean>;
}

let serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Server misconfigured: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
    serviceClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return serviceClient;
}

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

const toCoupon = (row: CouponRow): CouponRow => ({ ...row, discount_percent: Number(row.discount_percent) });
const toOrder = (row: OrderRow): OrderRow => ({
  ...row,
  discount_percent_snapshot: row.discount_percent_snapshot === null ? null : Number(row.discount_percent_snapshot)
});

export function createSupabaseStore(db: SupabaseClient = getServiceClient()): Store {
  return {
    async hitRateLimit(key, max, windowSeconds) {
      return check(await db.rpc('hit_rate_limit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })) as boolean;
    },

    async getCouponByCode(code) {
      const row = check(await db.from('coupons').select('*').eq('code', code).maybeSingle());
      return row ? toCoupon(row as CouponRow) : null;
    },
    async getCoupon(id) {
      const row = check(await db.from('coupons').select('*').eq('id', id).maybeSingle());
      return row ? toCoupon(row as CouponRow) : null;
    },
    async listCoupons() {
      const rows = check(await db.from('coupons').select('*').order('created_at', { ascending: false }));
      return (rows as CouponRow[]).map(toCoupon);
    },
    async createCoupon(input, actor, action = 'create') {
      const rows = check(await db.rpc('admin_create_coupon', {
        p_code: input.code,
        p_label: input.label,
        p_discount_percent: input.discount_percent,
        p_is_active: input.is_active,
        p_starts_at: input.starts_at,
        p_expires_at: input.expires_at,
        p_actor_id: actor.id,
        p_actor_email: actor.email,
        p_action: action
      }));
      return toCoupon((rows as CouponRow[])[0]);
    },
    async updateCoupon(id, patch, actor) {
      const rows = check(await db.rpc('admin_update_coupon', {
        p_id: id, p_patch: patch, p_actor_id: actor.id, p_actor_email: actor.email
      }));
      return toCoupon((rows as CouponRow[])[0]);
    },

    async createOrder(order) {
      return toOrder(check(await db.from('orders').insert(order).select('*').single()) as OrderRow);
    },
    async getOrder(id) {
      const row = check(await db.from('orders').select('*').eq('id', id).maybeSingle());
      return row ? toOrder(row as OrderRow) : null;
    },
    async markAwaitingVerification(orderId) {
      check(await db.from('orders').update({ payment_status: 'awaiting_verification' })
        .eq('id', orderId).eq('payment_status', 'pending'));
    },
    async recordPayment(orderId, txnIndex, amountAgorot, currency) {
      const rows = check(await db.rpc('record_payment', {
        p_order_id: orderId, p_provider: 'tranzila', p_txn_index: txnIndex,
        p_amount_agorot: amountAgorot, p_currency: currency
      }));
      return (rows as RecordPaymentResult[])[0];
    },
    async recordEmailAttempt(orderId, error) {
      const order = check(await db.from('orders').select('confirmation_email_attempts').eq('id', orderId).single()) as
        { confirmation_email_attempts: number };
      check(await db.from('orders').update({
        confirmation_email_attempts: order.confirmation_email_attempts + 1,
        confirmation_email_last_error: error,
        ...(error ? {} : { confirmation_email_sent_at: new Date().toISOString() })
      }).eq('id', orderId));
    },
    async listOrdersNeedingEmail(maxAttempts) {
      const rows = check(await db.from('orders').select('*')
        .eq('payment_status', 'paid').is('confirmation_email_sent_at', null)
        .lt('confirmation_email_attempts', maxAttempts).limit(50));
      return (rows as OrderRow[]).map(toOrder);
    },
    async listAttentionOrders() {
      const rows = check(await db.from('orders').select('*')
        .or([
          'payment_status.eq.awaiting_verification',
          'payment_status.eq.amount_mismatch',
          'paid_after_expiry.eq.true',
          'duplicate_payment.eq.true',
          'and(payment_status.eq.paid,confirmation_email_sent_at.is.null)'
        ].join(','))
        .order('created_at', { ascending: false }).limit(200));
      return (rows as OrderRow[]).map(toOrder);
    },

    async insertPaymentEvent(event) {
      const row = check(await db.from('payment_events').insert(event).select('id').single()) as { id: string };
      return row.id;
    },
    async finishPaymentEvent(id, outcome, error, orderId) {
      const current = check(await db.from('payment_events').select('attempts').eq('id', id).single()) as { attempts: number };
      check(await db.from('payment_events').update({
        outcome, processing_error: error, order_id: orderId,
        processed_at: new Date().toISOString(), attempts: current.attempts + 1
      }).eq('id', id));
    },
    async failPaymentEvent(id, error) {
      const current = check(await db.from('payment_events').select('attempts').eq('id', id).single()) as { attempts: number };
      check(await db.from('payment_events').update({ processing_error: error, attempts: current.attempts + 1 }).eq('id', id));
    },
    async listEventsToReprocess(limit, maxAttempts) {
      const rows = check(await db.from('payment_events').select('*')
        .or('processed_at.is.null,outcome.eq.unverified,outcome.eq.verification_failed')
        .lt('attempts', maxAttempts)
        .order('received_at', { ascending: true }).limit(limit));
      return rows as PaymentEventRow[];
    },

    async couponReport(from, to) {
      const rows = check(await db.rpc('coupon_report', { p_from: from, p_to: to })) as CouponReportRow[];
      return rows.map((r) => ({
        ...r,
        paid_orders: Number(r.paid_orders),
        units_sold: Number(r.units_sold),
        product_sales_agorot: Number(r.product_sales_agorot),
        discounts_agorot: Number(r.discounts_agorot),
        gross_collected_agorot: Number(r.gross_collected_agorot),
        refunds_agorot: Number(r.refunds_agorot)
      }));
    },
    async isAdmin(userId) {
      const row = check(await db.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle());
      return Boolean(row);
    }
  };
}
