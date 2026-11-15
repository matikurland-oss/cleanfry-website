/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import CheckoutPage from './CheckoutPage';
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

const AdminApp = lazy(() => import('./admin/AdminApp'));
const PartnerApp = lazy(() => import('./partner/PartnerApp'));

// ייבוא הדפים הנוספים
import ContactPage from './ContactPage';
import LegalPage from './LegalPage';
import CancellationPage from './CancellationPage';
import BlogPage from './BlogPage';
import BlogPostDetail from './BlogPostDetail';
import SuccessPage from './SuccessPage';
import AccessibilityPage from './AccessibilityPage';
import OrderSuccessPage from './OrderSuccessPage'; // ◄ ייבוא דף התודה החדש של ההזמנות!
import CookieConsent from './CookieConsent';
import PromoPopup from './PromoPopup';
// דף הבית והמעטפת המשותפת (header, footer, פס הודעות) — ר' src/home
import HomePage from './home/HomePage';
import SiteHeader from './home/SiteHeader';
import SiteFooter from './home/SiteFooter';
import AnnouncementBar from './home/AnnouncementBar';

// --- רכיב עזר לגלילה לראש הדף במעבר בין נתיבים ---
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default function App() {
  const location = useLocation();

  // אזור הניהול מוצג בלי מעטפת האתר (תפריט, פופאפ, באנר עוגיות)
  if (location.pathname === '/admin' || location.pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={<p className="text-center mt-16 text-slate-500" dir="rtl">טוען...</p>}>
        <AdminApp />
      </Suspense>
    );
  }

  // אזור המשפיעניות — גם הוא בלי מעטפת האתר
  if (location.pathname === '/partner' || location.pathname.startsWith('/partner/')) {
    return (
      <Suspense fallback={<p className="text-center mt-16 text-slate-500" dir="rtl">טוען...</p>}>
        <PartnerApp />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="rtl">
      <ScrollToTop />
      <CookieConsent />
      <PromoPopup />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostDetail />} />
          <Route path="/thanks" element={<SuccessPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} /> {/* ◄ הנתיב החדש והייעודי להזמנות מוצלחות! */}
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/shipping-policy" element={<LegalPage />} /> 
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cancellation-policy" element={<CancellationPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
