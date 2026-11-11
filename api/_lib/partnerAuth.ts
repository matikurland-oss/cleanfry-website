// הרשאת משפיענית — נבדקת בכל בקשה ל-/api/partner/*. כמו requireAdmin: JWT של Supabase Auth בכותרת
// Authorization, ואז בדיקה שהמשתמש רשום כמשפיענית פעילה. מנהל שאינו משפיענית מקבל 403.
import { deps } from './deps.js';
import { header, noStore, type ApiRequest, type ApiResponse } from './http.js';
import type { PartnerRow } from './store.js';

/** דומיין האימייל הפנימי של משתמשות משפיעניות: "dana" → dana@partners.cleanfry.co.il */
export const PARTNER_EMAIL_DOMAIN = 'partners.cleanfry.co.il';

export const partnerEmail = (username: string) => `${username}@${PARTNER_EMAIL_DOMAIN}`;

export async function requirePartner(req: ApiRequest, res: ApiResponse): Promise<PartnerRow | null> {
  noStore(res);
  const match = header(req, 'authorization').match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'נדרשת התחברות' });
    return null;
  }

  try {
    const user = await deps().getUserFromToken(match[1]);
    if (!user) {
      res.status(401).json({ error: 'נדרשת התחברות' });
      return null;
    }
    const partner = await deps().store.getPartnerByUserId(user.id);
    if (!partner || !partner.is_active) {
      res.status(403).json({ error: 'אין גישה לאזור השותפות' });
      return null;
    }
    return partner;
  } catch {
    res.status(503).json({ error: 'השרת לא זמין כרגע. נסו שוב מאוחר יותר.' });
    return null;
  }
}
