import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePendingPurchase, track, trackPendingPurchase } from '../src/analytics';

const gtag = vi.fn();

beforeEach(() => {
  gtag.mockReset();
  const storage = new Map<string, string>();
  vi.stubGlobal('window', { gtag });
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key)
  });
});

describe('track', () => {
  it('sends a GA4 event through gtag', () => {
    track('coupon_apply', { success: true });
    expect(gtag).toHaveBeenCalledWith('event', 'coupon_apply', { success: true });
  });

  it('never throws when gtag is missing or broken', () => {
    vi.stubGlobal('window', {});
    expect(() => track('page_event')).not.toThrow();
    vi.stubGlobal('window', { gtag: () => { throw new Error('blocked'); } });
    expect(() => track('page_event')).not.toThrow();
  });
});

describe('pending purchase', () => {
  it('reports purchase once with the saved order details, not again on refresh', () => {
    savePendingPurchase({ transactionId: 'CF-123', value: 177, quantity: 3, coupon: 'NOV26', shipping: 0 });

    trackPendingPurchase();
    trackPendingPurchase();

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'purchase', expect.objectContaining({
      transaction_id: 'CF-123',
      currency: 'ILS',
      value: 177,
      coupon: 'NOV26',
      items: [expect.objectContaining({ item_id: 'cleanfry', quantity: 3 })]
    }));
  });

  it('reports nothing when no order was created in this session', () => {
    trackPendingPurchase();
    expect(gtag).not.toHaveBeenCalled();
  });
});
