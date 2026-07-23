import { next } from '@vercel/functions';
import { blogPosts } from './src/blogData';

// Vercel Routing Middleware: רץ ב-Edge לפני כל בקשה. בוטים של תצוגה מקדימה ברשתות חברתיות
// (WhatsApp/Facebook/Twitter וכו') לא מריצים JavaScript, ולכן תמיד רואים רק את ה-HTML הסטטי
// המקורי מ-index.html — ללא קשר לכך שהאתר מעדכן title/meta דינמית בצד הלקוח (ראה src/useSEO.ts).
// כאן מזריקים את ה-title/meta הנכונים בשרת רק עבור הבוטים האלה, כדי ששיתוף קישור לפוסט ספציפי
// בבלוג יציג תצוגה מקדימה נכונה במקום את הכותרת הגנרית של המוצר. משתמשים אמיתיים ו-Googlebot
// (שמריץ JS) ממשיכים לקבל את ה-SPA הרגיל ללא שינוי.
export const config = {
  matcher: ['/', '/blog', '/blog/:path*', '/contact', '/legal', '/shipping-policy', '/cancellation-policy', '/accessibility'],
};

const SOCIAL_BOT_UA = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Pinterest|Applebot/i;

const SITE_URL = 'https://www.cleanfry.co.il';
const DEFAULT_IMAGE = `${SITE_URL}/clean-share-v2.png`;

interface PageMeta {
  title: string;
  description: string;
  image?: string;
}

const STATIC_PAGES: Record<string, PageMeta> = {
  '/': {
    title: 'אבקה למיצוק שמן | ממצק שמן בישול מהיר - CleanFry',
    description: 'CleanFry היא אבקה למיצוק שמן צמחית ומהפכנית. ממצק שמן בישול שהופך שמן טיגון לגוש מוצק ב-20 דקות. פתרון נקי וירוק לשמירה על המטבח והניקוז. הזמינו עכשיו!'
  },
  '/blog': {
    title: 'הבלוג של CleanFry — טיפים לניקיון וטיפול בשמן בישול',
    description: 'מאמרים על טיפול נכון בשמן טיגון משומש, חיסכון בעלויות אינסטלציה וניקיון, וידידותיות לסביבה.'
  },
  '/contact': {
    title: 'צור קשר - CleanFry',
    description: 'יש לכם שאלה על CleanFry או על ההזמנה שלכם? צרו איתנו קשר ונחזור אליכם בהקדם.'
  },
  '/legal': {
    title: 'תקנון, תנאי שימוש ומדיניות פרטיות - CleanFry',
    description: 'תנאי השימוש באתר CleanFry, מדיניות הפרטיות ואזהרת הבטיחות למוצר.'
  },
  '/shipping-policy': {
    title: 'מדיניות משלוחים ואספקה - CleanFry',
    description: 'זמני אספקה, אזורי שילוח ותיאום המשלוח מול השליח - כל מה שצריך לדעת על משלוחי CleanFry.'
  },
  '/cancellation-policy': {
    title: 'מדיניות ביטולים והחזרות - CleanFry',
    description: 'מדיניות ביטולים והחזרות של CleanFry בהתאם לחוק הגנת הצרכן.'
  },
  '/accessibility': {
    title: 'הצהרת נגישות - CleanFry',
    description: 'הצהרת הנגישות של אתר CleanFry ואמצעי ההנגשה הזמינים בו.'
  }
};

function getMetaForPath(pathname: string): PageMeta | null {
  if (STATIC_PAGES[pathname]) return STATIC_PAGES[pathname];

  const blogMatch = pathname.match(/^\/blog\/(.+)$/);
  if (blogMatch) {
    const post = blogPosts.find((p) => p.id === blogMatch[1]);
    if (post) {
      return {
        title: post.title,
        description: post.excerpt,
        image: post.image ? `${SITE_URL}${post.image}` : undefined
      };
    }
  }
  return null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  if (!SOCIAL_BOT_UA.test(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const meta = getMetaForPath(url.pathname);
  if (!meta) {
    return next();
  }

  const indexResponse = await fetch(new URL('/index.html', url.origin));
  let html = await indexResponse.text();

  const title = escapeHtml(meta.title.includes('CleanFry') ? meta.title : `${meta.title} | CleanFry`);
  const description = escapeHtml(meta.description);
  const image = meta.image || DEFAULT_IMAGE;
  const pageUrl = `${SITE_URL}${url.pathname}`;

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/s, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/s, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/s, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/s, `$1${pageUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/s, `$1${image}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/s, `$1${image}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/s, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/s, `$1${description}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/s, `$1${image}$2`);

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
