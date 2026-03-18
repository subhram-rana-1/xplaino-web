import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Globe, Lock, Users, Link, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { PdfResponse } from '@/shared/types/pdf.types';
import type { ShareeItem } from '@/shared/types/folders.types';
import styles from './PdfShareModal.module.css';

interface PdfShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string) => Promise<void>;
  onMakePublic: () => Promise<PdfResponse>;
  onMakePrivate: () => Promise<PdfResponse>;
  title: string;
  accessLevel: 'PUBLIC' | 'PRIVATE';
  pdfId: string;
  /** Whether the current user is the PDF owner. Controls email section visibility and social share flow. */
  isOwner: boolean;
  sharees?: ShareeItem[];
  isLoadingSharees?: boolean;
  onUnshare?: (email: string) => Promise<void>;
  onFetchSharees?: () => Promise<void>;
}

type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'whatsapp';

const LinkedInIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WhatsAppIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; Icon: React.FC }[] = [
  { id: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { id: 'twitter', label: 'X', Icon: XIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
];

function buildSocialUrl(platform: SocialPlatform, pdfUrl: string): string {
  const encoded = encodeURIComponent(pdfUrl);
  const text = encodeURIComponent('Check out this PDF: ');
  switch (platform) {
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent('Check out this PDF: ' + pdfUrl)}`;
  }
}

// formatDate removed (people-with-access section removed)

export const PdfShareModal: React.FC<PdfShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  onMakePublic,
  onMakePrivate,
  title,
  accessLevel,
  pdfId,
  isOwner,
  onFetchSharees,
}) => {
  const [email, setEmail] = useState('');
  const [showSharees, setShowSharees] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const [localAccessLevel, setLocalAccessLevel] = useState<'PUBLIC' | 'PRIVATE'>(accessLevel);
  const [accessDropdownOpen, setAccessDropdownOpen] = useState(false);
  const accessDropdownRef = useRef<HTMLDivElement>(null);
  const accessTriggerRef = useRef<HTMLButtonElement>(null);
  const accessMenuRef = useRef<HTMLDivElement>(null);
  const [pendingPlatform, setPendingPlatform] = useState<SocialPlatform | null>(null);
  const [pendingCopyLink, setPendingCopyLink] = useState(false);
  const [isMakingPublic, setIsMakingPublic] = useState(false);
  const [makePublicError, setMakePublicError] = useState<string | null>(null);
  const [isMakingPrivate, setIsMakingPrivate] = useState(false);
  const [makePrivateError, setMakePrivateError] = useState<string | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showMakePublicHint, setShowMakePublicHint] = useState(false);
  const [isMakingPublicFromHint, setIsMakingPublicFromHint] = useState(false);

  // Close access dropdown on outside click
  useEffect(() => {
    if (!accessDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = accessTriggerRef.current?.contains(target);
      const insideMenu = accessMenuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setAccessDropdownOpen(false);
      }
    };
    // Use a small delay so the portal has time to mount and set accessMenuRef
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [accessDropdownOpen]);

  // Sync localAccessLevel when prop changes (e.g. modal re-opens for a different PDF)
  React.useEffect(() => {
    setLocalAccessLevel(accessLevel);
    setShowMakePublicHint(false);
  }, [accessLevel, isOpen]);

  if (!isOpen && !isClosing) return null;

  const pdfUrl = `${window.location.origin}/pdf/${pdfId}`;

  const openSocial = (platform: SocialPlatform) => {
    window.open(buildSocialUrl(platform, pdfUrl), '_blank', 'noopener,noreferrer');
  };

  const handleSocialClick = (platform: SocialPlatform) => {
    if (localAccessLevel === 'PUBLIC') {
      openSocial(platform);
    } else if (isOwner) {
      // Owner can make it public then share
      setPendingPlatform(platform);
      setMakePublicError(null);
    }
    // Non-owner + PRIVATE: buttons are disabled; click is a no-op
  };

  const handleMakePublicConfirm = async () => {
    if (!pendingPlatform && !pendingCopyLink) return;
    setIsMakingPublic(true);
    setMakePublicError(null);
    try {
      await onMakePublic();
      setLocalAccessLevel('PUBLIC');
      if (pendingPlatform) {
        const platform = pendingPlatform;
        setPendingPlatform(null);
        openSocial(platform);
      } else {
        setPendingCopyLink(false);
        await handleCopyLink();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to make PDF public';
      setMakePublicError(msg);
    } finally {
      setIsMakingPublic(false);
    }
  };

  const handleMakePublicCancel = () => {
    setPendingPlatform(null);
    setPendingCopyLink(false);
    setMakePublicError(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsEmailLoading(true);
      await onShare(trimmed);
      setEmailSuccess(`Shared successfully with ${trimmed}`);
      setEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share';
      if (message.toLowerCase().includes('already shared')) {
        setEmailError(`Already shared with ${trimmed}`);
      } else {
        setEmailError(message);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pdfUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = pdfUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    // Show make-public hint for owners when PDF is still private
    if (isOwner && localAccessLevel === 'PRIVATE') {
      setShowMakePublicHint(true);
    }
  };

  const handleMakePublicFromHint = async () => {
    setIsMakingPublicFromHint(true);
    try {
      await onMakePublic();
      setLocalAccessLevel('PUBLIC');
      setShowMakePublicHint(false);
    } catch {
      // keep hint visible so user can retry
    } finally {
      setIsMakingPublicFromHint(false);
    }
  };

  const handleMakePrivate = async () => {
    setIsMakingPrivate(true);
    setMakePrivateError(null);
    try {
      await onMakePrivate();
      setLocalAccessLevel('PRIVATE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to make PDF private';
      setMakePrivateError(msg);
    } finally {
      setIsMakingPrivate(false);
    }
  };

  const handleAccessLevelChange = async (level: 'PUBLIC' | 'PRIVATE') => {
    setAccessDropdownOpen(false);
    if (level === localAccessLevel) return;
    if (level === 'PUBLIC') {
      // If there's a pending social action use that flow, otherwise just make public
      setIsMakingPublic(true);
      setMakePublicError(null);
      try {
        await onMakePublic();
        setLocalAccessLevel('PUBLIC');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to make PDF public';
        setMakePublicError(msg);
      } finally {
        setIsMakingPublic(false);
      }
    } else {
      await handleMakePrivate();
    }
  };

  const handleClose = () => {
    if (isEmailLoading || isMakingPublic || isMakingPrivate) return;
    setIsClosing(true);
    setTimeout(() => {
      setEmail('');
      setEmailError(null);
      setEmailSuccess(null);
      setPendingPlatform(null);
      setPendingCopyLink(false);
      setMakePublicError(null);
      setMakePrivateError(null);
      setShowSharees(false);
      setShowMakePublicHint(false);
      setAccessDropdownOpen(false);
      setIsClosing(false);
      onClose();
    }, 300);
  };

  return (
    <>
    <div
      className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.modal} ${isClosing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            disabled={isEmailLoading || isMakingPublic || isMakingPrivate}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        {/* Email share section — owners only */}
        {isOwner && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Share via email</p>
            <form onSubmit={handleEmailSubmit} className={styles.emailForm}>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                    setEmailSuccess(null);
                  }}
                  className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                  placeholder="Enter email address"
                  disabled={isEmailLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isEmailLoading || !email.trim()}
                  aria-label="Share via email"
                >
                  <ArrowRight />
                </button>
              </div>
              {emailSuccess && (
                <div className={styles.successMessage}>{emailSuccess}</div>
              )}
              {emailError && (
                <div className={styles.errorMessage}>{emailError}</div>
              )}
            </form>

            {onFetchSharees && (
              <button
                type="button"
                className={styles.manageSharesBtn}
                onClick={async () => {
                  if (!showSharees) {
                    await onFetchSharees();
                  }
                  setShowSharees((v) => !v);
                }}
              >
                <Users size={14} />
                <span>{showSharees ? 'Hide shared list' : 'Manage shares'}</span>
                {showSharees ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            {/* Link preview row */}
            <button
              type="button"
              className={`${styles.linkPreviewRow} ${linkCopied ? styles.linkPreviewRowCopied : ''}`}
              onClick={handleCopyLink}
              title="Copy PDF link"
              aria-label="Copy PDF link"
            >
              <span className={styles.linkPreviewUrl}>{pdfUrl}</span>
              <span className={styles.linkPreviewCopyBtn}>
                {linkCopied ? <><Check size={13} /><span>Copied!</span></> : <><Link size={13} /><span>Copy link</span></>}
              </span>
            </button>

            {/* Make-public hint after copying a private PDF link */}
            {showMakePublicHint && localAccessLevel === 'PRIVATE' && (
              <>
                <div className={styles.makePublicHint}>
                  <span className={styles.makePublicHintText}>
                    Want anyone with this link to be able to view it? Make the PDF public.
                  </span>
                </div>
                <div className={styles.makePublicHintActions}>
                  <button
                    type="button"
                    className={styles.makePublicHintNo}
                    onClick={() => setShowMakePublicHint(false)}
                    disabled={isMakingPublicFromHint}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className={styles.makePublicHintYes}
                    onClick={handleMakePublicFromHint}
                    disabled={isMakingPublicFromHint}
                  >
                    {isMakingPublicFromHint ? 'Making public…' : 'Make public'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Link preview for non-owners */}
        {!isOwner && (
          <div className={styles.section} style={{paddingBottom: 0}}>
            <button
              type="button"
              className={`${styles.linkPreviewRow} ${linkCopied ? styles.linkPreviewRowCopied : ''}`}
              onClick={handleCopyLink}
              title="Copy PDF link"
              aria-label="Copy PDF link"
            >
              <span className={styles.linkPreviewUrl}>{pdfUrl}</span>
              <span className={styles.linkPreviewCopyBtn}>
                {linkCopied ? <><Check size={13} /><span>Copied!</span></> : <><Link size={13} /><span>Copy link</span></>}
              </span>
            </button>
          </div>
        )}

        {/* Access level — centered, sits between email and the "Share on public" divider */}
        {isOwner ? (
          <div className={styles.accessDropdownCenter} ref={accessDropdownRef}>
            <button
              ref={accessTriggerRef}
              type="button"
              className={styles.accessDropdownTrigger}
              onClick={() => setAccessDropdownOpen((v) => !v)}
              disabled={isMakingPublic || isMakingPrivate}
              aria-haspopup="listbox"
              aria-expanded={accessDropdownOpen}
            >
              {localAccessLevel === 'PRIVATE' ? (
                <><Lock size={14} /><span>Only people shared can access</span></>
              ) : (
                <><Globe size={14} /><span>Anyone with this link can view</span></>
              )}
              <ChevronDown size={14} className={`${styles.accessDropdownChevron} ${accessDropdownOpen ? styles.accessDropdownChevronOpen : ''}`} />
            </button>

            {accessDropdownOpen && (() => {
              const rect = accessTriggerRef.current?.getBoundingClientRect();
              const menuWidth = 280; // matches min-width in CSS
              return createPortal(
                <div
                  ref={accessMenuRef}
                  className={styles.accessDropdownMenu}
                  role="listbox"
                  style={rect ? {
                    position: 'fixed',
                    top: `${rect.bottom + 6}px`,
                    left: `${rect.left + rect.width / 2 - menuWidth / 2}px`,
                  } : undefined}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={localAccessLevel === 'PRIVATE'}
                    className={`${styles.accessDropdownOption} ${localAccessLevel === 'PRIVATE' ? styles.accessDropdownOptionActive : ''}`}
                    onClick={() => handleAccessLevelChange('PRIVATE')}
                  >
                    <div className={styles.accessDropdownOptionIcon}>
                      <Lock size={15} />
                    </div>
                    <div className={styles.accessDropdownOptionContent}>
                      <span className={styles.accessDropdownOptionLabel}>Only people shared can access</span>
                      <span className={styles.accessDropdownOptionDesc}>Only users you've shared with can view</span>
                    </div>
                    {localAccessLevel === 'PRIVATE' && <Check size={14} className={styles.accessDropdownOptionCheck} />}
                  </button>

                  <button
                    type="button"
                    role="option"
                    aria-selected={localAccessLevel === 'PUBLIC'}
                    className={`${styles.accessDropdownOption} ${localAccessLevel === 'PUBLIC' ? styles.accessDropdownOptionActive : ''}`}
                    onClick={() => handleAccessLevelChange('PUBLIC')}
                  >
                    <div className={styles.accessDropdownOptionIcon}>
                      <Globe size={15} />
                    </div>
                    <div className={styles.accessDropdownOptionContent}>
                      <span className={styles.accessDropdownOptionLabel}>Anyone with this link can view</span>
                      <span className={styles.accessDropdownOptionDesc}>Anyone who has the link can access this PDF</span>
                    </div>
                    {localAccessLevel === 'PUBLIC' && <Check size={14} className={styles.accessDropdownOptionCheck} />}
                  </button>
                </div>,
                document.body
              );
            })()}
          </div>
        ) : (
          <div className={styles.accessBadgeCenter}>
            {localAccessLevel === 'PRIVATE' ? (
              <span className={styles.badgePrivate}>
                <Lock size={13} />
                Only people shared can access
              </span>
            ) : (
              <span className={styles.badgePublic}>
                <Globe size={13} />
                Anyone with this link can view
              </span>
            )}
          </div>
        )}

        {/* Divider above social share section */}
        <div className={styles.divider}>
          <span className={styles.dividerText}>Share on public</span>
        </div>

        {/* Social share section */}
        <div className={styles.section}>

          {(makePublicError || makePrivateError) && (
            <div className={styles.errorMessage}>{makePublicError || makePrivateError}</div>
          )}

          <div className={styles.socialButtons}>
            {SOCIAL_PLATFORMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`${styles.socialButton} ${styles[`social_${id}`]}`}
                onClick={() => handleSocialClick(id)}
                title={`Share on ${label}`}
                aria-label={`Share on ${label}`}
                disabled={isMakingPublic || isMakingPrivate || (!isOwner && localAccessLevel === 'PRIVATE')}
              >
                <Icon />
              </button>
            ))}
          </div>

          {/* Non-owner info message when PDF is still private */}
          {!isOwner && localAccessLevel === 'PRIVATE' && (
            <div className={styles.nonOwnerPrivateNote}>
              <Lock size={13} />
              <span>This PDF is private. Ask the owner to make it public before sharing on social media.</span>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* Make-public confirmation modal — rendered via portal so it sits above everything */}
    {isOwner && (pendingPlatform || pendingCopyLink) && createPortal(
      <div className={styles.confirmOverlay} onClick={handleMakePublicCancel}>
        <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmIconWrap}>
            <Globe size={28} />
          </div>
          <h3 className={styles.confirmTitle}>Make this PDF publicly accessible?</h3>
          <p className={styles.confirmBody}>
            This will allow <strong>anyone with the link</strong> to view this PDF (view only).
            You can make it private again at any time.
          </p>
          {makePublicError && (
            <div className={styles.errorMessage}>{makePublicError}</div>
          )}
          <div className={styles.confirmActions}>
            <button
              className={styles.makePublicCancelButton}
              onClick={handleMakePublicCancel}
              disabled={isMakingPublic}
            >
              Cancel
            </button>
            <button
              className={styles.makePublicConfirmButton}
              onClick={handleMakePublicConfirm}
              disabled={isMakingPublic}
            >
              {isMakingPublic ? 'Making public…' : 'OK, make public'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

PdfShareModal.displayName = 'PdfShareModal';
