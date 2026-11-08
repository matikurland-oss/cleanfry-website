import { beforeEach, describe, expect, it, vi } from 'vitest';
import createOrder from '../api/create-order';
import tranzilaNotify from '../api/tranzila-notify';
import reconcile from '../api/cron/reconcile';
import { setDepsForTests } from '../api/_lib/deps';
import { createOrderReference } from '../api/_lib/orderReference';
import { noopVerifier, parseTransactionSearch, type TranzilaVerifier, type VerifyResult } from '../api/_lib/tranzila';
import { MemoryStore } from './helpers/memoryStore';
import { call } from './helpers/http';

process.env.ORDER_SIGNING_SECRET = 'test-secret';
process.env.CRON_SECRET = 'cron-secret';

let now = new Date('2026-11-08T10:00:00Z');
let store: MemoryStore;
let sendEmail: ReturnType<typeof vi.fn<(order: unknown, options?: unknown) => Promise<void>>>;
let tranzilaTransactions: Map<string, VerifyResult>;

// מדמה את ה-API של טרנזילה: רק עסקאות שקיימות "אצלם" מאומתות
const fakeVerifier: TranzilaVerifier = {
  configured: true,
  async verify(index) {
    return tranzilaTransactions.get(index) ?? { kind: 'error', reason: 'transaction not found' };
  }
};

function useDeps(verifier: TranzilaVerifier = fakeVerifier) {
  setDepsForTests({ store, verifier, sendEmail, now: () => now });
}

beforeEach(() => {
  now = new Date('2026-11-08T10:00:00Z');
  store = new MemoryStore(() => now);
  sendEmail = vi.fn<(order: unknown, options?: unknown) => Promise<void>>(async () => {});
  tranzilaTransactions = new Map();
  useDeps();
});

async function placeOrder(coupon?: string) {
  const body: Record<string, unknown> = {
    quantity: 4, deliveryMethod: 'delivery', displayedTotal: coupon ? 229 : 236,
    name: 'ישראל', phone: '0501234567', email: 'a@b.co', city: 'חיפה', address: 'הנמל 1'
  };
  if (coupon) body.couponCode = coupon;
  const res = await call(createOrder, { method: 'POST', body });
  expect(res.status).toBe(200);
  return { order: store.orders.at(-1)!, remarks: res.body.payment.remarks as string, sum: res.body.payment.sum as number };
}

const notify = (body: Record<string, unknown>) => call(tranzilaNotify, { method: 'POST', body });

describe('tranzila-notify', () => {
  it('records a verified payment and attributes it to the right coupon', async () => {
    const coupon = store.addCoupon({ code: 'NOV26', discount_percent: 18 });
    const { order, remarks } = await placeOrder('NOV26');
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 22900, currency: 'ILS', remarks });

    const res = await notify({ Response: '000', index: '1001', sum: '229', currency: '1', remarks, ccno: '4580000000000000', myid: '123456789' });
    expect(res.body.outcome).toBe('recorded');

    const saved = await store.getOrder(order.id);
    expect(saved).toMatchObject({ payment_status: 'paid', coupon_id: coupon.id, paid_after_expiry: false });
    expect(saved!.confirmation_email_sent_at).not.toBeNull();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    // פרטי כרטיס ות"ז לא נשמרים
    expect(JSON.stringify(store.events)).not.toContain('4580000000000000');
    expect(JSON.stringify(store.events)).not.toContain('123456789');
  });

  it('does not mark a forged notify as paid (valid reference, no such transaction at Tranzila)', async () => {
    const { order, remarks } = await placeOrder();
    const res = await notify({ Response: '000', index: '999', sum: '236', remarks });
    expect(res.body.outcome).toBe('verification_failed');
    expect((await store.getOrder(order.id))!.payment_status).toBe('awaiting_verification');
    expect(store.payments).toHaveLength(0);
    // כשיש מפתחות והאימות נכשל — אין מייל (ה-notify לא מאומת); ההזמנה מופיעה בדשבורד בלבד
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a notify with a forged order reference', async () => {
    const { order } = await placeOrder();
    const forged = `${order.id}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks: forged });
    const res = await notify({ Response: '000', index: '1001', remarks: forged });
    expect(res.body.outcome).toBe('invalid_reference');
    expect((await store.getOrder(order.id))!.payment_status).toBe('pending');
  });

  it('without Tranzila API keys, keeps the order awaiting verification and does not count it', async () => {
    useDeps(noopVerifier);
    const { order, remarks } = await placeOrder();
    const res = await notify({ Response: '000', index: '1001', sum: '236', remarks });
    expect(res.body.outcome).toBe('unverified');
    expect((await store.getOrder(order.id))!.payment_status).toBe('awaiting_verification');
    expect(await store.couponReport()).toHaveLength(0);
  });

  it('without API keys notifies the owner once (flagged unverified), and still sends the confirmation once verified', async () => {
    useDeps(noopVerifier);
    const { order, remarks } = await placeOrder();
    await notify({ Response: '000', index: '1001', sum: '236', remarks });
    await notify({ Response: '000', index: '1001', sum: '236', remarks });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][1]).toEqual({ unverified: true });

    useDeps(fakeVerifier);
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    const paid = (await store.getOrder(order.id))!;
    expect(paid.payment_status).toBe('paid');
    expect(paid.confirmation_email_sent_at).not.toBeNull();
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[1][1]).toBeUndefined();
  });

  it('does not send the unverified notice when the notified sum differs from the order', async () => {
    useDeps(noopVerifier);
    const { remarks } = await placeOrder();
    await notify({ Response: '000', index: '1001', sum: '1', remarks });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('records declined attempts without marking the order', async () => {
    const { order, remarks } = await placeOrder();
    const res = await notify({ Response: '004', index: '1001', remarks });
    expect(res.body.outcome).toBe('declined');
    expect((await store.getOrder(order.id))!.payment_status).toBe('pending');
  });

  it('counts a duplicate or concurrent notify for the same transaction once', async () => {
    const { order, remarks } = await placeOrder();
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    const body = { Response: '000', index: '1001', sum: '236', remarks };
    const results = await Promise.all([notify(body), notify(body), notify(body)]);

    expect(results.map((r) => r.body.outcome).sort()).toEqual(['duplicate', 'duplicate', 'recorded']);
    expect(store.payments).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect((await store.getOrder(order.id))!.payment_status).toBe('paid');
    expect((await store.couponReport())[0].paid_orders).toBe(1);
  });

  it('flags an amount mismatch instead of counting it as paid', async () => {
    const { order, remarks } = await placeOrder();
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 100, currency: 'ILS', remarks });
    const res = await notify({ Response: '000', index: '1001', sum: '1', remarks });
    expect(res.body.outcome).toBe('amount_mismatch');
    expect((await store.getOrder(order.id))!.payment_status).toBe('amount_mismatch');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('records a payment that arrives after the 15 minute lock, flagged for review', async () => {
    const { order, remarks } = await placeOrder();
    now = new Date(now.getTime() + 20 * 60_000);
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    await notify({ Response: '000', index: '1001', remarks });
    expect(await store.getOrder(order.id)).toMatchObject({ payment_status: 'paid', paid_after_expiry: true });
  });

  it('returns a failure (not success) when the event cannot be stored, so nothing is silently lost', async () => {
    const { remarks } = await placeOrder();
    store.failNext.insertPaymentEvent = 1;
    const res = await notify({ Response: '000', index: '1001', remarks });
    expect(res.status).toBe(500);
  });

  it('recovers from a temporary storage failure through reconcile, without duplicates', async () => {
    const { order, remarks } = await placeOrder();
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    store.failNext.recordPayment = 1;

    const first = await notify({ Response: '000', index: '1001', remarks });
    expect(first.body.outcome).toBe('queued_for_retry');
    expect((await store.getOrder(order.id))!.payment_status).toBe('pending');

    const cron = await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect(cron.body.events).toBe(1);
    expect((await store.getOrder(order.id))!.payment_status).toBe('paid');

    // notify חוזר מטרנזילה אחרי ההתאוששות
    await notify({ Response: '000', index: '1001', remarks });
    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect(store.payments).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('keeps the purchase when the confirmation email fails, and retries it without a new purchase', async () => {
    const { order, remarks } = await placeOrder();
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    sendEmail.mockRejectedValueOnce(new Error('formspree down'));

    await notify({ Response: '000', index: '1001', remarks });
    expect(await store.getOrder(order.id)).toMatchObject({ payment_status: 'paid', confirmation_email_sent_at: null });

    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect((await store.getOrder(order.id))!.confirmation_email_sent_at).not.toBeNull();
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(store.payments).toHaveLength(1);
  });

  it('verifies events left awaiting verification once API keys are configured', async () => {
    useDeps(noopVerifier);
    const { order, remarks } = await placeOrder();
    await notify({ Response: '000', index: '1001', remarks });
    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect((await store.getOrder(order.id))!.payment_status).toBe('awaiting_verification');

    useDeps(fakeVerifier);
    tranzilaTransactions.set('1001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect((await store.getOrder(order.id))!.payment_status).toBe('paid');
  });

  it("does not let someone claim another customer's real transaction for their own order", async () => {
    const victim = await placeOrder();
    const attacker = await placeOrder();
    // עסקה אמיתית של הקורבן, באותו סכום, שמשויכת אצל טרנזילה להפניה של הקורבן
    tranzilaTransactions.set('2001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks: victim.remarks });

    const res = await notify({ Response: '000', index: '2001', remarks: attacker.remarks });
    expect(res.body.outcome).toBe('invalid_reference');
    expect((await store.getOrder(attacker.order.id))!.payment_status).toBe('pending');
    expect(store.payments).toHaveLength(0);

    // ה-notify האמיתי של הקורבן עדיין נרשם כרגיל
    expect((await notify({ Response: '000', index: '2001', remarks: victim.remarks })).body.outcome).toBe('recorded');
  });

  it('a flood of forged notifies for one order cannot starve retries of other orders', async () => {
    const flooded = await placeOrder();
    const real = await placeOrder();
    for (let i = 0; i < 70; i++) {
      await call(tranzilaNotify, { method: 'POST', body: { Response: '000', index: `9${i}`, remarks: flooded.remarks }, headers: { 'x-forwarded-for': `10.0.0.${i}` } });
    }
    // האירוע האמיתי נכשל זמנית ונכנס לתור
    tranzilaTransactions.set('3001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks: real.remarks });
    store.failNext.recordPayment = 1;
    await notify({ Response: '000', index: '3001', remarks: real.remarks });

    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect((await store.getOrder(real.order.id))!.payment_status).toBe('paid');
  });

  it('a real second charge on an already-paid order is still recorded on retry and flagged', async () => {
    const { order, remarks } = await placeOrder();
    tranzilaTransactions.set('4001', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    tranzilaTransactions.set('4002', { kind: 'verified', amountAgorot: 23600, currency: 'ILS', remarks });
    await notify({ Response: '000', index: '4001', remarks });

    store.failNext.recordPayment = 1;
    await notify({ Response: '000', index: '4002', remarks });
    expect(store.payments).toHaveLength(1);

    await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer cron-secret' } });
    expect(store.payments).toHaveLength(2);
    expect((await store.getOrder(order.id))!.duplicate_payment).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('rate limits the notify endpoint per IP', async () => {
    let last;
    for (let i = 0; i < 61; i++) last = await notify({ Response: '004', index: String(i), remarks: 'x' });
    expect(last!.status).toBe(429);
  });

  it('rejects reconcile calls without the cron secret', async () => {
    expect((await call(reconcile, { method: 'GET' })).status).toBe(401);
    expect((await call(reconcile, { method: 'GET', headers: { authorization: 'Bearer nope' } })).status).toBe(401);
  });
});

describe('parseTransactionSearch', () => {
  it('reads an approved transaction', () => {
    const body = { transactions: [{ index: 1001, processor_response_code: '000', amount: '229.00', currency_code: '1', remarks: 'ref.sig' }] };
    expect(parseTransactionSearch(body, '1001')).toEqual({ kind: 'verified', amountAgorot: 22900, currency: 'ILS', remarks: 'ref.sig' });
  });

  it('fails closed when the transaction carries no order reference', () => {
    const body = { transactions: [{ index: 1001, processor_response_code: '000', amount: '229.00', currency_code: '1' }] };
    expect(parseTransactionSearch(body, '1001').kind).toBe('error');
  });

  it('fails closed on an unknown shape or a missing transaction', () => {
    expect(parseTransactionSearch({ ok: true }, '1').kind).toBe('error');
    expect(parseTransactionSearch({ transactions: [] }, '1').kind).toBe('error');
    expect(parseTransactionSearch({ transactions: [{ index: 1, processor_response_code: '000' }] }, '1').kind).toBe('error');
  });

  it('reports declined transactions', () => {
    expect(parseTransactionSearch({ transactions: [{ index: 1, processor_response_code: '033' }] }, '1').kind).toBe('declined');
  });
});

describe('order reference', () => {
  it('round-trips and rejects tampering', async () => {
    const { parseOrderReference } = await import('../api/_lib/orderReference');
    const id = '11111111-2222-3333-4444-555555555555';
    const ref = createOrderReference(id);
    expect(parseOrderReference(ref)).toBe(id);
    expect(parseOrderReference(ref.replace('1111', '9999'))).toBeNull();
    expect(parseOrderReference('garbage')).toBeNull();
  });
});
