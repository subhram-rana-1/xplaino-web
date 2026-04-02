import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllFolders } from '@/shared/services/folders.service';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';

function flattenFolders(folders: FolderWithSubFolders[]): FolderWithSubFolders[] {
  return folders.flatMap((f) => [f, ...flattenFolders(f.subFolders || [])]);
}

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
const AdminUserFeedbackPage = lazy(() => import('@/pages/Admin/AdminUserFeedbackPage').then((m) => ({ default: m.AdminUserFeedbackPage })));
const PricingAdd = lazy(() => import('@/pages/Admin/components/PricingAdd').then((m) => ({ default: m.PricingAdd })));
const PricingDetail = lazy(() => import('@/pages/Admin/components/PricingDetail').then((m) => ({ default: m.PricingDetail })));
const UserDashboard = lazy(() => import('@/pages/UserDashboard').then((m) => ({ default: m.UserDashboard })));
const FolderDetailLayout = lazy(() => import('@/pages/UserDashboard/FolderDetailLayout').then((m) => ({ default: m.FolderDetailLayout })));
const FolderPdfPage = lazy(() => import('@/pages/UserDashboard/FolderPdfPage').then((m) => ({ default: m.FolderPdfPage })));
const FolderWebpagePage = lazy(() => import('@/pages/UserDashboard/FolderWebpagePage/FolderWebpagePage').then((m) => ({ default: m.FolderWebpagePage })));
const FolderWordPage = lazy(() => import('@/pages/UserDashboard/FolderWordPage/FolderWordPage').then((m) => ({ default: m.FolderWordPage })));
const FolderImagePage = lazy(() => import('@/pages/UserDashboard/FolderImagePage/FolderImagePage').then((m) => ({ default: m.FolderImagePage })));
const PdfDetail = lazy(() => import('@/pages/PdfDetail').then((m) => ({ default: m.PdfDetail })));
const UserAccount = lazy(() => import('@/pages/UserAccount').then((m) => ({ default: m.UserAccount })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const PricingEdit = lazy(() => import('@/pages/Admin/components/PricingEdit').then((m) => ({ default: m.PricingEdit })));
const AdminIssueDetail = lazy(() => import('@/pages/Admin/components/AdminIssueDetail').then((m) => ({ default: m.AdminIssueDetail })));
const DomainEdit = lazy(() => import('@/pages/Admin/components/AdminDomains').then((m) => ({ default: m.DomainEdit })));
const CouponEdit = lazy(() => import('@/pages/Admin/components/AdminCoupons').then((m) => ({ default: m.CouponEdit })));
const ToolsPdfPage = lazy(() => import('@/pages/ToolsPdf').then((m) => ({ default: m.ToolsPdfPage })));
const FeatureLanding = lazy(() => import('@/pages/FeatureLanding').then((m) => ({ default: m.FeatureLanding })));

/**
 * ToolsPdfRoute - Renders ToolsPdfPage for guests.
 * For logged-in non-admin users: navigates to the most recently created folder's
 * PDF page and auto-opens the New PDF upload modal.
 */
const ToolsPdfRoute: React.FC = () => {
  const { isLoggedIn, user, isLoading, accessToken } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isLoading || !isLoggedIn || !accessToken || isAdmin) return;

    getAllFolders(accessToken)
      .then((res) => {
        const all = flattenFolders(res.folders);
        if (all.length === 0) {
          navigate('/user/dashboard', { replace: true });
          return;
        }
        const mostRecent = all.reduce((a, b) =>
          new Date(b.created_at) > new Date(a.created_at) ? b : a
        );
        navigate(`/user/dashboard/folder/${mostRecent.id}/pdf`, {
          replace: true,
          state: { autoOpenUpload: true },
        });
      })
      .catch(() => {
        navigate('/user/dashboard', { replace: true });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isLoggedIn, accessToken]);

  if (isLoading) return null;

  // Logged-in non-admin: navigation is handled by the effect above
  if (isLoggedIn && !isAdmin) return null;

  return <ToolsPdfPage />;
};

/**
 * AppContent - Inner component that uses useLocation for conditional rendering
 */
const AppContent: React.FC<{ showMiniCoupon: boolean; setShowMiniCoupon: (show: boolean) => void }> = ({ showMiniCoupon, setShowMiniCoupon }) => {
  const location = useLocation();
  const isPdfDetailPage = location.pathname.startsWith('/pdf/');
  const isGettingStartedPage = location.pathname === '/getting-started';
  const isHomePage = location.pathname === '/';
  const isFeaturePage = location.pathname.startsWith('/features/');

  // Pages where the discount bar and mini-coupon badge should be hidden
  const hideDiscount = isGettingStartedPage || isHomePage || isFeaturePage;

  return (
    <>
      {/* {!hideDiscount && <HighlightedCoupon onDismiss={() => setShowMiniCoupon(true)} />} */}
      <Navbar showMiniCoupon={false} />
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
                    <UserDashboard />
                  </UserProtectedRoute>
                } 
              />
              <Route 
                path="/user/dashboard/folder/:folderId" 
                element={
                  <UserProtectedRoute>
                    <FolderDetailLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<Navigate to="pdf" replace />} />
                <Route 
                  path="pdf" 
                  element={<FolderPdfPage />} 
                />
                <Route 
                  path="webpage" 
                  element={<FolderWebpagePage />} 
                />
                <Route 
                  path="word" 
                  element={<FolderWordPage />} 
                />
                <Route 
                  path="image" 
                  element={<FolderImagePage />} 
                />
              </Route>
              <Route 
                path="/pdf/:pdfId" 
                element={<PdfDetail />} 
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
                path="/user/account/custom-prompt" 
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
              <Route
                path="/admin/user-feedback"
                element={
                  <AdminProtectedRoute>
                    <AdminUserFeedbackPage />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/tools/pdf" element={<ToolsPdfRoute />} />
              {/* Feature landing pages */}
              <Route path="/features/chat-with-webpage" element={<FeatureLanding slug="chat-with-webpage" />} />
              <Route path="/features/web-highlighter-notes" element={<FeatureLanding slug="web-highlighter-notes" />} />
              <Route path="/features/chat-with-image" element={<FeatureLanding slug="chat-with-image" />} />
              <Route path="/features/web-bookmarks" element={<FeatureLanding slug="web-bookmarks" />} />
              <Route path="/features/knowledge-dashboard" element={<FeatureLanding slug="knowledge-dashboard" />} />
              <Route path="/features/chat-with-pdf" element={<FeatureLanding slug="chat-with-pdf" />} />
              <Route path="/features/pdf-highlighter-notes" element={<FeatureLanding slug="pdf-highlighter-notes" />} />
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

