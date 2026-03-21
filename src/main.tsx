import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import ContactPage from './ContactPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* דף הבית */}
        <Route path="/" element={<App />} />
        
        {/* דף צור קשר */}
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
