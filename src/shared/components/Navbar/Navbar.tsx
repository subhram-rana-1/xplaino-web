import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logoImageLight from '../../../assets/images/xplaino-brand-white.png';
import logoImageDark from '../../../assets/images/xplaino-brand-white.png';
import chromeExtensionIcon from '../../../assets/images/google-chrome-icon.png';
import pdfToolIcon from '../../../assets/images/pdf.webp';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/hooks/ThemeContext';
import { Theme } from '@/shared/types/user-settings.types';
import { LogOut, User, LayoutGrid, AlertCircle, ChevronDown, X } from 'lucide-react';
import { LoginModal } from '@/shared/components/LoginModal';
import { Toast } from '@/shared/components/Toast';
import { WEBPAGE_FEATURES, PDF_FEATURES } from '@/config/features.config';

const EXT_PILL_DISMISSED_KEY = 'xplaino-ext-pill-dismissed';

interface NavbarProps {
  showMiniCoupon?: boolean;
  hideNavButtons?: boolean;
}

/**
 * Navbar - Main navigation component with logo, brand name, and navigation links
 * 
 * @returns JSX element
 */
export const Navbar: React.FC<NavbarProps> = ({ showMiniCoupon, hideNavButtons }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const featuresDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [loginModalActionText, setLoginModalActionText] = useState('access your dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { isLoggedIn, user, logout } = useAuth();
  const { theme } = useTheme();
  const logoImage = theme === Theme.DARK ? logoImageDark : logoImageLight;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const pendingRouteRef = useRef<string | null>(null);
  const [miniCouponDismissed, setMiniCouponDismissed] = useState(false);
  const isPdfPage = /^\/pdf\//.test(location.pathname);
  const [extensionPillDismissed, setExtensionPillDismissed] = useState(() => {
    try { return localStorage.getItem(EXT_PILL_DISMISSED_KEY) === 'true'; } catch { return false; }
  });

  const handleExtensionPillDismiss = () => {
    setExtensionPillDismissed(true);
    try { localStorage.setItem(EXT_PILL_DISMISSED_KEY, 'true'); } catch {}
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsProfilePopoverOpen(false);
    setIsToolsDropdownOpen(false);
    setIsFeaturesDropdownOpen(false);
  };

  const handleToolsExtensionClick = () => {
    window.open(
      'https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp',
      '_blank',
      'noopener,noreferrer'
    );
    closeMenu();
  };

  const handleToolsPdfClick = () => {
    if (isLoggedIn) {
      navigate('/user/dashboard');
    } else {
      navigate('/tools/pdf');
    }
    closeMenu();
  };

  const handleProfileClick = () => {
    setIsProfilePopoverOpen(!isProfilePopoverOpen);
  };

  const handleMyDashboardClick = () => {
    if (!isLoggedIn) {
      setLoginModalActionText('access your dashboard');
      // Set pending route to dashboard since user explicitly wants it
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        pendingRouteRef.current = '/admin/dashboard';
      } else {
        pendingRouteRef.current = '/user/dashboard';
      }
      setIsModalClosing(false);
      setShowLoginModal(true);
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
      closeMenu();
    } else {
      navigate('/user/dashboard');
      closeMenu();
    }
  };

  const handleReportIssueClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setLoginModalActionText('report an issue');
      setIsModalClosing(false);
      setShowLoginModal(true);
      closeMenu();
    } else {
      closeMenu();
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setToast({ message: 'Logged out successfully', type: 'success' });
      setIsProfilePopoverOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to logout. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(event.target as Node)
      ) {
        setIsProfilePopoverOpen(false);
      }
    };

    if (isProfilePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfilePopoverOpen]);

  // Check location state for login modal
  useEffect(() => {
    const locationState = location.state as { showLoginModal?: boolean; from?: string } | null;
    if (locationState?.showLoginModal && !isLoggedIn) {
      setLoginModalActionText('access this page');
      setIsModalClosing(false);
      setShowLoginModal(true);
      // Store the original route before clearing state
      if (locationState.from) {
        pendingRouteRef.current = locationState.from;
      }
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, isLoggedIn]);

  // Listen for loginRequired event from API client (e.g., when subscription APIs return LOGIN_REQUIRED)
  useEffect(() => {
    const handleLoginRequired = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      setLoginModalActionText(customEvent.detail?.message || 'continue');
      setIsModalClosing(false);
      setShowLoginModal(true);
    };

    window.addEventListener('loginRequired', handleLoginRequired);
    return () => {
      window.removeEventListener('loginRequired', handleLoginRequired);
    };
  }, []);

  // Close login modal after successful login
  useEffect(() => {
    if (isLoggedIn && showLoginModal) {
      setIsModalClosing(true);
      setTimeout(() => {
        setShowLoginModal(false);
        setIsModalClosing(false);
        // Only navigate if there's an explicit pending route
        if (pendingRouteRef.current) {
          const route = pendingRouteRef.current;
          pendingRouteRef.current = null;
          navigate(route);
        }
        // Otherwise, stay on current page (no navigation)
      }, 300);
    }
  }, [isLoggedIn, showLoginModal, navigate]);

  // Check if a route is active
  const isActiveRoute = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if dashboard is active
  const isDashboardActive = (): boolean => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return isActiveRoute('/admin/dashboard');
    }
    return isActiveRoute('/user/dashboard');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <img
            src={logoImage}
            alt="Xplaino Logo"
            className={styles.logo}
          />
        </Link>

        {isPdfPage && !extensionPillDismissed && (
          <div className={styles.extensionPill}>
            <button
              type="button"
              className={styles.extensionPillButton}
              onClick={handleToolsExtensionClick}
              aria-label="Try Xplaino Extension for free"
            >
              <img src={chromeExtensionIcon} alt="" aria-hidden className={styles.extensionPillIcon} />
              Try extension — Free
            </button>
            <span className={styles.extensionPillDivider} aria-hidden />
            <button
              type="button"
              className={styles.extensionPillDismiss}
              onClick={handleExtensionPillDismiss}
              aria-label="Dismiss"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {!hideNavButtons && (
          <div className={styles.navCenter}>
            {showMiniCoupon && !miniCouponDismissed && (
              <div className={styles.miniCouponPill}>
                <button
                  type="button"
                  className={styles.miniCouponBadge}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/pricing');
                  }}
                >
                  Limited offer 30% Off!
                </button>
                <span className={styles.miniCouponDivider} aria-hidden />
                <button
                  type="button"
                  className={styles.miniCouponDismiss}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMiniCouponDismissed(true);
                  }}
                  aria-label="Dismiss offer"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
              {/* Features mega-dropdown */}
              <div
                className={styles.dropdownContainer}
                ref={featuresDropdownRef}
                onMouseEnter={() => setIsFeaturesDropdownOpen(true)}
                onMouseLeave={() => setIsFeaturesDropdownOpen(false)}
              >
                <button
                  data-walkthrough="features-btn"
                  className={`${styles.navLink} ${styles.dropdownTrigger} ${isActiveRoute('/features') ? styles.navLinkActive : ''}`}
                  onClick={() => setIsFeaturesDropdownOpen((v) => !v)}
                >
                  Features
                  <ChevronDown
                    className={styles.dropdownChevron}
                    size={14}
                    style={{ transition: 'transform 0.2s ease', transform: isFeaturesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                <div className={`${styles.featuresDropdownMenu} ${isFeaturesDropdownOpen ? styles.dropdownMenuOpen : ''}`}>
                  <div className={styles.featuresDropdownGrid}>
                    <div className={styles.featuresDropdownSection}>
                      <span className={styles.featuresDropdownSectionLabel}>Webpage</span>
                      {WEBPAGE_FEATURES.map((feature) => (
                        <Link
                          key={feature.slug}
                          to={feature.route}
                          className={`${styles.dropdownItem} ${isActiveRoute(feature.route) ? styles.dropdownItemActive : ''}`}
                          onClick={closeMenu}
                        >
                          <span className={styles.dropdownItemContent}>
                            <span className={styles.dropdownItemTitle}>{feature.navTitle}</span>
                            <span className={styles.dropdownItemDesc}>{feature.navDescription}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className={styles.featuresDropdownSection}>
                      <span className={styles.featuresDropdownSectionLabel}>PDF</span>
                      {PDF_FEATURES.map((feature) => (
                        <Link
                          key={feature.slug}
                          to={feature.route}
                          className={`${styles.dropdownItem} ${isActiveRoute(feature.route) ? styles.dropdownItemActive : ''}`}
                          onClick={closeMenu}
                        >
                          <span className={styles.dropdownItemContent}>
                            <span className={styles.dropdownItemTitle}>{feature.navTitle}</span>
                            <span className={styles.dropdownItemDesc}>{feature.navDescription}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Tools dropdown */}
              <div
                className={styles.dropdownContainer}
                ref={toolsDropdownRef}
                onMouseEnter={() => setIsToolsDropdownOpen(true)}
                onMouseLeave={() => setIsToolsDropdownOpen(false)}
              >
                <button
                  className={`${styles.navLink} ${styles.dropdownTrigger} ${(isActiveRoute('/tools/pdf') || isActiveRoute('/user/dashboard')) ? styles.navLinkActive : ''}`}
                  onClick={() => setIsToolsDropdownOpen((v) => !v)}
                >
                  Tools
                  <ChevronDown
                    className={styles.dropdownChevron}
                    size={14}
                    style={{ transition: 'transform 0.2s ease', transform: isToolsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                <div className={`${styles.dropdownMenu} ${isToolsDropdownOpen ? styles.dropdownMenuOpen : ''}`}>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemButton}`}
                    onClick={handleToolsExtensionClick}
                  >
                    <img src={chromeExtensionIcon} alt="" aria-hidden className={styles.dropdownItemImgIcon} />
                    <span className={styles.dropdownItemContent}>
                      <span className={styles.dropdownItemTitle}>Extension</span>
                      <span className={styles.dropdownItemDesc}>Chat with webpages, Ask AI, Highlight text, Add Notes, Translate webpage to 50+ languages </span>
                    </span>
                  </button>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemButton}`}
                    onClick={handleToolsPdfClick}
                  >
                    <img src={pdfToolIcon} alt="" aria-hidden className={styles.dropdownItemImgIcon} />
                    <span className={styles.dropdownItemContent}>
                      <span className={styles.dropdownItemTitle}>Study PDF</span>
                      <span className={styles.dropdownItemDesc}>Chat with PDF, Ask AI, Highlight text, Add notes &amp; collaborate with teammates</span>
                    </span>
                  </button>
                </div>
              </div>
              <Link 
                to="/pricing" 
                className={`${styles.navLink} ${isActiveRoute('/pricing') ? styles.navLinkActive : ''}`} 
                onClick={closeMenu}
              >
                Pricing
              </Link>
              <div data-walkthrough="dashboard-report" className={styles.walkthroughGroup}>
                <button 
                  className={`${styles.navLink} ${isDashboardActive() ? styles.navLinkActive : ''}`} 
                  onClick={handleMyDashboardClick}
                >
                  {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'Admin Dashboard' : 'My Dashboard'}
                </button>
                <Link 
                  to="/report-issue" 
                  className={`${styles.navLink} ${isActiveRoute('/report-issue') ? styles.navLinkActive : ''}`} 
                  onClick={handleReportIssueClick}
                >
                  Report Issue
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={styles.navRight}>
          {isLoggedIn ? (
            <div className={styles.userSection} ref={profilePopoverRef}>
              <div 
                className={styles.profilePicturePlaceholder}
                onClick={handleProfileClick}
              >
                {(user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
              </div>
              <div className={`${styles.profilePopover} ${isProfilePopoverOpen ? styles.profilePopoverOpen : ''}`}>
                  <div className={styles.popoverHeader}>
                    <span className={styles.popoverHeaderName}>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.name || 'User'}
                    </span>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                      <span className={`${styles.popoverAdminBadge} ${user?.role === 'SUPER_ADMIN' ? styles.popoverSuperAdminBadge : ''}`}>
                        {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    )}
                  </div>
                  {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
                    <>
                      <div
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/admin/account');
                          setIsProfilePopoverOpen(false);
                        }}
                      >
                        <User className={styles.popoverItemIcon} size={16} />
                        Account
                      </div>
                      <div
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setIsProfilePopoverOpen(false);
                        }}
                      >
                        <LayoutGrid className={styles.popoverItemIcon} size={16} />
                        Admin Dashboard
                      </div>
                      <button
                        className={styles.popoverLogoutButton}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <LogOut className={styles.popoverItemIcon} size={16} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/user/account');
                          setIsProfilePopoverOpen(false);
                        }}
                      >
                        <User className={styles.popoverItemIcon} size={16} />
                        Account
                      </div>
                      <div
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/user/dashboard');
                          setIsProfilePopoverOpen(false);
                        }}
                      >
                        <LayoutGrid className={styles.popoverItemIcon} size={16} />
                        Dashboard
                      </div>
                      <div
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/user/issues');
                          setIsProfilePopoverOpen(false);
                        }}
                      >
                        <AlertCircle className={styles.popoverItemIcon} size={16} />
                        My Issues
                      </div>
                      <button
                        className={styles.popoverLogoutButton}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <LogOut className={styles.popoverItemIcon} size={16} />
                        Logout
                      </button>
                    </>
                  )}
              </div>
            </div>
          ) : (
            <button 
              className={styles.loginButton} 
              onClick={() => {
                setLoginModalActionText('access your account');
                setIsModalClosing(false);
                setShowLoginModal(true);
                closeMenu();
              }}
            >
              Sign in
            </button>
          )}

          <button 
            className={styles.menuToggle}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className={styles.hamburger}>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
              <span className={styles.line}></span>
            </span>
          </button>
        </div>
      </div>
      {(showLoginModal || isModalClosing) && (
        <>
          <div 
            className={`${styles.modalOverlay} ${isModalClosing ? styles.modalOverlayClosing : ''}`} 
            onClick={() => {
              setIsModalClosing(true);
              setTimeout(() => {
                setShowLoginModal(false);
                setIsModalClosing(false);
              }, 300);
            }} 
          />
          <div 
            className={`${styles.modalContainer} ${isModalClosing ? styles.modalContainerClosing : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <LoginModal 
              actionText={loginModalActionText}
              onClose={() => {
                setIsModalClosing(true);
                setTimeout(() => {
                  setShowLoginModal(false);
                  setIsModalClosing(false);
                }, 300);
              }}
            />
          </div>
        </>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </nav>
  );
};

Navbar.displayName = 'Navbar';

