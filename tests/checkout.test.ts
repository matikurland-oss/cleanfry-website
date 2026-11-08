import { beforeEach, describe, expect, it } from 'vitest';
import validateCoupon from '../api/validate-coupon';
import createOrder from '../api/create-order';
import { setDepsForTests } from '../api/_lib/deps';
import { noopVerifier } from '../api/_lib/tranzila';
import { parseOrderReference } from '../api/_lib/orderReference';
import { MemoryStore } from './helpers/memoryStore';
import { call } from './helpers/http';

process.env.ORDER_SIGNING_SECRET = 'test-secret';

const NOW = new Date('2026-11-08T10:00:00Z');
let store: MemoryStore;

const customer = {
  name: 'ישראל ישראלי', phone: '050-1234567', email: 'test@example.com',
  city: 'תל אביב', address: 'הרצל 1'
};

beforeEach(() => {
  store = new MemoryStore(() => NOW);
  setDepsForTests({ store, verifier: noopVerifier, now: () => NOW, sendEmail: async () => {} });
});

describe('validate-coupon', () => {
  it('accepts an active coupon and returns only its own result', async () => {
    store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    store.addCoupon({ code: 'OTHER', discount_percent: 50 });
    const res = await call(validateCoupon, { method: 'POST', body: { code: ' nov26 ' } });
    expect(res.body).toEqual({ valid: true, code: 'NOV26', discountPercent: 18 });
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it.each([
    ['paused', { is_active: false }],
    ['not started', { starts_at: '2026-11-09T00:00:00Z' }],
    ['expired', { expires_at: '2026-11-08T09:59:59Z' }]
  ])('rejects a %s coupon', async (_name, overrides) => {
    store.addCoupon({ code: 'X10', discount_percent: 10, ...overrides });
    const res = await call(validateCoupon, { method: 'POST', body: { code: 'X10' } });
    expect(res.body.valid).toBe(false);
    expect(res.body).not.toHaveProperty('discountPercent');
  });

  it('rejects an unknown code with the same message as a paused one', async () => {
    store.addCoupon({ code: 'PAUSED', discount_percent: 10, is_active: false });
    const unknown = await call(validateCoupon, { method: 'POST', body: { code: 'NOPE' } });
    const paused = await call(validateCoupon, { method: 'POST', body: { code: 'PAUSED' } });
    expect(unknown.body).toEqual(paused.body);
  });

  it('rate limits repeated checks from one IP', async () => {
    let last;
    for (let i = 0; i < 21; i++) last = await call(validateCoupon, { method: 'POST', body: { code: 'NOPE' } });
    expect(last!.status).toBe(429);
  });
});

describe('create-order', () => {
  it('creates a pending order priced by the server, with a 15 minute lock', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const res = await call(createOrder, {
      method: 'POST',
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'nov26', displayedTotal: 229, ...customer }
    });
    expect(res.status).toBe(200);
    expect(res.body.payment.sum).toBe(229);
    const order = store.orders[0];
    expect(order).toMatchObject({
      payment_status: 'pending', total_agorot: 22900, discount_agorot: 4200, shipping_agorot: 3500,
      coupon_id: coupon.id, coupon_code_snapshot: 'NOV26', discount_percent_snapshot: 18
    });
    expect(new Date(order.price_locked_until).getTime() - NOW.getTime()).toBe(15 * 60_000);
    expect(parseOrderReference(res.body.payment.remarks)).toBe(order.id);
    // פרטי לקוח לא נכנסים להפניה שנשלחת לטרנזילה
    expect(res.body.payment.remarks).not.toContain('test@example.com');
  });

  it('ignores total, percent and shipping sent by the client', async () => {
    store.addCoupon({ code: 'TEN', discount_percent: 10 });
    const res = await call(createOrder, {
      method: 'POST',
      body: {
        quantity: 1, deliveryMethod: 'delivery', couponCode: 'TEN', displayedTotal: 1,
        total: 1, discountPercent: 99, shipping: 0, ...customer
      }
    });
    expect(res.status).toBe(409);
    expect(res.body.pricing.total).toBe(88); // 59 - 6 + 35
    expect(store.orders).toHaveLength(0);
  });

  it('blocks an order when the coupon was paused after it was applied', async () => {
    store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const check = await call(validateCoupon, { method: 'POST', body: { code: 'NOV26' } });
    expect(check.body.valid).toBe(true);

    store.coupons[0].is_active = false; // המנהל משהה את הקופון

    const res = await call(createOrder, {
      method: 'POST',
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'NOV26', displayedTotal: 229, ...customer }
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('coupon_invalid');
    expect(res.body.pricing).toMatchObject({ total: 236, coupon: null }); // 236 ≥ 199 → משלוח חינם
    expect(res.body.message).toContain('236');
    expect(store.orders).toHaveLength(0);
  });

  it('works without a coupon, including pickup', async () => {
    const res = await call(createOrder, {
      method: 'POST',
      body: { quantity: 2, deliveryMethod: 'pickup', pickupLocation: 'kfar-saba', displayedTotal: 118, name: 'א', phone: '0501234567', email: 'a@b.co' }
    });
    expect(res.status).toBe(200);
    expect(store.orders[0]).toMatchObject({ coupon_id: null, total_agorot: 11800, shipping_city: '' });
    const lines = JSON.parse(decodeURIComponent(res.body.payment.jsonPurchaseData));
    expect(lines[1].product_name).toBe('איסוף עצמי - סניף כפר סבא');
  });

  it.each([
    [{ quantity: 11 }],
    [{ quantity: 0 }],
    [{ deliveryMethod: 'drone' }],
    [{ phone: '123' }],
    [{ email: 'not-an-email' }],
    [{ city: '' }]
  ])('rejects invalid input %j', async (override) => {
    const res = await call(createOrder, {
      method: 'POST',
      body: { quantity: 1, deliveryMethod: 'delivery', displayedTotal: 94, ...customer, ...override }
    });
    expect(res.status).toBe(400);
    expect(store.orders).toHaveLength(0);
  });

  it('does not change existing orders when a coupon is edited later', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    await call(createOrder, {
      method: 'POST',
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'NOV26', displayedTotal: 229, ...customer }
    });
    await store.updateCoupon(coupon.id, { discount_percent: 30 }, { id: 'a', email: 'a@b.co' });
    expect(store.orders[0]).toMatchObject({ discount_percent_snapshot: 18, discount_agorot: 4200, total_agorot: 22900 });
  });
});
