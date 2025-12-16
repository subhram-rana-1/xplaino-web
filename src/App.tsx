import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from '@/shared/components/Navbar';
import { PageContent } from '@/shared/components/PageContent';
import { Footer } from '@/shared/components/Footer';
import { Home } from '@/pages/Home';
import { Contact } from '@/pages/Contact';
import { ReportIssue } from '@/pages/ReportIssue';
import { Issues } from '@/pages/Issues';
import { IssueDetail } from '@/pages/IssueDetail';
import { TermsAndConditions } from '@/pages/TermsAndConditions';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { RefundPolicy } from '@/pages/RefundPolicy';
import { MyWords } from '@/pages/MyLearnings/Words';
import { MyParagraphs } from '@/pages/MyLearnings/Paragraphs';
import { MyPages } from '@/pages/MyLearnings/Pages';
import { Login } from '@/pages/Login';
import { authConfig } from '@/config/auth.config';
import { AuthProvider } from '@/shared/hooks/AuthContext';

/**
 * App - Main application component with routing
 * 
 * @returns JSX element
 */
export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={authConfig.googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <PageContent>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/report-issue" element={<ReportIssue />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/issue/:ticketId" element={<IssueDetail />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/my-words" element={<MyWords />} />
              <Route path="/my-paragraphs" element={<MyParagraphs />} />
              <Route path="/my-pages" element={<MyPages />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageContent>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

