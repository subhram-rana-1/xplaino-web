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
import { Pricing } from '@/pages/Pricing';
import { AdminPricingPage } from '@/pages/Admin/AdminPricingPage';
import { AdminTicketsPage } from '@/pages/Admin/AdminTicketsPage';
import { AdminDomainsPage } from '@/pages/Admin/AdminDomainsPage';
import { UserDashboard } from '@/pages/UserDashboard';
import { FolderBookmark } from '@/pages/UserDashboard/FolderBookmark';
import { UserAccount } from '@/pages/UserAccount';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { PricingEdit } from '@/pages/Admin/components/PricingEdit';
import { AdminIssueDetail } from '@/pages/Admin/components/AdminIssueDetail';
import { DomainEdit } from '@/pages/Admin/components/AdminDomains';
import { authConfig } from '@/config/auth.config';
import { AuthProvider } from '@/shared/hooks/AuthContext';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminProtectedRoute } from '@/shared/components/AdminProtectedRoute';
import { UserProtectedRoute } from '@/shared/components/UserProtectedRoute';

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
              <Route path="/pricing" element={<Pricing />} />
              <Route 
                path="/contact-us" 
                element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/report-issue" 
                element={
                  <ProtectedRoute>
                    <ReportIssue />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user/issues" 
                element={
                  <ProtectedRoute>
                    <Issues />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/issue/:ticketId" 
                element={
                  <ProtectedRoute>
                    <IssueDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/terms-and-conditions" 
                element={
                  <ProtectedRoute>
                    <TermsAndConditions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/privacy-policy" 
                element={
                  <ProtectedRoute>
                    <PrivacyPolicy />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/refund-policy" 
                element={
                  <ProtectedRoute>
                    <RefundPolicy />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/user/dashboard" 
                element={
                  <UserProtectedRoute>
                    <UserDashboard />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/dashboard/bookmark/:folderId" 
                element={
                  <UserProtectedRoute>
                    <FolderBookmark />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/account" 
                element={
                  <UserProtectedRoute>
                    <Navigate to="/user/account/settings" replace />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/account/settings" 
                element={
                  <UserProtectedRoute>
                    <UserAccount />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/account/profile" 
                element={
                  <UserProtectedRoute>
                    <UserAccount />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/account" 
                element={
                  <AdminProtectedRoute>
                    <UserAccount />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <Navigate to="/admin/ticket" replace />
                } 
              />
              <Route 
                path="/admin/pricing" 
                element={
                  <AdminProtectedRoute>
                    <AdminPricingPage />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/pricing/:pricingId" 
                element={
                  <AdminProtectedRoute>
                    <PricingEdit />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/ticket" 
                element={
                  <AdminProtectedRoute>
                    <AdminTicketsPage />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/domain" 
                element={
                  <AdminProtectedRoute>
                    <AdminDomainsPage />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/issue/:ticketId" 
                element={
                  <AdminProtectedRoute>
                    <AdminIssueDetail />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/domain/:domainId" 
                element={
                  <AdminProtectedRoute>
                    <DomainEdit />
                  </AdminProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageContent>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

