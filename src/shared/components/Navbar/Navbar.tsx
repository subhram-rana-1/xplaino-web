import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import logoImage from '../../../assets/images/logo-white-removebg.png';
import { useAuth } from '@/shared/hooks/useAuth';
import { FiLogOut } from 'react-icons/fi';
import { LoginModal } from '@/shared/components/LoginModal';
import { Toast } from '@/shared/components/Toast';

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
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [loginModalActionText, setLoginModalActionText] = useState('access your dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { isLoggedIn, user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const pendingRouteRef = useRef<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsProfilePopoverOpen(false);
  };

  const handleProfileClick = () => {
    setIsProfilePopoverOpen(!isProfilePopoverOpen);
  };

  const handleMyDashboardClick = () => {
    if (!isLoggedIn) {
      setLoginModalActionText('access your dashboard');
      setIsModalClosing(false);
      setShowLoginModal(true);
    } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
      closeMenu();
    } else {
      navigate('/user/dashboard/bookmark');
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

  // Close login modal after successful login
  useEffect(() => {
    if (isLoggedIn && showLoginModal) {
      setIsModalClosing(true);
      setTimeout(() => {
        setShowLoginModal(false);
        setIsModalClosing(false);
        // Navigate to the original route if available, otherwise based on role
        if (pendingRouteRef.current) {
          const route = pendingRouteRef.current;
          pendingRouteRef.current = null;
          navigate(route);
        } else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/user/dashboard/bookmark');
        }
      }, 300);
    }
  }, [isLoggedIn, showLoginModal, user, navigate]);

  // Check if a route is active
  const isActiveRoute = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if dashboard is active
  const isDashboardActive = (): boolean => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return isActiveRoute('/admin/dashboard');
    }
    return isActiveRoute('/user/dashboard/bookmark') || isActiveRoute('/user/dashboard');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className={styles.brand}>
            <img 
              src={logoImage} 
              alt="Xplaino Logo" 
              className={styles.logo}
            />
            <span className={styles.brandName}>Xplaino</span>
          </Link>
          {showMiniCoupon && (
            <button
              type="button"
              className={styles.miniCouponBadge}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/pricing');
              }}
            >
              <span className={styles.miniCouponLabel}>Deal</span>
              <span className={styles.miniCouponText}>View offer</span>
            </button>
          )}
        </div>
        
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
        
        {!hideNavButtons && (
          <div className={styles.navCenter}>
            <div className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ''}`}>
              <button 
                className={`${styles.navLink} ${isDashboardActive() ? styles.navLinkActive : ''}`} 
                onClick={handleMyDashboardClick}
              >
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'Admin Dashboard' : 'My Dashboard'}
              </button>
              <Link 
                to="/pricing" 
                className={`${styles.navLink} ${isActiveRoute('/pricing') ? styles.navLinkActive : ''}`} 
                onClick={closeMenu}
              >
                Pricing
              </Link>
              <Link 
                to="/report-issue" 
                className={`${styles.navLink} ${isActiveRoute('/report-issue') ? styles.navLinkActive : ''}`} 
                onClick={handleReportIssueClick}
              >
                Report Issue
              </Link>
            </div>
          </div>
        )}
        
        <div className={styles.navRight}>
          {isLoggedIn ? (
            <div className={styles.userSection} ref={profilePopoverRef}>
              <div className={styles.nameContainer}>
                <span 
                  className={styles.welcomeText}
                  onClick={handleProfileClick}
                  style={{ cursor: 'pointer' }}
                >
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.name || 'User'}
                </span>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <span className={`${styles.adminBadge} ${user?.role === 'SUPER_ADMIN' ? styles.superAdminBadge : ''}`}>
                    {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </span>
                )}
              </div>
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User'} 
                  className={styles.profilePicture}
                  onClick={handleProfileClick}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className={styles.profilePicturePlaceholder}
                  onClick={handleProfileClick}
                >
                  {(user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <div className={`${styles.profilePopover} ${isProfilePopoverOpen ? styles.profilePopoverOpen : ''}`}>
                  {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? (
                    <>
                      <div 
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/admin/account');
                          setIsProfilePopoverOpen(false);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Account
                      </div>
                      <div 
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setIsProfilePopoverOpen(false);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Admin Dashboard
                      </div>
                      <button 
                        className={styles.popoverLogoutButton} 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <FiLogOut className={styles.logoutIcon} size={18} />
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
                        style={{ cursor: 'pointer' }}
                      >
                        Account
                      </div>
                      <div 
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/user/dashboard/bookmark');
                          setIsProfilePopoverOpen(false);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        Dashboard
                      </div>
                      <div 
                        className={styles.popoverItem}
                        onClick={() => {
                          navigate('/user/issues');
                          setIsProfilePopoverOpen(false);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        My Issues
                      </div>
                      <button 
                        className={styles.popoverLogoutButton} 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <FiLogOut className={styles.logoutIcon} size={18} />
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
              Login
            </button>
          )}
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

