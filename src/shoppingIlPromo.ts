// תאריך סיום שיתוף הפעולה עם Shopping IL (קופון NOV26 ב-18% הנחה) - חייב להישאר מסונכרן
// עם expiresAt של קופון NOV26 ב-Vercel Edge Config. אחרי התאריך הזה הלוגו נעלם אוטומטית
// מכל המקומות באתר (הדר, פוטר, צ'קאאוט, פופאפ) בלי צורך בפריסה נוספת.
export const SHOPPING_IL_PROMO_END = new Date('2026-11-06T23:59:59+02:00');

export const isShoppingIlPromoActive = (): boolean => new Date() <= SHOPPING_IL_PROMO_END;
