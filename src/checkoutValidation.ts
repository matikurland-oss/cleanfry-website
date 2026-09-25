// אימות פורמט טלפון ישראלי: נייד (05X + 8 ספרות = 10 ספרות) או קווי (0 + קידומת חד-ספרתית + 7 ספרות = 9 ספרות).
// סובלני לרווחים, מקפים, ו-+972/972 בהתחלה.
export function isValidIsraeliPhone(value: string): boolean {
  const normalized = value.trim().replace(/[\s-]/g, '').replace(/^(\+972|972)/, '0');
  return /^05\d{8}$/.test(normalized) || /^0[2-489]\d{7}$/.test(normalized);
}
