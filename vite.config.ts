import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      Sitemap({
        // www. תואם ל-robots.txt ולתגי og:url הקיימים באתר, כדי שלא תהיה אי-התאמת דומיין קנונית
        hostname: 'https://www.cleanfry.co.il',
        generateRobotsTxt: false, // שינוי קריטי: מבטל את יצירת ה-robots.txt האוטומטית שגורמת לשגיאה
        // דפי גשר טכניים לחזרה מטרנזילה — לא תוכן שצריך להיות מסונדקס בגוגל
        exclude: ['/payment-success', '/payment-fail'],
        dynamicRoutes: [
          '/',
          '/blog',
          '/blog/cleanfry-savings',
          '/blog/how-to-dispose-cooking-oil',
          '/blog/when-to-replace-frying-oil',
          '/blog/what-to-do-with-oil-after-frying',
          '/contact',
          '/legal',
          '/shipping-policy',
          '/cancellation-policy',
          '/accessibility'
        ]
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
