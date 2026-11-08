import { beforeEach, describe, expect, it } from 'vitest';
import adminCoupons from '../api/admin/coupons';
import adminReport from '../api/admin/report';
import adminPayments from '../api/admin/payments';
import { setDepsForTests } from '../api/_lib/deps';
import { noopVerifier } from '../api/_lib/tranzila';
import { validatePeriod } from '../api/_lib/adminValidation';
import { MemoryStore } from './helpers/memoryStore';
import { call } from './helpers/http';

const NOW = new Date('2026-11-08T10:00:00Z');
let store: MemoryStore;

const ADMIN = { id: 'admin-1', email: 'owner@cleanfry.co.il' };
const USER = { id: 'user-2', email: 'someone@example.com' };
const tokens: Record<string, typeof ADMIN> = { 'admin-token': ADMIN, 'user-token': USER };

const as = (token: string) => ({ authorization: `Bearer ${token}` });
const period = { from: '2026-11-01', to: '2026-11-08' };

beforeEach(() => {
  store = new MemoryStore(() => NOW);
  store.admins.add(ADMIN.id);
  setDepsForTests({
    store, verifier: noopVerifier, now: () => NOW, sendEmail: async () => {},
    getUserFromToken: async (token) => tokens[token] ?? null
  });
});

describe('admin authorization', () => {
  const endpoints = [
    ['coupons GET', adminCoupons, 'GET'],
    ['coupons POST', adminCoupons, 'POST'],
    ['coupons PATCH', adminCoupons, 'PATCH'],
    ['report', adminReport, 'GET'],
    ['payments', adminPayments, 'GET']
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
