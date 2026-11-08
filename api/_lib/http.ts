// טיפוסים ועזרים משותפים לפונקציות ה-API (תואמים לממשק ה-Node של Vercel ול-scripts/dev-api-server.mjs).
import crypto from 'node:crypto';

export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export function header(req: ApiRequest, name: string): string {
  const value = req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function queryParam(req: ApiRequest, name: string): string {
  const value = req.query?.[name];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function clientIp(req: ApiRequest): string {
  return header(req, 'x-forwarded-for').split(',')[0].trim() || header(req, 'x-real-ip') || 'unknown';
}

// מזהה הגבלת קצב: גיבוב של ה-IP, כדי לא לשמור כתובות IP גולמיות במסד הנתונים
export function rateLimitKey(scope: string, req: ApiRequest): string {
  return `${scope}:${crypto.createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 32)}`;
}

export function noStore(res: ApiResponse): void {
  res.setHeader('Cache-Control', 'no-store, private');
}

export function bodyObject(req: ApiRequest): Record<string, unknown> {
  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch {
      return Object.fromEntries(new URLSearchParams(body));
    }
  }
  return {};
}

export const str = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
