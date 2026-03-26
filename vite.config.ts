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
        hostname: 'https://cleanfry.co.il',
        generateRobotsTxt: false, // שינוי קריטי: מבטל את יצירת ה-robots.txt האוטומטית שגורמת לשגיאה
        dynamicRoutes: [
          '/',
          '/blog',
          '/contact',
          '/legal',
          '/accessibility'
        ]
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
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
