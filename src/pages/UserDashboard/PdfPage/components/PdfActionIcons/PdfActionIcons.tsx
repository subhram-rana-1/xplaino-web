import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Download, Share2, Users, MoreHorizontal } from 'lucide-react';
import styles from './PdfActionIcons.module.css';

export interface PdfActionIconsProps {
  onDelete: () => void;
  onBook: () => void;
  onDownload: () => void;
  onShare?: () => void;
  onManageSharing?: () => void;
  isVisible: boolean;
  canDownload?: boolean;
  className?: string;
}

const ANIMATION_MS = 150;

export const PdfActionIcons: React.FC<PdfActionIconsProps> = ({
  onDelete,
  onDownload,
  onShare,
  onManageSharing,
  canDownload = true,
  className = '',
}) => {
  // 'closed' | 'opening' | 'open' | 'closing'
  const [menuState, setMenuState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuOpen = menuState !== 'closed';

  const openMenu = () => {
    setMenuState('opening');
    requestAnimationFrame(() => setMenuState('open'));
  };

  const closeMenu = () => {
    setMenuState('closing');
    setTimeout(() => setMenuState('closed'), ANIMATION_MS);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuState === 'closed' || menuState === 'closing') openMenu();
    else closeMenu();
  };

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  const menuItems = [
    ...(onManageSharing ? [{
      label: 'Manage sharing',
      icon: <Users size={15} />,
      onClick: onManageSharing,
      className: styles.menuItemManage,
    }] : []),
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: onDelete,
      className: styles.menuItemDelete,
    },
  ];

  return (
    <div className={`${styles.actionIcons} ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Share — always visible */}
      {onShare && (
        <button
          className={styles.alwaysBtn}
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Share PDF"
          aria-label="Share PDF"
        >
          <Share2 size={16} />
        </button>
      )}

      {/* Download — always visible */}
      {canDownload && (
        <button
          className={styles.alwaysBtn}
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          title="Download"
          aria-label="Download"
        >
          <Download size={16} />
        </button>
      )}

      {/* 3-dot menu trigger */}
      <button
        ref={triggerRef}
        className={`${styles.moreBtn} ${menuOpen ? styles.moreBtnActive : ''}`}
        onClick={toggleMenu}
        title="More options"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal size={16} />
      </button>

      {menuState !== 'closed' && createPortal(
        (() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          const menuWidth = 160;
          return (
            <div
              ref={menuRef}
              className={`${styles.dropdownMenu} ${menuState === 'closing' ? styles.dropdownMenuClosing : ''}`}
              role="menu"
              style={rect ? {
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                left: `${rect.right - menuWidth}px`,
              } : undefined}
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  className={`${styles.menuItem} ${item.className}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    closeMenu();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
};

PdfActionIcons.displayName = 'PdfActionIcons';
