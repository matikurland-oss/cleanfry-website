import { describe, expect, it } from 'vitest';
import { planImport } from '../scripts/couponImport';
import { MemoryStore } from './helpers/memoryStore';

describe('planImport', () => {
  it('converts numeric and object coupons, preserving codes, discounts and expiry', () => {
    const plan = planImport({ WELCOME10: 0.1, nov26: { discount: 0.18, expiresAt: '2026-11-06T23:59:59+02:00' }, QUARTER: { discount: 0.25 } });
    expect(plan.invalid).toEqual([]);
    expect(plan.valid).toEqual([
      expect.objectContaining({ code: 'WELCOME10', discount_percent: 10, expires_at: null }),
      expect.objectContaining({ code: 'NOV26', discount_percent: 18, expires_at: '2026-11-06T21:59:59.000Z' }),
      expect.objectContaining({ code: 'QUARTER', discount_percent: 25 })
    ]);
  });

  it('reports invalid entries instead of guessing', () => {
    const plan = planImport({
      PERCENT: 18, ZERO: 0, NEG: -0.1, TEXT: '0.1', BADDATE: { discount: 0.1, expiresAt: 'tomorrow' },
      'HAS SPACE': 0.1, 'שלום': 0.1, NODISCOUNT: { expiresAt: '2026-01-01' }
    });
    expect(plan.valid).toEqual([]);
    expect(plan.invalid.map((i) => i.code).sort()).toEqual(['BADDATE', 'HAS SPACE', 'NEG', 'NODISCOUNT', 'PERCENT', 'TEXT', 'ZERO', 'שלום'].sort());
  });

  it('imports exactly 25% but reports anything above the cap', () => {
    const plan = planImport({ MAX: 0.25, TOOMUCH: 0.3 });
    expect(plan.valid.map((c) => c.code)).toEqual(['MAX']);
    expect(plan.invalid).toEqual([expect.objectContaining({ code: 'TOOMUCH' })]);
  });

  it('flags codes that collide after normalization', () => {
    const plan = planImport({ abc: 0.1, ABC: 0.2 });
    expect(plan.valid).toHaveLength(1);
    expect(plan.invalid).toHaveLength(1);
  });

  it('a repeated import does not duplicate coupons', async () => {
    const store = new MemoryStore();
    const plan = planImport({ A10: 0.1, B20: 0.2 });
    for (let run = 0; run < 2; run++) {
      for (const coupon of plan.valid) {
        if (!(await store.getCouponByCode(coupon.code))) await store.createCoupon(coupon, { id: '', email: 'import' });
      }
    }
    expect(store.coupons).toHaveLength(2);
  });
});
