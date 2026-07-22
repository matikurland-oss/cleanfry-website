import { useEffect } from 'react';

const SITE_URL = 'https://www.cleanfry.co.il';
const DEFAULT_IMAGE = `${SITE_URL}/clean-share-v2.png`;

interface SEOOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

// מעדכן את ה-title ותגי ה-meta של הדף בכל ניווט, כדי שכל עמוד (כולל פוסטים בבלוג) יקבל
// כותרת ותיאור ייחודיים במקום לחלוק את אלה של דף הבית — חשוב הן לתצוגה בגוגל והן לשיתוף ברשתות.
export function useSEO({ title, description, path, image = DEFAULT_IMAGE }: SEOOptions) {
  useEffect(() => {
    const fullTitle = title.includes('CleanFry') ? title : `${title} | CleanFry`;
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setCanonical(url);
  }, [title, description, path, image]);
}
