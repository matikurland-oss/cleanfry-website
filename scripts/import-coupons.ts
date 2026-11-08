// כלי ייבוא חד-פעמי: קופונים מ-Vercel Edge Config → מסד הנתונים.
//
//   npm run import-coupons -- --dry-run   בדיקה בלבד, לא כותב דבר
//   npm run import-coupons                ייבוא בפועל
//
// דורש ב-.env.local: EDGE_CONFIG, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// הפעלה חוזרת בטוחה: קוד שכבר קיים במסד הנתונים מדולג (לא נדרס ולא משוכפל).
import { createClient } from '@vercel/edge-config';
import { createSupabaseStore } from '../api/_lib/store.js';
import { planImport } from './couponImport.js';

const dryRun = process.argv.includes('--dry-run');

const connection = process.env.EDGE_CONFIG;
if (!connection) {
  console.error('חסר EDGE_CONFIG');
  process.exit(1);
}

const raw = await createClient(connection).get('coupons');
const plan = planImport(raw);
const store = dryRun && !process.env.SUPABASE_SERVICE_ROLE_KEY ? null : createSupabaseStore();

const created: string[] = [];
const existing: string[] = [];
const failed: string[] = [];

for (const coupon of plan.valid) {
  const label = `${coupon.code} (${coupon.discount_percent}%${coupon.expires_at ? `, תפוגה ${coupon.expires_at}` : ''})`;
  if (store && (await store.getCouponByCode(coupon.code))) {
    existing.push(label);
    continue;
  }
  if (dryRun) {
    created.push(label);
    continue;
  }
  try {
    await store!.createCoupon(coupon, { id: null, email: 'import:edge-config' }, 'import');
    created.push(label);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('duplicate key')) existing.push(label);
    else failed.push(`${label}: ${message}`);
  }
}

const section = (title: string, items: string[]) => {
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  - ${item}`);
};

console.log(dryRun ? '=== בדיקה מקדימה (לא נכתב דבר) ===' : '=== ייבוא ===');
section(dryRun ? 'ייווצרו' : 'נוצרו', created);
section('כבר קיימים — דולגו', existing);
section('לא תקינים — דולגו', plan.invalid.map((i) => `${i.code}: ${i.reason}`));
if (failed.length) section('נכשלו', failed);
if (dryRun && !store) console.log('\n(בלי SUPABASE_SERVICE_ROLE_KEY לא נבדק מה כבר קיים במסד הנתונים)');

process.exit(failed.length ? 1 : 0);
