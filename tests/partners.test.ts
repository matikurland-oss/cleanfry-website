import { beforeEach, describe, expect, it, vi } from 'vitest';
import adminPartners from '../api/admin/partners';
import adminCoupons from '../api/admin/coupons';
import adminOrders from '../api/admin/orders';
import adminReport from '../api/admin/report';
import adminPayments from '../api/admin/payments';
import partnerSummary from '../api/partner/summary';
import createOrder from '../api/create-order';
import { setDepsForTests, type AuthAdmin } from '../api/_lib/deps';
import { noopVerifier } from '../api/_lib/tranzila';
import type { NewOrder } from '../api/_lib/store';
import { validPassword } from '../api/_lib/adminValidation';
import { generatePassword } from '../src/admin/PartnersPanel';
import { MemoryStore } from './helpers/memoryStore';
import { call } from './helpers/http';

process.env.ORDER_SIGNING_SECRET = 'test-secret';

const NOW = new Date('2026-11-08T10:00:00Z');
const ADMIN = { id: 'admin-1', email: 'owner@cleanfry.co.il' };
const USER = { id: 'user-2', email: 'someone@example.com' };

let store: MemoryStore;
let tokens: Record<string, { id: string; email: string }>;
let authUsers: Map<string, { email: string; password: string }>;
let authAdmin: AuthAdmin & { [K in keyof AuthAdmin]: ReturnType<typeof vi.fn> };

const as = (token: string) => ({ authorization: `Bearer ${token}` });

beforeEach(() => {
  store = new MemoryStore(() => NOW);
  store.admins.add(ADMIN.id);
  tokens = { 'admin-token': ADMIN, 'user-token': USER };
  authUsers = new Map();
  let next = 0;
  authAdmin = {
    createUser: vi.fn(async (email: string, password: string) => {
      if ([...authUsers.values()].some((u) => u.email === email)) throw new Error('duplicate_user');
      const id = `partner-user-${++next}`;
      authUsers.set(id, { email, password });
      tokens[`${id}-token`] = { id, email };
      return id;
    }),
    deleteUser: vi.fn(async (id: string) => {
      authUsers.delete(id);
      store.partners = store.partners.filter((p) => p.user_id !== id); // on delete cascade
    }),
    setPassword: vi.fn(async (id: string, password: string) => {
      authUsers.get(id)!.password = password;
    })
  } as never;
  setDepsForTests({
    store, verifier: noopVerifier, now: () => NOW, sendEmail: async () => {}, authAdmin,
    getUserFromToken: async (token) => tokens[token] ?? null
  });
});

function order(overrides: Partial<NewOrder> = {}): NewOrder {
  return {
    quantity: 2, delivery_method: 'delivery', pickup_location: null, unit_price_agorot: 5900,
    subtotal_agorot: 11800, discount_agorot: 0, shipping_agorot: 3500, total_agorot: 15300, currency: 'ILS',
    coupon_id: null, coupon_code_snapshot: null, discount_percent_snapshot: null,
    customer_name: 'ישראל ישראלי', customer_phone: '0501234567', customer_email: 'secret@customer.co', customer_business_id: '',
    shipping_city: 'חיפה', shipping_address: 'הנמל 1', shipping_apartment: '', shipping_zip: '',
    invoice_lines: [], price_locked_until: '2026-11-08T10:15:00Z', ...overrides
  };
}

/** הזמנה בקופון ששולמה. 3 יחידות, 10% הנחה: 17700 - 1800 = 15900 אגורות מוצרים */
async function paidCouponOrder(couponId: string, code: string, paidAt = NOW.toISOString(), overrides: Partial<NewOrder> = {}) {
  const row = await store.createOrder(order({
    quantity: 3, subtotal_agorot: 17700, discount_agorot: 1800, shipping_agorot: 0, total_agorot: 15900,
    coupon_id: couponId, coupon_code_snapshot: code, discount_percent_snapshot: 10, ...overrides
  }));
  await store.recordPayment(row.id, `T-${row.id}`, row.total_agorot, 'ILS');
  const saved = store.orders.find((o) => o.id === row.id)!;
  saved.paid_at = paidAt;
  return saved;
}

async function createPartner(body: Record<string, unknown> = {}) {
  return call(adminPartners, {
    method: 'POST', headers: as('admin-token'),
    body: { username: 'dana', password: 'Secret-pass-123', display_name: 'דנה', commission_percent: 15, ...body }
  });
}

const summaryAs = (token: string) => call(partnerSummary, { method: 'GET', headers: as(token) });

describe('partner admin API', () => {
  it('is admin-only', async () => {
    expect((await call(adminPartners, { method: 'GET' })).status).toBe(401);
    expect((await call(adminPartners, { method: 'GET', headers: as('user-token') })).status).toBe(403);
    expect((await call(adminPartners, { method: 'POST', headers: as('user-token'), body: { username: 'x' } })).status).toBe(403);
    expect(authAdmin.createUser).not.toHaveBeenCalled();
  });

  it('creates a partner with a login user and assigns coupons', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    const res = await createPartner({ username: ' Dana ', coupon_ids: [coupon.id] });
    expect(res.status).toBe(201);
    expect(res.body.partner).toMatchObject({
      username: 'dana', display_name: 'דנה', commission_percent: 15, is_active: true,
      coupons: [{ id: coupon.id, code: 'DANA10', discount_percent: 10, state: 'active' }],
      totals: { orders_count: 0, units: 0, sales_agorot: 0, commission_agorot: 0 }
    });
    expect(authAdmin.createUser).toHaveBeenCalledWith('dana@partners.cleanfry.co.il', 'Secret-pass-123');
    expect(store.audit).toContainEqual(expect.objectContaining({ coupon_id: coupon.id, action: 'assign_partner' }));
  });

  it('validates input', async () => {
    expect((await createPartner({ username: 'a' })).status).toBe(400);
    expect((await createPartner({ username: 'דנה' })).status).toBe(400);
    expect((await createPartner({ password: 'Short1' })).status).toBe(400);
    expect((await createPartner({ password: 'alllowercase123' })).status).toBe(400); // בלי אות גדולה
    expect((await createPartner({ password: 'ALLUPPERCASE123' })).status).toBe(400); // בלי אות קטנה
    expect((await createPartner({ password: 'NoDigitsHereAtAll' })).status).toBe(400);
    expect((await call(adminPartners, { method: 'PATCH', headers: as('admin-token'), query: { id: '00000000-0000-0000-0000-000000000000' }, body: {} })).status).toBe(404);
    expect((await createPartner({ commission_percent: 51 })).status).toBe(400);
    expect((await createPartner({ commission_percent: -1 })).status).toBe(400);
    expect((await createPartner({ display_name: '  ' })).status).toBe(400);
    expect((await createPartner({ coupon_ids: ['not-a-uuid'] })).status).toBe(400);
    expect(authAdmin.createUser).not.toHaveBeenCalled();
  });

  it('rejects a taken username', async () => {
    expect((await createPartner()).status).toBe(201);
    expect((await createPartner()).status).toBe(409);
    expect(store.partners).toHaveLength(1);
  });

  it('does not let two partners share a coupon', async () => {
    const coupon = store.addCoupon({ code: 'SHARED', discount_percent: 10 });
    await createPartner({ coupon_ids: [coupon.id] });
    const res = await createPartner({ username: 'noa', coupon_ids: [coupon.id] });
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('SHARED');
    expect(authAdmin.createUser).toHaveBeenCalledTimes(1);
  });

  it('rolls back the login user when assigning a coupon fails', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    store.failNext.setCouponPartner = 1;
    const res = await createPartner({ coupon_ids: [coupon.id] });
    expect(res.status).toBe(500);
    expect(authAdmin.deleteUser).toHaveBeenCalled();
    expect(store.partners).toHaveLength(0);
    expect(authUsers.size).toBe(0);
  });

  it('edits commission, status, password and coupons', async () => {
    const a = store.addCoupon({ code: 'AAA', discount_percent: 10 });
    const b = store.addCoupon({ code: 'BBB', discount_percent: 10 });
    const id = (await createPartner({ coupon_ids: [a.id] })).body.partner.id;

    const res = await call(adminPartners, {
      method: 'PATCH', headers: as('admin-token'), query: { id },
      body: { commission_percent: 20, is_active: false, password: 'New-password-22', coupon_ids: [b.id] }
    });
    expect(res.status).toBe(200);
    expect(res.body.partner).toMatchObject({ commission_percent: 20, is_active: false, coupons: [{ code: 'BBB' }] });
    expect(authUsers.get('partner-user-1')!.password).toBe('New-password-22');
    expect(a.partner_id).toBeNull();

    expect((await call(adminPartners, { method: 'PATCH', headers: as('admin-token'), query: { id }, body: { username: 'x' } })).status).toBe(400);
    expect((await call(adminPartners, { method: 'PATCH', headers: as('admin-token'), query: { id }, body: { commission_percent: 80 } })).status).toBe(400);
  });

  it('shows the owner of each coupon in the coupons list', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    const partnerId = (await createPartner({ coupon_ids: [coupon.id] })).body.partner.id;
    const res = await call(adminCoupons, { method: 'GET', headers: as('admin-token'), query: { from: '2026-11-01', to: '2026-11-08' } });
    expect(res.body.coupons[0].partner_id).toBe(partnerId);
  });
});

describe('password generator', () => {
  it('always produces a password the server accepts', () => {
    for (let i = 0; i < 500; i++) expect(validPassword(generatePassword())).toBe(true);
  });
});

describe('partner sales attribution', () => {
  it('snapshots the partner and her commission on new orders', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    const partnerId = (await createPartner({ coupon_ids: [coupon.id] })).body.partner.id;

    const res = await call(createOrder, {
      method: 'POST',
      body: {
        quantity: 1, deliveryMethod: 'pickup', pickupLocation: 'tel-aviv', couponCode: 'dana10', displayedTotal: 53,
        name: 'לקוח', phone: '0501234567', email: 'c@d.co'
      }
    });
    expect(res.status).toBe(200);
    expect(store.orders[0]).toMatchObject({ partner_id: partnerId, partner_commission_percent: 15 });
  });

  it('counts earlier orders of a coupon once it is assigned, and keeps old rates after a rate change', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    await paidCouponOrder(coupon.id, 'DANA10');
    const id = (await createPartner({ coupon_ids: [coupon.id] })).body.partner.id;
    await call(adminPartners, { method: 'PATCH', headers: as('admin-token'), query: { id }, body: { commission_percent: 20 } });
    await paidCouponOrder(coupon.id, 'DANA10');

    const res = await summaryAs('partner-user-1-token');
    // 15% מ-15900 = 2385 ; 20% מ-15900 = 3180
    expect(res.body.totals).toEqual({ orders: 2, units: 6, sales_agorot: 31800, commission_agorot: 2385 + 3180 });
  });
});

describe('partner summary', () => {
  it('requires a logged-in, active partner', async () => {
    await createPartner();
    expect((await call(partnerSummary, { method: 'GET' })).status).toBe(401);
    expect((await summaryAs('forged')).status).toBe(401);
    expect((await summaryAs('user-token')).status).toBe(403);
    expect((await summaryAs('admin-token')).status).toBe(403);

    store.partners[0].is_active = false;
    expect((await summaryAs('partner-user-1-token')).status).toBe(403);
  });

  it('is view-only: every admin action is refused and nothing changes', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    const id = (await createPartner({ coupon_ids: [coupon.id] })).body.partner.id;
    const awaiting = await store.createOrder(order());
    await store.markAwaitingVerification(awaiting.id);
    const before = JSON.stringify({ coupons: store.coupons, partners: store.partners, orders: store.orders, audit: store.audit });
    const token = as('partner-user-1-token');

    const attempts = [
      [adminPartners, 'GET', {}, {}],
      [adminPartners, 'POST', {}, { username: 'evil', password: 'password123', display_name: 'x', commission_percent: 50 }],
      [adminPartners, 'PATCH', { id }, { commission_percent: 50 }],
      [adminCoupons, 'GET', { from: '2026-11-01', to: '2026-11-08' }, {}],
      [adminCoupons, 'POST', {}, { code: 'FREE', discount_percent: 25 }],
      [adminCoupons, 'PATCH', { id: coupon.id }, { discount_percent: 25 }],
      [adminOrders, 'GET', { from: '2026-11-01', to: '2026-11-08' }, {}],
      [adminReport, 'GET', { from: '2026-11-01', to: '2026-11-08' }, {}],
      [adminPayments, 'GET', {}, {}],
      [adminPayments, 'POST', {}, { orderId: awaiting.id, action: 'confirm_payment' }]
    ] as const;
    for (const [handler, method, query, body] of attempts) {
      const res = await call(handler, { method, query, body, headers: token });
      expect(res.status, `${method} ${handler.name}`).toBe(403);
    }

    // גם ב-API שלה אין שום פעולה מלבד צפייה
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const res = await call(partnerSummary, { method, headers: token, body: { commission_percent: 50 } });
      expect(res.status).toBe(405);
    }

    expect(JSON.stringify({ coupons: store.coupons, partners: store.partners, orders: store.orders, audit: store.audit })).toBe(before);
    expect(authAdmin.setPassword).not.toHaveBeenCalled();
    expect(authAdmin.createUser).toHaveBeenCalledTimes(1);
  });

  it('counts only paid, uncancelled orders on her own coupons, without shipping, per Israel month', async () => {
    const mine = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    const theirs = store.addCoupon({ code: 'NOA10', discount_percent: 10 });
    await createPartner({ coupon_ids: [mine.id] });
    await createPartner({ username: 'noa', coupon_ids: [theirs.id] });

    // שעון חורף (UTC+2): 21:30Z = 23:30 ב-31.10 בישראל → אוקטובר ; 22:30Z = 00:30 ב-1.11 → נובמבר
    await paidCouponOrder(mine.id, 'DANA10', '2026-10-31T21:30:00Z');
    await paidCouponOrder(mine.id, 'DANA10', '2026-10-31T22:30:00Z');
    // עם משלוח: המשלוח לא נכנס לעמלה
    await paidCouponOrder(mine.id, 'DANA10', NOW.toISOString(), { shipping_agorot: 3500, total_agorot: 19400 });
    await paidCouponOrder(theirs.id, 'NOA10'); // של משפיענית אחרת
    await paidCouponOrder(mine.id, 'DANA10').then((o) => { o.fulfillment_status = 'cancelled'; });
    await store.createOrder(order({ coupon_id: mine.id, coupon_code_snapshot: 'DANA10' })); // לא שולמה
    await store.createOrder(order()); // בלי קופון

    const res = await summaryAs('partner-user-1-token');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      displayName: 'דנה',
      commissionPercent: 15,
      coupons: [{ code: 'DANA10', discountPercent: 10, active: true }],
      totals: { orders: 3, units: 9, sales_agorot: 47700, commission_agorot: 2385 * 3 },
      months: [
        { month: '2026-11', orders: 2, units: 6, sales_agorot: 31800, commission_agorot: 4770 },
        { month: '2026-10', orders: 1, units: 3, sales_agorot: 15900, commission_agorot: 2385 }
      ]
    });
  });

  it('rounds the commission to whole agorot per order', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    await createPartner({ coupon_ids: [coupon.id], commission_percent: 12.5 });
    await paidCouponOrder(coupon.id, 'DANA10', NOW.toISOString(), { quantity: 1, subtotal_agorot: 5900, discount_agorot: 600, total_agorot: 5300 });
    const res = await summaryAs('partner-user-1-token');
    expect(res.body.totals.commission_agorot).toBe(663); // 5300 * 12.5% = 662.5
  });

  it('never exposes customer or order details', async () => {
    const coupon = store.addCoupon({ code: 'DANA10', discount_percent: 10 });
    await createPartner({ coupon_ids: [coupon.id] });
    const row = await paidCouponOrder(coupon.id, 'DANA10');
    const json = JSON.stringify((await summaryAs('partner-user-1-token')).body);
    for (const secret of ['secret@customer.co', 'ישראל ישראלי', '0501234567', 'הנמל', 'חיפה', row.id, row.public_ref, coupon.id]) {
      expect(json).not.toContain(secret);
    }
    expect(json).not.toMatch(/customer|shipping|public_ref|phone|email/);
  });
});
