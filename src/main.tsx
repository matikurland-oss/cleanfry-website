import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import ContactPage from './ContactPage.tsx';
import BlogPage from './BlogPage.tsx'; // ייבוא חדש
import BlogPostDetail from './BlogPostDetail.tsx'; // ייבוא חדש
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* דף הבית */}
        <Route path="/" element={<App />} />
        
        {/* דף צור קשר */}
        <Route path="/contact" element={<ContactPage />} />

        {/* דפי הבלוג של CleanFry */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPostDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
