// שרת פיתוח מקומי: מריץ את api/*.ts כ-HTTP handlers רגילים, כדי לעקוף באג תאימות של `vercel dev`
// מול ה-Vite הזה. הרצה: `npm run dev:api` (טוען .env.local אוטומטית - `vercel env pull` מושך אותו).
// יחד עם `DEV_API_PROXY=http://localhost:5210 npm run dev` (ב-vite.config.ts) מקבלים פרונט+API
// מקומיים מלאים, בלי לגעת ב-`vercel dev`.
import http from 'node:http';

const routes = {
  '/api/validate-coupon': (await import('../api/validate-coupon.ts')).default,
  '/api/create-order': (await import('../api/create-order.ts')).default,
  '/api/tranzila-notify': (await import('../api/tranzila-notify.ts')).default,
  '/api/cron/reconcile': (await import('../api/cron/reconcile.ts')).default,
  '/api/admin/coupons': (await import('../api/admin/coupons.ts')).default,
  '/api/admin/report': (await import('../api/admin/report.ts')).default,
  '/api/admin/payments': (await import('../api/admin/payments.ts')).default,
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const handler = routes[url.pathname];
  if (!handler) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  // כמו ב-Vercel: JSON או form-urlencoded (טרנזילה שולחת notify כטופס)
  let body = {};
  if ((req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(new URLSearchParams(rawBody));
  } else {
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      body = {};
    }
  }

  const vercelRes = {
    _status: 200,
    status(code) { this._status = code; return this; },
    setHeader(name, value) { res.setHeader(name, value); },
    json(payload) {
      res.statusCode = this._status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(payload));
    },
  };

  const headers = { ...req.headers, 'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress };
  await handler({ method: req.method, body, query: Object.fromEntries(url.searchParams), headers }, vercelRes);
});

const PORT = 5210;
server.listen(PORT, () => {
  console.log(`dev-api-server listening on http://localhost:${PORT}`);
});
