// מימוש בזיכרון של Store לבדיקות. משחזר את האילוצים החשובים של מסד הנתונים: ייחודיות קוד קופון,
// ייחודיות עסקה (provider, txn_index), וקביעת סטטוס ההזמנה כמו record_payment.
// דוח לפי אזור זמן נבדק מול Postgres אמיתי (tests/db), לא כאן.
import { randomUUID } from 'node:crypto';
import type { CouponRow } from '../../api/_lib/coupons';
import type {
  Actor, CouponInput, CouponPatch, CouponReportRow, EventOutcome, NewOrder, OrderRow,
  PaymentEventInput, PaymentEventRow, RecordPaymentResult, Store
} from '../../api/_lib/store';

export interface MemoryPayment {
  provider_txn_index: string;
  order_id: string;
  amount_agorot: number;
  currency: string;
}

export class MemoryStore implements Store {
  coupons: CouponRow[] = [];
  audit: { coupon_id: string; action: string; actor: Actor; changes: unknown }[] = [];
  orders: OrderRow[] = [];
  payments: MemoryPayment[] = [];
  events: PaymentEventRow[] = [];
  admins = new Set<string>();
  rateCounts = new Map<string, number>();
  /** מאפשר לבדיקה לדמות כשל זמני בשמירה */
  failNext: Partial<Record<keyof Store, number>> = {};

  constructor(private now: () => Date = () => new Date()) {}

  private maybeFail(method: keyof Store) {
    const remaining = this.failNext[method];
    if (remaining) {
      this.failNext[method] = remaining - 1;
      throw new Error(`simulated ${method} failure`);
    }
  }

  async hitRateLimit(key: string, max: number) {
    const count = (this.rateCounts.get(key) ?? 0) + 1;
    this.rateCounts.set(key, count);
    return count <= max;
  }

  addCoupon(partial: Partial<CouponRow> & { code: string; discount_percent: number }): CouponRow {
    const row: CouponRow = {
      id: randomUUID(), label: '', is_active: true, starts_at: null, expires_at: null,
      created_at: this.now().toISOString(), updated_at: this.now().toISOString(), ...partial
    };
    this.coupons.push(row);
    return row;
  }

  async getCouponByCode(code: string) { return this.coupons.find((c) => c.code === code) ?? null; }
  async getCoupon(id: string) { return this.coupons.find((c) => c.id === id) ?? null; }
  async listCoupons() { return [...this.coupons]; }

  async createCoupon(input: CouponInput, actor: Actor) {
    if (this.coupons.some((c) => c.code === input.code)) throw new Error('duplicate key value violates unique constraint');
    const row = this.addCoupon(input);
    this.audit.push({ coupon_id: row.id, action: 'create', actor, changes: input });
    return row;
  }

  async updateCoupon(id: string, patch: CouponPatch, actor: Actor) {
    const row = this.coupons.find((c) => c.id === id);
    if (!row) throw new Error('coupon_not_found');
    Object.assign(row, patch, { updated_at: this.now().toISOString() });
    this.audit.push({ coupon_id: id, action: 'update', actor, changes: patch });
    return { ...row };
  }

  async createOrder(order: NewOrder) {
    this.maybeFail('createOrder');
    const row: OrderRow = {
      ...structuredClone(order),
      id: randomUUID(),
      public_ref: randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase(),
      payment_status: 'pending',
      fulfillment_status: 'new',
      created_at: this.now().toISOString(),
      paid_at: null,
      paid_after_expiry: false,
      duplicate_payment: false,
      confirmation_email_sent_at: null,
      confirmation_email_attempts: 0,
      confirmation_email_last_error: null,
      unverified_notice_sent_at: null
    };
    this.orders.push(row);
    return { ...row };
  }

  async getOrder(id: string) {
    const row = this.orders.find((o) => o.id === id);
    return row ? { ...row } : null;
  }

  async markAwaitingVerification(orderId: string) {
    const row = this.orders.find((o) => o.id === orderId);
    if (row && row.payment_status === 'pending') row.payment_status = 'awaiting_verification';
  }

  async recordPayment(orderId: string, txnIndex: string, amountAgorot: number, currency: string): Promise<RecordPaymentResult> {
    this.maybeFail('recordPayment');
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('order_not_found');
    if (this.payments.some((p) => p.provider_txn_index === txnIndex)) {
      return { payment_recorded: false, order_newly_paid: false, order_payment_status: order.payment_status };
    }
    this.payments.push({ provider_txn_index: txnIndex, order_id: orderId, amount_agorot: amountAgorot, currency });
    if (order.payment_status === 'paid') {
      order.duplicate_payment = true;
      return { payment_recorded: true, order_newly_paid: false, order_payment_status: 'paid' };
    }
    const now = this.now();
    if (amountAgorot !== order.total_agorot || currency !== order.currency) {
      order.payment_status = 'amount_mismatch';
      order.paid_at ??= now.toISOString();
      return { payment_recorded: true, order_newly_paid: false, order_payment_status: 'amount_mismatch' };
    }
    order.payment_status = 'paid';
    order.paid_at = now.toISOString();
    order.paid_after_expiry = now > new Date(order.price_locked_until);
    return { payment_recorded: true, order_newly_paid: true, order_payment_status: 'paid' };
  }

  async recordEmailAttempt(orderId: string, error: string | null) {
    const order = this.orders.find((o) => o.id === orderId)!;
    order.confirmation_email_attempts++;
    order.confirmation_email_last_error = error;
    if (!error) order.confirmation_email_sent_at = this.now().toISOString();
  }

  async claimUnverifiedNotice(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId)!;
    if (order.unverified_notice_sent_at) return false;
    order.unverified_notice_sent_at = this.now().toISOString();
    return true;
  }

  async listOrdersNeedingEmail(maxAttempts: number) {
    return this.orders.filter((o) => o.payment_status === 'paid' && !o.confirmation_email_sent_at && o.confirmation_email_attempts < maxAttempts);
  }

  async listAttentionOrders() {
    return this.orders.filter((o) =>
      o.payment_status === 'awaiting_verification' || o.payment_status === 'amount_mismatch' ||
      o.paid_after_expiry || o.duplicate_payment || (o.payment_status === 'paid' && !o.confirmation_email_sent_at));
  }

  async insertPaymentEvent(event: PaymentEventInput) {
    this.maybeFail('insertPaymentEvent');
    const id = randomUUID();
    this.events.push({
      ...structuredClone(event), id, received_at: this.now().toISOString(), attempts: 0,
      processed_at: null, outcome: null, processing_error: null
    });
    return id;
  }

  async finishPaymentEvent(id: string, outcome: EventOutcome, error: string | null, orderId: string | null) {
    const event = this.events.find((e) => e.id === id)!;
    Object.assign(event, { outcome, processing_error: error, order_id: orderId, processed_at: this.now().toISOString(), attempts: event.attempts + 1 });
  }

  async failPaymentEvent(id: string, error: string) {
    const event = this.events.find((e) => e.id === id)!;
    Object.assign(event, { processing_error: error, attempts: event.attempts + 1 });
  }

  async listEventsToReprocess(limit: number, maxAttempts: number) {
    return this.events
      .filter((e) => (e.processed_at === null || e.outcome === 'unverified' || e.outcome === 'verification_failed') && e.attempts < maxAttempts)
      .slice(0, limit)
      .map((e) => structuredClone(e));
  }

  async couponReport(): Promise<CouponReportRow[]> {
    const groups = new Map<string | null, OrderRow[]>();
    for (const o of this.orders.filter((x) => x.payment_status === 'paid')) {
      groups.set(o.coupon_id, [...(groups.get(o.coupon_id) ?? []), o]);
    }
    return [...groups.entries()].map(([couponId, orders]) => ({
      coupon_id: couponId,
      coupon_code: orders[0].coupon_code_snapshot,
      coupon_label: this.coupons.find((c) => c.id === couponId)?.label ?? null,
      paid_orders: orders.length,
      units_sold: orders.reduce((s, o) => s + o.quantity, 0),
      product_sales_agorot: orders.reduce((s, o) => s + o.subtotal_agorot - o.discount_agorot, 0),
      discounts_agorot: orders.reduce((s, o) => s + o.discount_agorot, 0),
      gross_collected_agorot: this.payments.filter((p) => orders.some((o) => o.id === p.order_id)).reduce((s, p) => s + p.amount_agorot, 0),
      refunds_agorot: 0
    })).sort((a, b) => b.paid_orders - a.paid_orders);
  }

  async isAdmin(userId: string) { return this.admins.has(userId); }
}
