import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import ContactPage from './ContactPage.tsx';
import BlogPage from './BlogPage.tsx';
import BlogPostDetail from './BlogPostDetail.tsx';
import SuccessPage from './SuccessPage.tsx'; // השורה שחסרה לך!
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPostDetail />} />
        <Route path="/thanks" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
