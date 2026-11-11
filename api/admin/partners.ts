// API ניהול משפיעניות (מנהלים בלבד).
//   GET                 רשימת משפיעניות + הקופונים שלהן + סיכום מכירות ועמלה מצטבר
//   POST                { username, password, display_name, commission_percent, coupon_ids? }
//   PATCH ?id=<uuid>    { display_name?, commission_percent?, is_active?, password?, coupon_ids? }
// כל קופון שייך למשפיענית אחת לכל היותר. שינוי האחוז חל רק על הזמנות חדשות.
import { requireAdmin } from '../_lib/adminAuth.js';
import { validatePartnerCreate, validatePartnerPatch } from '../_lib/adminValidation.js';
import { couponState, type CouponRow } from '../_lib/coupons.js';
import { deps } from '../_lib/deps.js';
import { bodyObject, queryParam, type ApiRequest, type ApiResponse } from '../_lib/http.js';
import { partnerEmail } from '../_lib/partnerAuth.js';
import type { Actor, PartnerRow, Store } from '../_lib/store.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

class Conflict extends Error {}

/** מוודא שכל הקופונים קיימים ושאף אחד מהם לא שייך למשפיענית אחרת */
function checkCoupons(ids: string[], coupons: CouponRow[], partnerId: string | null, partners: PartnerRow[]) {
  for (const id of ids) {
    const coupon = coupons.find((c) => c.id === id);
    if (!coupon) throw new Conflict('אחד הקופונים שנבחרו לא נמצא');
    if (coupon.partner_id && coupon.partner_id !== partnerId) {
      const owner = partners.find((p) => p.id === coupon.partner_id);
      throw new Conflict(`הקופון ${coupon.code} כבר משויך ל${owner ? `-${owner.display_name}` : 'משפיענית אחרת'}. הסירו אותו ממנה קודם.`);
    }
  }
}

async function listPartnersView(store: Store, now: Date) {
  const [partners, coupons, totals] = await Promise.all([store.listPartners(), store.listCoupons(), store.partnerTotals()]);
  const totalsById = new Map(totals.map((t) => [t.partner_id, t]));
  return partners.map((p) => {
    const t = totalsById.get(p.id);
    return {
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      commission_percent: p.commission_percent,
      is_active: p.is_active,
      created_at: p.created_at,
      coupons: coupons
        .filter((c) => c.partner_id === p.id)
        .map((c) => ({ id: c.id, code: c.code, discount_percent: c.discount_percent, state: couponState(c, now) })),
      totals: {
        orders_count: t?.orders_count ?? 0,
        units: t?.units ?? 0,
        sales_agorot: t?.sales_agorot ?? 0,
        commission_agorot: t?.commission_agorot ?? 0
      }
    };
  });
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { store, authAdmin, now } = deps();
  const actor: Actor = { id: admin.id, email: admin.email };

  try {
    if (req.method === 'GET') {
      res.status(200).json({ partners: await listPartnersView(store, now()) });
      return;
    }

    if (req.method === 'POST') {
      const input = validatePartnerCreate(bodyObject(req));
      if (input.ok === false) {
        res.status(400).json({ error: input.error });
        return;
      }
      const { username, password, display_name, commission_percent, coupon_ids } = input.value;
      if (await store.getPartnerByUsername(username)) {
        res.status(409).json({ error: 'שם המשתמש הזה כבר תפוס' });
        return;
      }
      const [coupons, partners] = await Promise.all([store.listCoupons(), store.listPartners()]);
      checkCoupons(coupon_ids, coupons, null, partners);

      const userId = await authAdmin.createUser(partnerEmail(username), password);
      const assigned: string[] = [];
      try {
        const partner = await store.createPartner({ user_id: userId, username, display_name, commission_percent }, actor);
        for (const couponId of coupon_ids) {
          await store.setCouponPartner(couponId, partner.id, actor);
          assigned.push(couponId);
        }
      } catch (error) {
        // לא משאירים משתמש חצי-מוגדר: מבטלים שיוכים ומוחקים את המשתמש (השורה ב-partners נמחקת איתו)
        for (const couponId of assigned) await store.setCouponPartner(couponId, null, actor).catch(() => {});
        await authAdmin.deleteUser(userId).catch(() => {});
        throw error;
      }
      const view = (await listPartnersView(store, now())).find((p) => p.username === username);
      res.status(201).json({ partner: view });
      return;
    }

    if (req.method === 'PATCH') {
      const id = queryParam(req, 'id');
      if (!UUID_PATTERN.test(id)) {
        res.status(400).json({ error: 'מזהה לא תקין' });
        return;
      }
      const partner = await store.getPartner(id);
      if (!partner) {
        res.status(404).json({ error: 'המשפיענית לא נמצאה' });
        return;
      }
      const patch = validatePartnerPatch(bodyObject(req));
      if (patch.ok === false) {
        res.status(400).json({ error: patch.error });
        return;
      }
      const { password, coupon_ids, ...fields } = patch.value;

      let toAssign: string[] = [];
      let toRemove: string[] = [];
      if (coupon_ids) {
        const [coupons, partners] = await Promise.all([store.listCoupons(), store.listPartners()]);
        checkCoupons(coupon_ids, coupons, partner.id, partners);
        const current = coupons.filter((c) => c.partner_id === partner.id).map((c) => c.id);
        toAssign = coupon_ids.filter((cid) => !current.includes(cid));
        toRemove = current.filter((cid) => !coupon_ids.includes(cid));
      }

      if (Object.keys(fields).length > 0) await store.updatePartner(partner.id, fields);
      if (password) await authAdmin.setPassword(partner.user_id, password);
      for (const couponId of toRemove) await store.setCouponPartner(couponId, null, actor);
      for (const couponId of toAssign) await store.setCouponPartner(couponId, partner.id, actor);

      const view = (await listPartnersView(store, now())).find((p) => p.id === partner.id);
      res.status(200).json({ partner: view });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error instanceof Conflict) {
      res.status(409).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : '';
    if (message === 'duplicate_user' || message.includes('duplicate key')) {
      res.status(409).json({ error: 'שם המשתמש הזה כבר תפוס' });
      return;
    }
    res.status(500).json({ error: 'שגיאת שרת, נסו שוב' });
  }
}
