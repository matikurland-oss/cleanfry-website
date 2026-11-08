// הרשאת מנהל — נבדקת בכל בקשה ל-API הניהול. הדפדפן שולח את ה-JWT של Supabase Auth בכותרת
// Authorization (לא ב-cookie), ולכן אין חשיפה ל-CSRF: אתר זר לא יכול לצרף את הכותרת הזו.
import { deps, type AuthUser } from './deps.js';
import { header, noStore, type ApiRequest, type ApiResponse } from './http.js';

export async function requireAdmin(req: ApiRequest, res: ApiResponse): Promise<AuthUser | null> {
  noStore(res);
  const match = header(req, 'authorization').match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'נדרשת התחברות' });
    return null;
  }

  let user: AuthUser | null = null;
  try {
    user = await deps().getUserFromToken(match[1]);
  } catch {
    // תקלה בצד השרת (למשל הגדרות חסרות) — לא "לא מחובר", כדי שהממשק לא ינתק את המנהל
    res.status(503).json({ error: 'השרת לא מוגדר או לא זמין כרגע. נסו שוב מאוחר יותר.' });
    return null;
  }
  if (!user) {
    res.status(401).json({ error: 'נדרשת התחברות' });
    return null;
  }

  if (!(await deps().store.isAdmin(user.id))) {
    res.status(403).json({ error: 'אין הרשאת מנהל' });
    return null;
  }
  return user;
}
