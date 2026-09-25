// כלי בדיקה ויזואלית מקומי: מצלם URL בכמה רוחבי מסך עם Playwright, ומדפיס שגיאות קונסולה.
// שימוש: npm run screenshot -- <url> [שם-קובץ]
// דוגמה: npm run screenshot -- http://localhost:3000/checkout checkout
import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('שימוש: npm run screenshot -- <url> [שם-קובץ]');
  process.exit(1);
}
const name = process.argv[3] || 'screenshot';

const viewports = [
  { label: 'desktop', width: 1440, height: 1400 },
  { label: 'tablet', width: 1180, height: 820 },
  { label: 'mobile', width: 375, height: 1600 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  const path = `${name}-${vp.label}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`${path}: saved. console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  await page.close();
}
await browser.close();
