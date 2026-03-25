import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useParams, Link, Outlet } from 'react-router-dom';
import { BookOpen, Globe, Type, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './FolderDetailLayout.module.css';
import { useAuth } from '@/shared/hooks/useAuth';
import { getAllFolders } from '@/shared/services/folders.service';
import type { FolderWithSubFolders } from '@/shared/types/folders.types';

const SIDEBAR_VISIBLE_KEY = 'xplaino-dashboard-sidebar-visible';

function getStoredSidebarVisible(): boolean {
  try {
    const stored = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

type FolderSection = 'pdf' | 'webpage' | 'word' | 'image';

/**
 * FolderDetailLayout - Layout for folder detail pages with BOOKMARKS/PDF sidebar.
 * Reads folderId from route params to build dynamic sidebar links.
 */
const findInTree = (folders: FolderWithSubFolders[], id: string): string | null => {
  for (const f of folders) {
    if (f.id === id) return f.name;
    const found = findInTree(f.subFolders || [], id);
    if (found) return found;
  }
  return null;
};

export const FolderDetailLayout: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const location = useLocation();
  const { accessToken } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(getStoredSidebarVisible);

  const nameFromState = (location.state as { folder?: { name?: string } } | null)?.folder?.name ?? null;
  const [resolvedFolderName, setResolvedFolderName] = useState<string | null>(nameFromState);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(sidebarVisible));
    } catch {
      // ignore
    }
  }, [sidebarVisible]);

  useEffect(() => {
    if (nameFromState || !folderId || !accessToken) return;
    getAllFolders(accessToken)
      .then((res) => {
        const name = findInTree(res.folders, folderId);
        if (name) setResolvedFolderName(name);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, accessToken]);

  const sidebarItems: {
    key: FolderSection;
    label: string;
    path: string;
    icon: React.ReactNode;
  }[] = useMemo(
    () => [
      {
        key: 'pdf',
        label: 'PDFs',
        path: `/user/dashboard/folder/${folderId}/pdf`,
        icon: <BookOpen />,
      },
      {
        key: 'webpage',
        label: 'Saved Webpages',
        path: `/user/dashboard/folder/${folderId}/webpage`,
        icon: <Globe />,
      },
      {
        key: 'word',
        label: 'Saved Words',
        path: `/user/dashboard/folder/${folderId}/word`,
        icon: <Type />,
      },
      {
        key: 'image',
        label: 'Saved Images',
        path: `/user/dashboard/folder/${folderId}/image`,
        icon: <Image />,
      },
    ],
    [folderId]
  );

  const activeSection = useMemo((): FolderSection => {
    const segment = location.pathname.split('/').pop() as FolderSection;
    const valid: FolderSection[] = ['pdf', 'webpage', 'word', 'image'];
    return valid.includes(segment) ? segment : 'pdf';
  }, [location.pathname]);

  return (
    <div className={styles.userDashboard}>
      <div className={`${styles.sidebar} ${!sidebarVisible ? styles.sidebarHidden : ''}`}>
        <h2 className={styles.sidebarTitle} title={resolvedFolderName ?? undefined}>
          {resolvedFolderName
            ? (resolvedFolderName.length > 11 ? `${resolvedFolderName.slice(0, 11)}...` : resolvedFolderName)
            : '...'}
        </h2>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`${styles.sidebarButton} ${activeSection === item.key ? styles.sidebarButtonActive : ''}`}
            >
              <span className={styles.sidebarButtonIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        type="button"
        className={`${styles.sidebarToggle} ${!sidebarVisible ? styles.sidebarToggleCollapsed : ''}`}
        onClick={() => setSidebarVisible((v) => !v)}
        title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarVisible ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

FolderDetailLayout.displayName = 'FolderDetailLayout';
