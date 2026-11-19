import { describe, expect, it } from 'vitest';
import { priceOrder, type DeliveryMethod } from '../shared/pricing';
import { formatShekels, nextTierMessage, orderSavings, savingsText, shippingNote } from '../src/pricingDisplay';

const off15 = { discountPercent: 15, stacks: false };
const on15 = { discountPercent: 15, stacks: true };

describe('formatShekels', () => {
  it('drops agorot only when whole', () => {
    expect([25500, 15925, 43350, 5015].map(formatShekels)).toEqual(['255', '159.25', '433.50', '50.15']);
  });
});

describe('nextTierMessage', () => {
  it('1–2 packs, home delivery', () => {
    // מ-3 מארזים גם המשלוח יורד (₪35 → ₪19)
    expect(nextTierMessage(1, 'delivery', null)).toEqual({
      good: false, addQuantity: 2, text: 'הוסיפו 2 מארזים ותקבלו מחיר של ₪55 למארז ומשלוח ב-₪19 במקום ₪35'
    });
    expect(nextTierMessage(2, 'delivery', null).text).toBe('הוסיפו מארז אחד ותקבלו מחיר של ₪55 למארז ומשלוח ב-₪19 במקום ₪35');
  });

  it('3 packs, home delivery', () => {
    expect(nextTierMessage(3, 'delivery', null).text).toBe('הוסיפו 2 מארזים ותקבלו מחיר של ₪51 למארז ומשלוח חינם');
  });

  it('4 packs, home delivery: the fifth pack costs ₪16 more', () => {
    // 4 × 55 + 19 = 239 → 5 × 51 = 255
    expect(nextTierMessage(4, 'delivery', null).text).toBe('עוד מארז אחד ב-₪16 בלבד: ₪51 למארז ומשלוח חינם (₪255 במקום ₪239)');
  });

  it('4 packs with a stacking coupon', () => {
    // 187 + 19 = 206 → 216.75
    expect(nextTierMessage(4, 'delivery', on15).text)
      .toBe('עוד מארז אחד ב-₪10.75 בלבד: ₪43.35 למארז ומשלוח חינם (₪216.75 במקום ₪206)');
  });

  it('without stacking the unit price does not drop, so only shipping is mentioned', () => {
    expect(nextTierMessage(3, 'delivery', off15).text).toBe('הוסיפו 2 מארזים ותקבלו משלוח חינם');
    // 200.60 + 19 = 219.60 → 250.75
    expect(nextTierMessage(4, 'delivery', off15).text).toBe('עוד מארז אחד ב-₪31.15 בלבד ותקבלו משלוח חינם (₪250.75 במקום ₪219.60)');
  });

  it('without stacking and pickup there is nothing better: best price with the coupon', () => {
    expect(nextTierMessage(3, 'pickup', off15)).toMatchObject({ good: true, text: 'קיבלתם את המחיר הכי טוב עם הקופון' });
  });

  it('5+ packs', () => {
    expect(nextTierMessage(5, 'delivery', null)).toEqual({ good: true, addQuantity: 0, text: 'קיבלתם את המחיר הכי טוב: ₪51 למארז ומשלוח חינם' });
    expect(nextTierMessage(10, 'pickup', null).text).toBe('קיבלתם את המחיר הכי טוב: ₪51 למארז');
  });

  it('pickup does not mention shipping', () => {
    expect(nextTierMessage(1, 'pickup', null).text).toBe('הוסיפו 2 מארזים ותקבלו מחיר של ₪55 למארז');
    expect(nextTierMessage(4, 'pickup', null).text).toBe('הוסיפו מארז אחד ותקבלו מחיר של ₪51 למארז');
  });
});

describe('orderSavings / savingsText', () => {
  const savings = (quantity: number, method: DeliveryMethod, coupon: { discountPercent: number; stacks: boolean } | null = null) =>
    orderSavings(priceOrder({ quantity, deliveryMethod: method, coupon }), method);

  it.each([
    // כמות, אופן קבלה, מוצרים, משלוח, סה״כ
    [1, 'delivery', 0, 0, 0],
    [2, 'delivery', 0, 0, 0],
    [3, 'delivery', 12, 16, 28],
    [4, 'delivery', 16, 16, 32],
    [5, 'delivery', 40, 35, 75],
    [3, 'pickup', 12, 0, 12],
    [5, 'pickup', 40, 0, 40]
  ] as const)('%i packs, %s', (quantity, method, products, shipping, total) => {
    expect(savings(quantity, method)).toEqual({ productsAgorot: products * 100, shippingAgorot: shipping * 100, totalAgorot: total * 100 });
  });

  it('builds the summary line', () => {
    expect(savingsText(savings(3, 'delivery'))).toBe('סה״כ חסכתם ₪28 — ₪12 במוצרים ו־₪16 במשלוח');
    expect(savingsText(savings(5, 'delivery'))).toBe('סה״כ חסכתם ₪75 — ₪40 במוצרים ו־₪35 במשלוח');
    expect(savingsText(savings(3, 'pickup'))).toBe('סה״כ חסכתם ₪12 במוצרים');
    expect(savingsText(savings(1, 'delivery'))).toBe('');
  });

  it('with a coupon counts the net product price once', () => {
    // 3 מארזים, 15% עם כפל: 177 − 140.25 = 36.75 במוצרים + 16 במשלוח
    expect(savings(3, 'delivery', on15)).toEqual({ productsAgorot: 3675, shippingAgorot: 1600, totalAgorot: 5275 });
  });
});

describe('shippingNote', () => {
  it('is derived from the tiers', () => {
    expect(shippingNote()).toBe('מ-3 מארזים משלוח עד הבית ב-₪19, ומ-5 מארזים המשלוח עלינו. איסוף עצמי מתל אביב או מכפר סבא תמיד בחינם.');
  });
});
