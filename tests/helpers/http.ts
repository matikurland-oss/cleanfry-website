import type { ApiRequest, ApiResponse } from '../../api/_lib/http';

export interface CapturedResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

export async function call(
  handler: (req: ApiRequest, res: ApiResponse) => unknown,
  req: ApiRequest
): Promise<CapturedResponse> {
  const captured: CapturedResponse = { status: 200, body: undefined, headers: {} };
  const res: ApiResponse = {
    status(code) { captured.status = code; return res; },
    json(body) { captured.body = body; },
    setHeader(name, value) { captured.headers[name.toLowerCase()] = value; }
  };
  await handler({ headers: { 'x-forwarded-for': '203.0.113.1' }, ...req }, res);
  return captured;
}
