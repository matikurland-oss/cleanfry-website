import { describe, expect, it } from 'vitest';
import { buildInvoiceLines, priceOrder } from '../shared/pricing';

// הפונקציה הקודמת מ-CheckoutPage (לפני המעבר לשרת), להשוואה שהכללים לא השתנו
function legacyTotal(quantity: number, fraction: number, method: 'delivery' | 'pickup') {
  const subtotal = 59 * quantity;
  const discount = Math.round(subtotal * fraction);
  const after = subtotal - discount;
  const shipping = method === 'pickup' ? 0 : after >= 199 ? 0 : 35;
  return { discount, total: Math.round(after + shipping) };
}

describe('priceOrder', () => {
  it('charges unit price plus shipping with no coupon', () => {
    const p = priceOrder({ quantity: 1, deliveryMethod: 'delivery', discountPercent: 0 });
    expect(p).toMatchObject({ subtotalAgorot: 5900, discountAgorot: 0, shippingAgorot: 3500, totalAgorot: 9400 });
  });

  it('applies discount to products only and checks free shipping after discount', () => {
    // 4×59=236, 18% → 42.48 → ₪42, 194 < 199 → משלוח בתשלום
    const p = priceOrder({ quantity: 4, deliveryMethod: 'delivery', discountPercent: 18 });
    expect(p).toMatchObject({ subtotalAgorot: 23600, discountAgorot: 4200, isFreeShipping: false, shippingAgorot: 3500, totalAgorot: 22900 });
  });

  it('gives free shipping when the discounted products reach the threshold', () => {
    const p = priceOrder({ quantity: 4, deliveryMethod: 'delivery', discountPercent: 10 });
    // 236 - 24 = 212 ≥ 199
    expect(p).toMatchObject({ discountAgorot: 2400, shippingAgorot: 0, totalAgorot: 21200 });
  });

  it('pickup is always free', () => {
    expect(priceOrder({ quantity: 1, deliveryMethod: 'pickup', discountPercent: 0 }).totalAgorot).toBe(5900);
  });

  it('rounds half a shekel up', () => {
    // 5×59=295, 10% = 29.5 → 30
    expect(priceOrder({ quantity: 5, deliveryMethod: 'pickup', discountPercent: 10 }).discountAgorot).toBe(3000);
  });

  it('matches the legacy browser calculation for every quantity, method and common discount', () => {
    for (let q = 1; q <= 10; q++) {
      for (const pct of [0, 5, 10, 12, 15, 18, 20, 25, 30, 50]) {
        for (const method of ['delivery', 'pickup'] as const) {
          const p = priceOrder({ quantity: q, deliveryMethod: method, discountPercent: pct });
          const legacy = legacyTotal(q, pct / 100, method);
          expect(p.discountAgorot, `q=${q} pct=${pct}`).toBe(legacy.discount * 100);
          expect(p.totalAgorot, `q=${q} pct=${pct} ${method}`).toBe(legacy.total * 100);
        }
      }
    }
  });

  it('rejects invalid quantities and discounts', () => {
    expect(() => priceOrder({ quantity: 0, deliveryMethod: 'delivery', discountPercent: 0 })).toThrow();
    expect(() => priceOrder({ quantity: 11, deliveryMethod: 'delivery', discountPercent: 0 })).toThrow();
    expect(() => priceOrder({ quantity: 1.5, deliveryMethod: 'delivery', discountPercent: 0 })).toThrow();
    expect(() => priceOrder({ quantity: 1, deliveryMethod: 'delivery', discountPercent: 100 })).toThrow();
    expect(() => priceOrder({ quantity: 1, deliveryMethod: 'delivery', discountPercent: -1 })).toThrow();
  });
});

describe('buildInvoiceLines', () => {
  it('line items always sum exactly to the total', () => {
    for (let q = 1; q <= 10; q++) {
      for (const pct of [0, 7, 13, 18, 33.33]) {
        for (const method of ['delivery', 'pickup'] as const) {
          const p = priceOrder({ quantity: q, deliveryMethod: method, discountPercent: pct });
          const lines = buildInvoiceLines(p, method, method === 'pickup' ? 'tel-aviv' : null, pct ? 'CODE' : null);
          const sumAgorot = lines.reduce((s, l) => s + Math.round(l.product_price * 100) * l.product_quantity, 0);
          expect(sumAgorot).toBe(p.totalAgorot);
          expect(lines[0].product_quantity).toBe(q);
        }
      }
    }
  });

  it('shows the coupon code in the product name only when a discount applies', () => {
    const p = priceOrder({ quantity: 2, deliveryMethod: 'delivery', discountPercent: 10 });
    expect(buildInvoiceLines(p, 'delivery', null, 'NOV26')[0].product_name).toBe('מארז CleanFry (קופון: NOV26)');
    expect(buildInvoiceLines(p, 'delivery', null, 'NOV26')[1].product_name).toBe('דמי משלוח עד הבית');
  });
});
