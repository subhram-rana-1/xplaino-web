import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from '@/shared/components/Navbar';
import { PageContent } from '@/shared/components/PageContent';
import { Footer } from '@/shared/components/Footer';
import { Home } from '@/pages/Home';
import { TermsAndConditions } from '@/pages/TermsAndConditions';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';

/**
 * App - Main application component with routing
 * 
 * @returns JSX element
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <PageContent>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<div>Contact page - Coming soon</div>} />
          <Route path="/forum" element={<div>Forum page - Coming soon</div>} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </PageContent>
      <Footer />
    </BrowserRouter>
  );
};

