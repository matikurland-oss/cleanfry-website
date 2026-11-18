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
    expect(res.body).toEqual({ valid: true, code: 'NOV26', discountPercent: 18, stacksPromotions: false });
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
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'nov26', displayedTotal: 212.52, ...customer }
    });
    expect(res.status).toBe(200);
    // 4 × 59 = 236 − 18% (42.48) + משלוח מדרגה 3–4 (19) = 212.52
    expect(res.body.payment.sum).toBe(212.52);
    const order = store.orders[0];
    expect(order).toMatchObject({
      payment_status: 'pending', total_agorot: 21252, discount_agorot: 4248, shipping_agorot: 1900,
      coupon_id: coupon.id, coupon_code_snapshot: 'NOV26', discount_percent_snapshot: 18,
      unit_price_agorot: 5900, tier_unit_price_agorot: 5500, coupon_stacks_snapshot: false, coupon_applied: true
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
    expect(res.body.pricing.total).toBe(88.1); // 59 - 5.90 + 35
    expect(store.orders).toHaveLength(0);
  });

  it('blocks an order when the coupon was paused after it was applied', async () => {
    store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const check = await call(validateCoupon, { method: 'POST', body: { code: 'NOV26' } });
    expect(check.body.valid).toBe(true);

    store.coupons[0].is_active = false; // המנהל משהה את הקופון

    const res = await call(createOrder, {
      method: 'POST',
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'NOV26', displayedTotal: 212.52, ...customer }
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('coupon_invalid');
    expect(res.body.pricing).toMatchObject({ total: 239, coupon: null }); // 4 × 55 + 19
    expect(res.body.message).toContain('239');
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
      body: { quantity: 4, deliveryMethod: 'delivery', couponCode: 'NOV26', displayedTotal: 212.52, ...customer }
    });
    await store.updateCoupon(coupon.id, { discount_percent: 30 }, { id: 'a', email: 'a@b.co' });
    expect(store.orders[0]).toMatchObject({ discount_percent_snapshot: 18, discount_agorot: 4248, total_agorot: 21252 });
  });
});

describe('create-order – quantity tiers', () => {
  const order = (body: Record<string, unknown>) =>
    call(createOrder, { method: 'POST', body: { deliveryMethod: 'delivery', ...customer, ...body } });

  it.each([
    [1, 94], [2, 153], [3, 184], [4, 239], [5, 255], [6, 306], [10, 510]
  ])('%i packs with home delivery cost ₪%d, and the Tranzila sum matches', async (quantity, total) => {
    const res = await order({ quantity, displayedTotal: total });
    expect(res.status).toBe(200);
    expect(res.body.payment.sum).toBe(total);
    const lines = JSON.parse(decodeURIComponent(res.body.payment.jsonPurchaseData)) as { product_price: number; product_quantity: number }[];
    expect(lines.reduce((s, l) => s + Math.round(l.product_price * 100) * l.product_quantity, 0)).toBe(total * 100);
  });

  it('rejects 5 packs sent with the total of 3 packs', async () => {
    const res = await order({ quantity: 5, displayedTotal: 184 });
    expect(res.status).toBe(409);
    expect(res.body.pricing.total).toBe(255);
    expect(store.orders).toHaveLength(0);
  });

  it('15% coupon with stacking: 3 packs = 159.25, 5 packs = 216.75 with free shipping', async () => {
    store.addCoupon({ code: 'DANA15', discount_percent: 15, stacks_promotions: true });
    expect((await order({ quantity: 3, couponCode: 'DANA15', displayedTotal: 159.25 })).status).toBe(200);
    const five = await order({ quantity: 5, couponCode: 'DANA15', displayedTotal: 216.75 });
    expect(five.status).toBe(200);
    expect(store.orders[1]).toMatchObject({ unit_price_agorot: 5100, shipping_agorot: 0, coupon_applied: true, coupon_stacks_snapshot: true });
  });

  it('15% coupon without stacking: 3 packs = 169.45, 5 packs = 250.75', async () => {
    store.addCoupon({ code: 'DANA15', discount_percent: 15 });
    expect((await order({ quantity: 3, couponCode: 'DANA15', displayedTotal: 169.45 })).status).toBe(200);
    expect((await order({ quantity: 5, couponCode: 'DANA15', displayedTotal: 250.75 })).status).toBe(200);
    expect(store.orders[1]).toMatchObject({ unit_price_agorot: 5900, tier_unit_price_agorot: 5100, discount_agorot: 4425 });
  });

  it('a 5% coupon without stacking is entered but not applied on 5 packs', async () => {
    const coupon = store.addCoupon({ code: 'SMALL5', discount_percent: 5 });
    const res = await order({ quantity: 5, couponCode: 'SMALL5', displayedTotal: 255 });
    expect(res.status).toBe(200);
    expect(res.body.pricing).toMatchObject({ total: 255, discount: 0, couponApplied: false, coupon: { code: 'SMALL5' } });
    expect(store.orders[0]).toMatchObject({
      coupon_id: coupon.id, coupon_applied: false, discount_agorot: 0, unit_price_agorot: 5100, total_agorot: 25500
    });
    const lines = JSON.parse(decodeURIComponent(res.body.payment.jsonPurchaseData));
    expect(lines[0].product_name).toBe('מארז CleanFry');
  });

  it('the coupon never touches shipping: the invoice shipping line stays exactly ₪19', async () => {
    store.addCoupon({ code: 'ODD777', discount_percent: 7.77 });
    // 3 × 59 = 177 − 7.77% (13.75) = 163.25 + משלוח 19 = 182.25. 163.25 לא מתחלק ב-3, אז אגורת העיגול נכנסת לשורת מוצר
    const res = await order({ quantity: 3, couponCode: 'ODD777', displayedTotal: 182.25 });
    expect(res.status).toBe(200);
    expect(store.orders[0]).toMatchObject({ shipping_agorot: 1900, discount_agorot: 1375, total_agorot: 18225 });
    const lines = JSON.parse(decodeURIComponent(res.body.payment.jsonPurchaseData));
    expect(lines).toEqual([
      { product_name: 'מארז CleanFry (קופון: ODD777)', product_quantity: 1, product_price: 54.41 },
      { product_name: 'מארז CleanFry (קופון: ODD777)', product_quantity: 2, product_price: 54.42 },
      { product_name: 'דמי משלוח עד הבית', product_quantity: 1, product_price: 19 }
    ]);
  });

  it('turning stacking on in the admin affects the next order immediately', async () => {
    const coupon = store.addCoupon({ code: 'DANA15', discount_percent: 15 });
    await store.updateCoupon(coupon.id, { stacks_promotions: true }, { id: 'a', email: 'a@b.co' });
    const check = await call(validateCoupon, { method: 'POST', body: { code: 'DANA15' } });
    expect(check.body.stacksPromotions).toBe(true);
    expect((await order({ quantity: 5, couponCode: 'DANA15', displayedTotal: 216.75 })).status).toBe(200);
  });
});
