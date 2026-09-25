// שרת פיתוח מקומי: מריץ את api/*.ts כ-HTTP handlers רגילים, כדי לעקוף באג תאימות של `vercel dev`
// מול ה-Vite הזה. הרצה: `npm run dev:api` (טוען .env.local אוטומטית - `vercel env pull` מושך אותו).
// יחד עם `DEV_API_PROXY=http://localhost:5210 npm run dev` (ב-vite.config.ts) מקבלים פרונט+API
// מקומיים מלאים, בלי לגעת ב-`vercel dev`.
import http from 'node:http';

const { default: validateCoupon } = await import('../api/validate-coupon.ts');
const { default: signOrder } = await import('../api/sign-order.ts');
const { default: tranzilaNotify } = await import('../api/tranzila-notify.ts');

const routes = {
  '/api/validate-coupon': validateCoupon,
  '/api/sign-order': signOrder,
  '/api/tranzila-notify': tranzilaNotify,
};

const server = http.createServer(async (req, res) => {
  const handler = routes[req.url];
  if (!handler) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    body = {};
  }

  const vercelRes = {
    _status: 200,
    status(code) { this._status = code; return this; },
    json(payload) {
      res.statusCode = this._status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
    },
  };

  await handler({ method: req.method, body }, vercelRes);
});

const PORT = 5210;
server.listen(PORT, () => {
  console.log(`dev-api-server listening on http://localhost:${PORT}`);
});
