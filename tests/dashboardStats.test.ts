import { describe, expect, it } from 'vitest';
import type { AdminOrder, OrdersResponse, ReportRow } from '../src/admin/adminApi';
import { activeCouponRows, couponSplit, deliverySplit, kpis, newestFirst, quantityDistribution, revenueByDay } from '../src/admin/dashboardStats';
import { tabFromPath } from '../src/admin/AdminTabs';

let n = 0;
function order(overrides: Partial<AdminOrder> = {}): AdminOrder {
  n += 1;
  return {
    id: `o${n}`, public_ref: `R${n}`, payment_status: 'paid', manually_confirmed: false,
    created_at: '2026-11-05T08:00:00Z', paid_at: '2026-11-05T08:00:00Z',
    customer_name: 'x', customer_phone: '050', delivery_method: 'delivery', pickup_location: null, shipping_city: 'חיפה',
    quantity: 2, products_agorot: 11800, discount_agorot: 0, shipping_agorot: 3500, total_agorot: 15300,
    coupon_code: null, commission_agorot: 0, ...overrides
  };
}

function row(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    coupon_id: 'c1', coupon_code: 'A', coupon_label: null, paid_orders: 1, applied_orders: 1, not_applied_orders: 0,
    units_sold: 2, product_sales_agorot: 10000, discounts_agorot: 1000, gross_collected_agorot: 13500,
    refunds_agorot: null, net_collected_agorot: null, ...overrides
  };
}

describe('dashboard stats', () => {
  it('groups revenue by Israeli day, fills empty days, and skips orders awaiting approval', () => {
    const orders = [
      order({ paid_at: '2026-11-05T22:30:00Z', total_agorot: 10000 }), // 00:30 ב-6.11 בישראל
      order({ paid_at: '2026-11-05T21:30:00Z', total_agorot: 5000 }), // 23:30 ב-5.11
      order({ payment_status: 'awaiting_verification', paid_at: null, created_at: '2026-11-05T10:00:00Z', total_agorot: 99999 })
    ];
    expect(revenueByDay(orders, '2026-11-04', '2026-11-06')).toEqual([
      { day: '2026-11-04', total_agorot: 0, orders: 0 },
      { day: '2026-11-05', total_agorot: 5000, orders: 1 },
      { day: '2026-11-06', total_agorot: 10000, orders: 1 }
    ]);
  });

  it('takes KPI totals straight from the orders summary', () => {
    const data: OrdersResponse = {
      orders: [],
      totals: { orders: 3, delivery_orders: 2, pickup_orders: 1, quantity: 7, products_agorot: 30000, shipping_agorot: 3500, total_agorot: 33500, commission_agorot: 4500 },
      pending: { orders: 1, total_agorot: 15100 }
    };
    expect(kpis(data, [row({ discounts_agorot: 1000 }), row({ coupon_id: null, discounts_agorot: 0 })])).toEqual({
      revenue_agorot: 33500, orders: 3, units: 7, average_agorot: 11167, discounts_agorot: 1000, commission_agorot: 4500
    });
    expect(kpis({ ...data, totals: { ...data.totals, orders: 0, total_agorot: 0 } }, []).average_agorot).toBe(0);
  });

  it('counts order sizes into the pack buckets', () => {
    const dist = quantityDistribution([order({ quantity: 1 }), order({ quantity: 10 }), order({ quantity: 10 }), order({ quantity: 7 }),
      order({ quantity: 3, payment_status: 'awaiting_verification' })]);
    expect(dist).toEqual([
      { label: '1', count: 1 }, { label: '2', count: 0 }, { label: '3', count: 0 }, { label: '4', count: 0 },
      { label: '5', count: 0 }, { label: '10', count: 2 }, { label: 'אחר', count: 1 }
    ]);
  });

  it('splits delivery vs pickup and coupon vs no coupon', () => {
    expect(deliverySplit([order(), order({ delivery_method: 'pickup', total_agorot: 5900 })])).toEqual({
      delivery: { orders: 1, total_agorot: 15300 }, pickup: { orders: 1, total_agorot: 5900 }
    });
    expect(couponSplit([row(), row({ coupon_id: 'c2', paid_orders: 2, gross_collected_agorot: 100 }), row({ coupon_id: null, paid_orders: 4, gross_collected_agorot: 50000 })])).toEqual({
      withCoupon: { orders: 3, total_agorot: 13600 }, without: { orders: 4, total_agorot: 50000 }
    });
  });

  it('lists only coupons with sales, with "no coupon" last', () => {
    const rows = [row({ coupon_id: null }), row({ coupon_id: 'idle', paid_orders: 0 }), row({ coupon_id: 'c1' })];
    expect(activeCouponRows(rows).map((r) => r.coupon_id)).toEqual(['c1', null]);
  });

  it('sorts orders newest first by payment time', () => {
    const a = order({ paid_at: '2026-11-01T10:00:00Z' });
    const b = order({ paid_at: null, created_at: '2026-11-03T10:00:00+00:00' });
    const c = order({ paid_at: '2026-11-02T10:00:00Z' });
    expect(newestFirst([a, b, c]).map((o) => o.id)).toEqual([b.id, c.id, a.id]);
  });
});

describe('admin tabs routing', () => {
  it('maps paths to tabs, defaulting to the dashboard', () => {
    expect(tabFromPath('/admin')).toBe('dashboard');
    expect(tabFromPath('/admin/')).toBe('dashboard');
    expect(tabFromPath('/admin/coupons')).toBe('coupons');
    expect(tabFromPath('/admin/coupons/')).toBe('coupons');
    expect(tabFromPath('/admin/influencers')).toBe('influencers');
    expect(tabFromPath('/admin/whatever')).toBe('dashboard');
  });
});
