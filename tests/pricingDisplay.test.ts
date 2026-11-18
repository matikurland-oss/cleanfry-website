import { describe, expect, it } from 'vitest';
import { formatShekels, nextTierMessage } from '../src/pricingDisplay';

const off15 = { discountPercent: 15, stacks: false };
const on15 = { discountPercent: 15, stacks: true };

describe('formatShekels', () => {
  it('drops agorot only when whole', () => {
    expect([25500, 15925, 43350, 5015].map(formatShekels)).toEqual(['255', '159.25', '433.50', '50.15']);
  });
});

describe('nextTierMessage', () => {
  it('1–2 packs, home delivery', () => {
    expect(nextTierMessage(1, 'delivery', null)).toEqual({
      good: false, addQuantity: 2, text: 'הוסיפו 2 מארזים ותקבלו מחיר של ₪55 למארז ומשלוח ב-₪19 במקום ₪35'
    });
    expect(nextTierMessage(2, 'delivery', null).text).toBe('הוסיפו מארז אחד ותקבלו מחיר של ₪55 למארז ומשלוח ב-₪19 במקום ₪35');
  });

  it('3 packs, home delivery', () => {
    expect(nextTierMessage(3, 'delivery', null).text).toBe('הוסיפו 2 מארזים ותקבלו מחיר של ₪51 למארז ומשלוח חינם');
  });

  it('4 packs, home delivery: one more pack', () => {
    // 239 → 255: עוד ₪16
    expect(nextTierMessage(4, 'delivery', null).text).toBe('עוד מארז אחד ב-₪16 בלבד: ₪51 למארז ומשלוח חינם (₪255 במקום ₪239)');
  });

  it('4 packs with a stacking coupon uses the prices after the coupon', () => {
    // 206 → 216.75
    expect(nextTierMessage(4, 'delivery', on15).text)
      .toBe('עוד מארז אחד ב-₪10.75 בלבד: ₪43.35 למארז ומשלוח חינם (₪216.75 במקום ₪206)');
  });

  it('without stacking the unit price does not drop, so only shipping is mentioned', () => {
    expect(nextTierMessage(3, 'delivery', off15).text).toBe('הוסיפו 2 מארזים ותקבלו משלוח חינם');
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
