import { beforeEach, describe, expect, it, vi } from 'vitest';
import adminCoupons from '../api/admin/coupons';
import adminReport from '../api/admin/report';
import adminPayments from '../api/admin/payments';
import adminOrders from '../api/admin/orders';
import reconcile from '../api/cron/reconcile';
import { setDepsForTests } from '../api/_lib/deps';
import { noopVerifier } from '../api/_lib/tranzila';
import { validatePeriod } from '../api/_lib/adminValidation';
import type { NewOrder } from '../api/_lib/store';
import { MemoryStore } from './helpers/memoryStore';
import { call } from './helpers/http';

const NOW = new Date('2026-11-08T10:00:00Z');
let store: MemoryStore;
let sendEmail: ReturnType<typeof vi.fn<() => Promise<void>>>;

const ADMIN = { id: 'admin-1', email: 'owner@cleanfry.co.il' };
const USER = { id: 'user-2', email: 'someone@example.com' };
const tokens: Record<string, typeof ADMIN> = { 'admin-token': ADMIN, 'user-token': USER };

const as = (token: string) => ({ authorization: `Bearer ${token}` });
const period = { from: '2026-11-01', to: '2026-11-08' };

beforeEach(() => {
  store = new MemoryStore(() => NOW);
  store.admins.add(ADMIN.id);
  sendEmail = vi.fn<() => Promise<void>>(async () => {});
  setDepsForTests({
    store, verifier: noopVerifier, now: () => NOW, sendEmail,
    getUserFromToken: async (token) => tokens[token] ?? null
  });
});

describe('admin authorization', () => {
  const endpoints = [
    ['coupons GET', adminCoupons, 'GET'],
    ['coupons POST', adminCoupons, 'POST'],
    ['coupons PATCH', adminCoupons, 'PATCH'],
    ['report', adminReport, 'GET'],
    ['payments', adminPayments, 'GET'],
    ['payments POST', adminPayments, 'POST'],
    ['orders', adminOrders, 'GET']
  ] as const;

  it.each(endpoints)('%s returns 401 without a token', async (_name, handler, method) => {
    const res = await call(handler, { method, query: period, body: { code: 'HACK', discount_percent: 90 } });
    expect(res.status).toBe(401);
    expect(res.headers['cache-control']).toContain('no-store');
    expect(store.coupons).toHaveLength(0);
  });

  it.each(endpoints)('%s returns 401 with an invalid token', async (_name, handler, method) => {
    expect((await call(handler, { method, query: period, headers: as('forged') })).status).toBe(401);
  });

  it.each(endpoints)('%s returns 403 for a logged-in non-admin', async (_name, handler, method) => {
    const res = await call(handler, { method, query: period, headers: as('user-token'), body: { code: 'HACK', discount_percent: 90 } });
    expect(res.status).toBe(403);
    expect(store.coupons).toHaveLength(0);
  });
});

describe('admin coupons', () => {
  it('creates a coupon with a normalized code and writes an audit entry', async () => {
    const res = await call(adminCoupons, {
      method: 'POST', headers: as('admin-token'),
      body: { code: ' summer25 ', label: 'קמפיין קיץ', discount_percent: 25 }
    });
    expect(res.status).toBe(201);
    expect(res.body.coupon).toMatchObject({ code: 'SUMMER25', discount_percent: 25, is_active: true });
    expect(store.audit[0]).toMatchObject({ action: 'create', actor: { id: ADMIN.id } });
  });

  it('accepts exactly the 25% cap', async () => {
    const res = await call(adminCoupons, { method: 'POST', headers: as('admin-token'), body: { code: 'MAX25', discount_percent: 25 } });
    expect(res.status).toBe(201);
    expect(res.body.coupon.discount_percent).toBe(25);
  });

  it('rejects editing a coupon above 25%', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const res = await call(adminCoupons, { method: 'PATCH', headers: as('admin-token'), query: { id: coupon.id }, body: { discount_percent: 30 } });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('25');
    expect(store.coupons[0].discount_percent).toBe(18);
  });

  it('rejects duplicate codes', async () => {
    store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const res = await call(adminCoupons, { method: 'POST', headers: as('admin-token'), body: { code: 'nov26', discount_percent: 10 } });
    expect(res.status).toBe(409);
  });

  it.each([
    [{ code: 'X', discount_percent: 10 }],
    [{ code: 'שלום', discount_percent: 10 }],
    [{ code: 'OK10', discount_percent: 0 }],
    [{ code: 'OK10', discount_percent: 100 }],
    [{ code: 'OK10', discount_percent: 25.01 }],
    [{ code: 'OK10', discount_percent: 30 }],
    [{ code: 'OK10', discount_percent: 10.555 }],
    [{ code: 'OK10', discount_percent: 10, starts_at: '2026-12-01', expires_at: '2026-11-01' }]
  ])('rejects invalid input %j', async (body) => {
    expect((await call(adminCoupons, { method: 'POST', headers: as('admin-token'), body })).status).toBe(400);
  });

  it('pauses, resumes and edits, but never changes the code', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const patch = (body: Record<string, unknown>) =>
      call(adminCoupons, { method: 'PATCH', headers: as('admin-token'), query: { id: coupon.id }, body });

    expect((await patch({ is_active: false })).body.coupon.is_active).toBe(false);
    expect((await patch({ is_active: true })).body.coupon.is_active).toBe(true);
    expect((await patch({ discount_percent: 20, label: 'שותף' })).body.coupon).toMatchObject({ discount_percent: 20, label: 'שותף' });
    expect((await patch({ code: 'NEW' })).status).toBe(400);
    expect(store.coupons[0].code).toBe('NOV26');
  });

  it('lists coupons with their state and period stats', async () => {
    store.addCoupon({ code: 'LIVE', discount_percent: 10 });
    store.addCoupon({ code: 'PAUSED', discount_percent: 10, is_active: false });
    store.addCoupon({ code: 'FUTURE', discount_percent: 10, starts_at: '2026-12-01T00:00:00Z' });
    store.addCoupon({ code: 'OLD', discount_percent: 10, expires_at: '2026-01-01T00:00:00Z' });
    const res = await call(adminCoupons, { method: 'GET', headers: as('admin-token'), query: period });
    const states = Object.fromEntries(res.body.coupons.map((c: any) => [c.code, c.state]));
    expect(states).toEqual({ LIVE: 'active', PAUSED: 'paused', FUTURE: 'not_started', OLD: 'expired' });
  });

  it('has no delete', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const res = await call(adminCoupons, { method: 'DELETE', headers: as('admin-token'), query: { id: coupon.id } });
    expect(res.status).toBe(405);
    expect(store.coupons).toHaveLength(1);
  });
});

describe('admin report', () => {
  it('marks refunds as unavailable instead of zero', async () => {
    const res = await call(adminReport, { method: 'GET', headers: as('admin-token'), query: period });
    expect(res.body).toMatchObject({ refundsAvailable: false, timezone: 'Asia/Jerusalem' });
  });

  it('validates the period', () => {
    expect(validatePeriod('2026-11-01', '2026-11-08').ok).toBe(true);
    expect(validatePeriod('2026-11-08', '2026-11-01').ok).toBe(false);
    expect(validatePeriod('2026-02-30', '2026-03-01').ok).toBe(false);
    expect(validatePeriod("2026-11-01'; drop table", '2026-11-08').ok).toBe(false);
    expect(validatePeriod('2020-01-01', '2026-01-01').ok).toBe(false);
  });
});

function order(overrides: Partial<NewOrder> = {}): NewOrder {
  return {
    quantity: 2, delivery_method: 'delivery', pickup_location: null, unit_price_agorot: 5900,
    subtotal_agorot: 11800, discount_agorot: 0, shipping_agorot: 3500, total_agorot: 15300, currency: 'ILS',
    coupon_id: null, coupon_code_snapshot: null, discount_percent_snapshot: null,
    customer_name: 'ישראל', customer_phone: '0501234567', customer_email: 'a@b.co', customer_business_id: '',
    shipping_city: 'חיפה', shipping_address: 'הנמל 1', shipping_apartment: '', shipping_zip: '',
    invoice_lines: [], price_locked_until: '2026-11-08T10:15:00Z', ...overrides
  };
}

async function awaitingOrder(overrides: Partial<NewOrder> = {}) {
  const row = await store.createOrder(order(overrides));
  await store.markAwaitingVerification(row.id);
  return row;
}

const confirm = (orderId: string) =>
  call(adminPayments, { method: 'POST', headers: as('admin-token'), body: { orderId, action: 'confirm_payment' } });

describe('admin manual sale confirmation', () => {
  it('marks an awaiting order as paid, counts it in the report, and sends no email', async () => {
    const row = await awaitingOrder();
    const res = await confirm(row.id);
    expect(res.status).toBe(200);

    const saved = (await store.getOrder(row.id))!;
    expect(saved).toMatchObject({ payment_status: 'paid', manually_confirmed_by: ADMIN.email });
    expect(saved.paid_at).not.toBeNull();

    const report = await call(adminReport, { method: 'GET', headers: as('admin-token'), query: period });
    expect(report.body.rows).toEqual([expect.objectContaining({ coupon_id: null, paid_orders: 1, units_sold: 2, gross_collected_agorot: 15300 })]);

    expect(sendEmail).not.toHaveBeenCalled();
    process.env.CRON_SECRET = 'cron-secret';
    await call(reconcile, { method: 'POST', headers: { authorization: 'Bearer cron-secret' } });
    expect(sendEmail).not.toHaveBeenCalled();

    const attention = await call(adminPayments, { method: 'GET', headers: as('admin-token') });
    expect(attention.body.orders).toHaveLength(0);
  });

  it('uses the time of the successful notify as the payment time', async () => {
    const row = await awaitingOrder();
    const eventId = await store.insertPaymentEvent({
      provider_txn_index: '1', order_id: null, response_code: '000', sum_raw: '153', currency_raw: '1', confirmation_code: null, payload: {}
    });
    await store.finishPaymentEvent(eventId, 'unverified', null, row.id);
    store.events[0].received_at = '2026-11-07T20:00:00.000Z';
    await confirm(row.id);
    expect((await store.getOrder(row.id))!.paid_at).toBe('2026-11-07T20:00:00.000Z');
  });

  it.each(['pending', 'paid', 'amount_mismatch'] as const)('refuses to confirm an order in state %s', async (status) => {
    const row = await store.createOrder(order());
    store.orders[0].payment_status = status;
    const res = await confirm(row.id);
    expect(res.status).toBe(409);
    expect(store.orders[0].manually_confirmed_at).toBeNull();
  });

  it('does not resend a customer email for a manually confirmed order', async () => {
    const row = await awaitingOrder();
    await confirm(row.id);
    const res = await call(adminPayments, { method: 'POST', headers: as('admin-token'), body: { orderId: row.id, action: 'resend_email' } });
    expect(res.status).toBe(409);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects unknown actions', async () => {
    const row = await awaitingOrder();
    const res = await call(adminPayments, { method: 'POST', headers: as('admin-token'), body: { orderId: row.id, action: 'refund' } });
    expect(res.status).toBe(400);
  });
});

describe('admin orders table', () => {
  it('lists paid and awaiting orders with delivery details, and totals only the paid ones', async () => {
    const delivery = await awaitingOrder();
    await confirm(delivery.id);
    const freeShipping = await awaitingOrder({
      quantity: 4, subtotal_agorot: 23600, discount_agorot: 4200, shipping_agorot: 0, total_agorot: 19400, coupon_code_snapshot: 'NOV26'
    });
    await confirm(freeShipping.id);
    const pickup = await awaitingOrder({
      quantity: 1, delivery_method: 'pickup', pickup_location: 'kfar-saba', subtotal_agorot: 5900, shipping_agorot: 0, total_agorot: 5900
    });
    await store.createOrder(order()); // pending: לא מוצגת

    const res = await call(adminOrders, { method: 'GET', headers: as('admin-token'), query: period });
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(3);
    expect(res.body.orders.find((o: any) => o.id === freeShipping.id)).toMatchObject({
      manually_confirmed: true, delivery_method: 'delivery', quantity: 4, products_agorot: 19400, shipping_agorot: 0, coupon_code: 'NOV26'
    });
    expect(res.body.orders.find((o: any) => o.id === pickup.id)).toMatchObject({
      payment_status: 'awaiting_verification', delivery_method: 'pickup', pickup_location: 'kfar-saba'
    });
    expect(res.body.totals).toEqual({
      orders: 2, delivery_orders: 2, pickup_orders: 0, quantity: 6,
      products_agorot: 11800 + 19400, shipping_agorot: 3500, total_agorot: 15300 + 19400
    });
    expect(res.body.pending).toEqual({ orders: 1, total_agorot: 5900 });
    // אימייל הלקוח לא נחשף בטבלה
    expect(JSON.stringify(res.body)).not.toContain('a@b.co');
  });

  it('validates the period', async () => {
    const res = await call(adminOrders, { method: 'GET', headers: as('admin-token'), query: { from: '2026-11-08', to: '2026-11-01' } });
    expect(res.status).toBe(400);
  });
});
