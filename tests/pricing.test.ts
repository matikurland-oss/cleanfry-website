import { describe, expect, it } from 'vitest';
import { buildInvoiceLines, LIST_PRICE_AGOROT, priceOrder, tierFor, TIERS, type PriceInput } from '../shared/pricing';

const coupon = (discountPercent: number, stacks: boolean) => ({ discountPercent, stacks });
const total = (input: PriceInput) => priceOrder(input).totalAgorot / 100;

describe('tiers', () => {
  it('picks the tier by quantity', () => {
    expect([1, 2, 3, 4, 5, 6, 10].map((q) => tierFor(q).priceAgorot / 100)).toEqual([59, 59, 55, 55, 51, 51, 51]);
    expect([1, 2, 3, 4, 5].map((q) => tierFor(q).homeShippingAgorot / 100)).toEqual([35, 35, 19, 19, 0]);
  });

  it('the single-pack tier is the list price (the struck-through price is real)', () => {
    expect(tierFor(1).priceAgorot).toBe(LIST_PRICE_AGOROT);
    expect(TIERS.every((t) => t.priceAgorot <= LIST_PRICE_AGOROT)).toBe(true);
  });
});

describe('priceOrder – spec table, no coupon', () => {
  it.each([
    [1, 59, 35, 94, 59],
    [2, 118, 35, 153, 118],
    [3, 165, 19, 184, 165],
    [4, 220, 19, 239, 220],
    [5, 255, 0, 255, 255],
    [6, 306, 0, 306, 306],
    [10, 510, 0, 510, 510]
  ])('%i packs', (quantity, products, shipping, home, pickup) => {
    const p = priceOrder({ quantity, deliveryMethod: 'delivery', coupon: null });
    expect(p.productsAfterDiscountAgorot / 100).toBe(products);
    expect(p.shippingAgorot / 100).toBe(shipping);
    expect(p.totalAgorot / 100).toBe(home);
    expect(total({ quantity, deliveryMethod: 'pickup', coupon: null })).toBe(pickup);
  });
});

describe('priceOrder – 15% coupon, stacks = on', () => {
  it.each([
    [3, 140.25, 159.25],
    [4, 187, 206],
    [5, 216.75, 216.75],
    [10, 433.5, 433.5]
  ])('%i packs', (quantity, pickup, home) => {
    const p = priceOrder({ quantity, deliveryMethod: 'delivery', coupon: coupon(15, true) });
    expect(p.totalAgorot / 100).toBe(home);
    expect(p.couponApplied).toBe(true);
    expect(p.unitPriceAgorot).toBe(tierFor(quantity).priceAgorot);
    expect(total({ quantity, deliveryMethod: 'pickup', coupon: coupon(15, true) })).toBe(pickup);
  });

  it('3–4 packs ship for ₪19 with the coupon too (the coupon never touches shipping)', () => {
    expect([3, 4].map((q) => priceOrder({ quantity: q, deliveryMethod: 'delivery', coupon: coupon(15, true) }).shippingAgorot)).toEqual([1900, 1900]);
  });

  it('keeps free shipping for 5 packs', () => {
    expect(priceOrder({ quantity: 5, deliveryMethod: 'delivery', coupon: coupon(15, true) }).shippingAgorot).toBe(0);
  });
});

describe('priceOrder – 15% coupon, stacks = off', () => {
  it.each([
    [1, 50.15, 85.15],
    [3, 150.45, 169.45],
    [4, 200.6, 219.6],
    [5, 250.75, 250.75],
    [10, 501.5, 501.5]
  ])('%i packs', (quantity, pickup, home) => {
    const p = priceOrder({ quantity, deliveryMethod: 'delivery', coupon: coupon(15, false) });
    expect(p.totalAgorot / 100).toBe(home);
    expect(p.couponApplied).toBe(true);
    expect(p.unitPriceAgorot).toBe(LIST_PRICE_AGOROT);
    expect(total({ quantity, deliveryMethod: 'pickup', coupon: coupon(15, false) })).toBe(pickup);
  });

  it('shipping follows quantity, not the coupon', () => {
    expect(priceOrder({ quantity: 3, deliveryMethod: 'delivery', coupon: coupon(15, false) }).shippingAgorot).toBe(1900);
  });

  it('a 5% coupon is not applied on 5 packs because the tier is cheaper', () => {
    const p = priceOrder({ quantity: 5, deliveryMethod: 'delivery', coupon: coupon(5, false) });
    expect(p).toMatchObject({ couponApplied: false, discountAgorot: 0, unitPriceAgorot: 5100, totalAgorot: 25500 });
  });

  it('a 5% coupon still applies on 1 pack', () => {
    const p = priceOrder({ quantity: 1, deliveryMethod: 'pickup', coupon: coupon(5, false) });
    expect(p).toMatchObject({ couponApplied: true, totalAgorot: 5605 });
  });
});

describe('priceOrder – savings and struck-through price', () => {
  it('5 packs without a coupon saves ₪40 vs the list price', () => {
    const p = priceOrder({ quantity: 5, deliveryMethod: 'delivery', coupon: null });
    expect(p.listSubtotalAgorot).toBe(29500);
    expect(p.savedAgorot).toBe(4000);
  });

  it('list subtotals for the 3 / 5 / 10 pack cards', () => {
    expect([3, 5, 10].map((q) => priceOrder({ quantity: q, deliveryMethod: 'pickup', coupon: null }).listSubtotalAgorot / 100))
      .toEqual([177, 295, 590]);
    expect(priceOrder({ quantity: 1, deliveryMethod: 'pickup', coupon: null }).savedAgorot).toBe(0);
  });

  it('savings exclude shipping and include the coupon', () => {
    // 3 × 59 − 150.45 = 26.55
    expect(priceOrder({ quantity: 3, deliveryMethod: 'delivery', coupon: coupon(15, false) }).savedAgorot).toBe(2655);
  });
});

describe('priceOrder – validation and rounding', () => {
  it('rounds the discount to the agora, half up', () => {
    // 59 × 12.5% = 7.375 → 7.38
    expect(priceOrder({ quantity: 1, deliveryMethod: 'pickup', coupon: coupon(12.5, false) }).discountAgorot).toBe(738);
  });

  it('rejects invalid quantities and discounts', () => {
    expect(() => priceOrder({ quantity: 0, deliveryMethod: 'delivery', coupon: null })).toThrow();
    expect(() => priceOrder({ quantity: 11, deliveryMethod: 'delivery', coupon: null })).toThrow();
    expect(() => priceOrder({ quantity: 1.5, deliveryMethod: 'delivery', coupon: null })).toThrow();
    expect(() => priceOrder({ quantity: 1, deliveryMethod: 'delivery', coupon: coupon(100, true) })).toThrow();
    expect(() => priceOrder({ quantity: 1, deliveryMethod: 'delivery', coupon: coupon(-1, true) })).toThrow();
  });
});

describe('the coupon discounts products only, never shipping', () => {
  it('shipping is the same with or without a coupon, for every quantity, percent and stacking', () => {
    for (let q = 1; q <= 10; q++) {
      for (const method of ['delivery', 'pickup'] as const) {
        const plain = priceOrder({ quantity: q, deliveryMethod: method, coupon: null });
        expect(plain.shippingAgorot).toBe(method === 'pickup' ? 0 : tierFor(q).homeShippingAgorot);
        for (const pct of [5, 7, 7.77, 12.5, 13.33, 15, 18, 25]) {
          for (const stacks of [true, false]) {
            const p = priceOrder({ quantity: q, deliveryMethod: method, coupon: coupon(pct, stacks) });
            const label = `q=${q} pct=${pct} stacks=${stacks} ${method}`;
            expect(p.shippingAgorot, label).toBe(plain.shippingAgorot);
            // ההנחה לא עולה על האחוז מסכום המוצרים (מעוגל לאגורה)
            expect(p.discountAgorot, label).toBeLessThanOrEqual(Math.round(p.subtotalAgorot * pct / 100));
            expect(p.totalAgorot, label).toBe(p.subtotalAgorot - p.discountAgorot + p.shippingAgorot);
          }
        }
      }
    }
  });
});

describe('buildInvoiceLines', () => {
  it('line items sum exactly to the total, and the shipping line is exactly the shipping price', () => {
    for (let q = 1; q <= 10; q++) {
      for (const pct of [0, 5, 7, 7.77, 12.5, 13.33, 15, 18, 25]) {
        for (const stacks of [true, false]) {
          for (const method of ['delivery', 'pickup'] as const) {
            const p = priceOrder({ quantity: q, deliveryMethod: method, coupon: pct ? coupon(pct, stacks) : null });
            const lines = buildInvoiceLines(p, method, method === 'pickup' ? 'tel-aviv' : null, pct ? 'CODE' : null);
            const label = `q=${q} pct=${pct} stacks=${stacks} ${method}`;
            const sumAgorot = lines.reduce((s, l) => s + Math.round(l.product_price * 100) * l.product_quantity, 0);
            expect(sumAgorot, label).toBe(p.totalAgorot);
            const shippingLine = lines[lines.length - 1];
            expect(Math.round(shippingLine.product_price * 100), label).toBe(p.shippingAgorot);
            const productLines = lines.slice(0, -1);
            expect(productLines.reduce((s, l) => s + l.product_quantity, 0), label).toBe(q);
            expect(productLines.every((l) => l.product_price > 0 && l.product_quantity > 0), label).toBe(true);
          }
        }
      }
    }
  });

  it('splits the product line (not the shipping line) when the products total does not divide evenly', () => {
    let found = false;
    for (let q = 2; q <= 10 && !found; q++) {
      for (const pct of [12.5, 7.77, 13.33]) {
        const p = priceOrder({ quantity: q, deliveryMethod: 'delivery', coupon: coupon(pct, true) });
        if (p.productsAfterDiscountAgorot % q === 0) continue;
        const lines = buildInvoiceLines(p, 'delivery', null, 'CODE');
        expect(lines).toHaveLength(3);
        expect(lines[1].product_price - lines[0].product_price).toBeCloseTo(0.01, 5);
        expect(lines[0].product_name).toBe(lines[1].product_name);
        expect(lines[2].product_price).toBe(p.shippingAgorot / 100);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('shows the coupon code in the product name only when the coupon was applied', () => {
    const applied = priceOrder({ quantity: 2, deliveryMethod: 'delivery', coupon: coupon(10, true) });
    expect(buildInvoiceLines(applied, 'delivery', null, 'NOV26')[0].product_name).toBe('מארז CleanFry (קופון: NOV26)');
    expect(buildInvoiceLines(applied, 'delivery', null, 'NOV26')[1].product_name).toBe('דמי משלוח עד הבית');
    const notApplied = priceOrder({ quantity: 5, deliveryMethod: 'delivery', coupon: coupon(5, false) });
    expect(buildInvoiceLines(notApplied, 'delivery', null, 'SMALL5')[0].product_name).toBe('מארז CleanFry');
  });
});
