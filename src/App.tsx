import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from '@/shared/components/Navbar';
import { HighlightedCoupon } from '@/shared/components/HighlightedCoupon';
import { PageContent } from '@/shared/components/PageContent';
import { Footer } from '@/shared/components/Footer';
import { authConfig } from '@/config/auth.config';
import { AuthProvider } from '@/shared/hooks/AuthContext';
import { ThemeProvider } from '@/shared/hooks/ThemeContext';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminProtectedRoute } from '@/shared/components/AdminProtectedRoute';
import { UserProtectedRoute } from '@/shared/components/UserProtectedRoute';
import { SubscriptionRequiredModal } from '@/shared/components/SubscriptionRequiredModal';

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })));
const Contact = lazy(() => import('@/pages/Contact').then((m) => ({ default: m.Contact })));
const PreLaunch = lazy(() => import('@/pages/PreLaunch').then((m) => ({ default: m.PreLaunch })));
const GettingStarted = lazy(() => import('@/pages/GettingStarted').then((m) => ({ default: m.GettingStarted })));
const ReportIssue = lazy(() => import('@/pages/ReportIssue').then((m) => ({ default: m.ReportIssue })));
const Issues = lazy(() => import('@/pages/Issues').then((m) => ({ default: m.Issues })));
const IssueDetail = lazy(() => import('@/pages/IssueDetail').then((m) => ({ default: m.IssueDetail })));
const TermsAndConditions = lazy(() => import('@/pages/TermsAndConditions').then((m) => ({ default: m.TermsAndConditions })));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const RefundPolicy = lazy(() => import('@/pages/RefundPolicy').then((m) => ({ default: m.RefundPolicy })));
const UninstallFeedback = lazy(() => import('@/pages/UninstallFeedback').then((m) => ({ default: m.UninstallFeedback })));
const Pricing = lazy(() => import('@/pages/Pricing').then((m) => ({ default: m.Pricing })));
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess').then((m) => ({ default: m.PaymentSuccess })));
const AdminPricingPage = lazy(() => import('@/pages/Admin/AdminPricingPage').then((m) => ({ default: m.AdminPricingPage })));
const AdminTicketsPage = lazy(() => import('@/pages/Admin/AdminTicketsPage').then((m) => ({ default: m.AdminTicketsPage })));
const AdminDomainsPage = lazy(() => import('@/pages/Admin/AdminDomainsPage').then((m) => ({ default: m.AdminDomainsPage })));
const AdminCouponPage = lazy(() => import('@/pages/Admin/AdminCouponPage').then((m) => ({ default: m.AdminCouponPage })));
const PricingAdd = lazy(() => import('@/pages/Admin/components/PricingAdd').then((m) => ({ default: m.PricingAdd })));
const PricingDetail = lazy(() => import('@/pages/Admin/components/PricingDetail').then((m) => ({ default: m.PricingDetail })));
const UserDashboardLayout = lazy(() => import('@/pages/UserDashboard/UserDashboardLayout').then((m) => ({ default: m.UserDashboardLayout })));
const MyBookmarksPage = lazy(() => import('@/pages/UserDashboard/MyBookmarksPage').then((m) => ({ default: m.MyBookmarksPage })));
const PdfPage = lazy(() => import('@/pages/UserDashboard/PdfPage').then((m) => ({ default: m.PdfPage })));
const FolderBookmarkPage = lazy(() => import('@/pages/UserDashboard/FolderBookmarkPage').then((m) => ({ default: m.FolderBookmarkPage })));
const FolderPdfPage = lazy(() => import('@/pages/UserDashboard/FolderPdfPage').then((m) => ({ default: m.FolderPdfPage })));
const PdfDetail = lazy(() => import('@/pages/PdfDetail').then((m) => ({ default: m.PdfDetail })));
const UserAccount = lazy(() => import('@/pages/UserAccount').then((m) => ({ default: m.UserAccount })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const PricingEdit = lazy(() => import('@/pages/Admin/components/PricingEdit').then((m) => ({ default: m.PricingEdit })));
const AdminIssueDetail = lazy(() => import('@/pages/Admin/components/AdminIssueDetail').then((m) => ({ default: m.AdminIssueDetail })));
const DomainEdit = lazy(() => import('@/pages/Admin/components/AdminDomains').then((m) => ({ default: m.DomainEdit })));
const CouponEdit = lazy(() => import('@/pages/Admin/components/AdminCoupons').then((m) => ({ default: m.CouponEdit })));
const ToolsPdfPage = lazy(() => import('@/pages/ToolsPdf').then((m) => ({ default: m.ToolsPdfPage })));

/**
 * AppContent - Inner component that uses useLocation for conditional rendering
 */
const AppContent: React.FC<{ showMiniCoupon: boolean; setShowMiniCoupon: (show: boolean) => void }> = ({ showMiniCoupon, setShowMiniCoupon }) => {
  const location = useLocation();
  const isPdfDetailPage = location.pathname.startsWith('/pdf/');
  const isGettingStartedPage = location.pathname === '/getting-started';

  return (
    <>
      {!isGettingStartedPage && <HighlightedCoupon onDismiss={() => setShowMiniCoupon(true)} />}
      <Navbar showMiniCoupon={showMiniCoupon} hideNavButtons={isPdfDetailPage} />
      <PageContent>
            <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pre-launch" element={<PreLaunch />} />
              <Route path="/getting-started" element={<GettingStarted />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/contact-us" element={<Contact />} />
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
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/uninstall-extension-feedback" element={<UninstallFeedback />} />
              <Route 
                path="/user/dashboard" 
                element={
                  <UserProtectedRoute>
                    <Navigate to="/user/dashboard/bookmark" replace />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/dashboard/*" 
                element={
                  <UserProtectedRoute>
                    <UserDashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route 
                  path="bookmark" 
                  element={<MyBookmarksPage />} 
                />
                <Route 
                  path="bookmark/:folderId" 
                  element={<FolderBookmarkPage />} 
                />
                <Route 
                  path="pdf" 
                  element={<PdfPage />} 
                />
                <Route 
                  path="pdf/:folderId" 
                  element={<FolderPdfPage />} 
                />
              </Route>
              <Route 
                path="/pdf/:pdfId" 
                element={
                  <UserProtectedRoute>
                    <PdfDetail />
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
                path="/user/account/subscription" 
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
                path="/admin/pricing/add" 
                element={
                  <AdminProtectedRoute>
                    <PricingAdd />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/pricing/:pricingId" 
                element={
                  <AdminProtectedRoute>
                    <PricingDetail />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/pricing/:pricingId/edit" 
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
              <Route 
                path="/admin/coupon" 
                element={
                  <AdminProtectedRoute>
                    <AdminCouponPage />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/coupon/:couponId" 
                element={
                  <AdminProtectedRoute>
                    <CouponEdit />
                  </AdminProtectedRoute>
                } 
              />
              <Route path="/tools/pdf" element={<ToolsPdfPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </PageContent>
          {!isPdfDetailPage && <Footer />}
          <SubscriptionRequiredModal />
        </>
      );
    };

/**
 * App - Main application component with routing
 * 
 * @returns JSX element
 */
export const App: React.FC = () => {
  const [showMiniCoupon, setShowMiniCoupon] = useState(false);

  return (
    <GoogleOAuthProvider clientId={authConfig.googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <AppContent showMiniCoupon={showMiniCoupon} setShowMiniCoupon={setShowMiniCoupon} />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

