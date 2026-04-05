import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Download } from 'lucide-react';
import styles from './AdminUsers.module.css';
import { getAllUsers } from '@/shared/services/users.service';
import type { AdminUserResponse, GetAllUsersFilters } from '@/shared/types/users.types';
import { Toast } from '@/shared/components/Toast';
import { DropdownIcon } from '@/shared/components/DropdownIcon';

type RoleFilter = '' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';

const PAGE_SIZE = 50;

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const ROLE_BADGE_CLASS: Record<string, string> = {
  SUPER_ADMIN: 'roleSuperAdmin',
  ADMIN: 'roleAdmin',
  USER: 'roleUser',
};

interface AdminUsersProps {
  accessToken: string | null;
}

/**
 * AdminUsers - Admin user management component
 *
 * @returns JSX element
 */
export const AdminUsers: React.FC<AdminUsersProps> = ({ accessToken }) => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('USER');

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const fetchUsers = async (offset: number) => {
    if (!accessToken) {
      setToast({ message: 'Authentication required', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);

      const filters: GetAllUsersFilters = {
        offset,
        limit: PAGE_SIZE,
      };
      if (emailFilter.trim()) {
        filters.email = emailFilter.trim();
      }
      if (roleFilter) {
        filters.role = roleFilter;
      }

      const response = await getAllUsers(accessToken, filters);
      setUsers(response.users);
      setTotalCount(response.total);
      setHasNext(response.has_next);
      setCurrentOffset(offset);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetch = () => {
    setCurrentOffset(0);
    fetchUsers(0);
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, currentOffset - PAGE_SIZE);
    fetchUsers(newOffset);
  };

  const handleNext = () => {
    if (hasNext) {
      fetchUsers(currentOffset + PAGE_SIZE);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getDisplayName = (user: AdminUserResponse): string => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  const handleCopyEmails = async () => {
    const emails = users
      .map((u) => u.email)
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(emails);
      setToast({ message: `Copied ${users.filter((u) => u.email).length} emails to clipboard`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const handleDownloadCsv = () => {
    const header = 'SN,Email,First Name,Last Name';
    const rows = users.map((user, index) => {
      const sn = currentOffset + index + 1;
      const email = user.email ?? '';
      const firstName = user.first_name ?? '';
      const lastName = user.last_name ?? '';
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return `${sn},${escape(email)},${escape(firstName)},${escape(lastName)}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-page-${Math.floor(currentOffset / PAGE_SIZE) + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedRoleLabel =
    ROLE_OPTIONS.find((opt) => opt.value === roleFilter)?.label || 'All Roles';

  useEffect(() => {
    if (accessToken && !hasFetched) {
      fetchUsers(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.filterContainer}`)) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  return (
    <div className={styles.adminUsers}>
      <div className={styles.header}>
        <div className={styles.filters}>
          {/* Email Input */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Email</label>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="Enter user email..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            />
          </div>

          {/* Role Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Role</label>
            <div className={styles.filterContainer}>
              <button
                className={styles.filterButton}
                onClick={() => setIsRoleDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isRoleDropdownOpen}
              >
                <span>{selectedRoleLabel}</span>
                <DropdownIcon isOpen={isRoleDropdownOpen} />
              </button>
              {isRoleDropdownOpen && (
                <div className={styles.filterDropdown} role="listbox">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterOption} ${roleFilter === option.value ? styles.filterOptionSelected : ''}`}
                      onClick={() => {
                        setRoleFilter(option.value);
                        setIsRoleDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={roleFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          {hasFetched && users.length > 0 && (
            <>
              <button className={styles.actionButton} onClick={handleCopyEmails}>
                <Copy size={15} />
                <span>Copy Emails</span>
              </button>
              <button className={styles.actionButton} onClick={handleDownloadCsv}>
                <Download size={15} />
                <span>Download CSV</span>
              </button>
            </>
          )}
          <button className={styles.fetchButton} onClick={handleFetch} disabled={isLoading}>
            <span>{isLoading ? 'Fetching...' : 'Fetch'}</span>
          </button>
        </div>
      </div>

      {isLoading && <div className={styles.loading}>Loading users...</div>}

      {!isLoading && !hasFetched && (
        <div className={styles.initialState}>
          <h2 className={styles.initialHeading}>Fetch Users</h2>
          <p className={styles.initialMessage}>
            Use the filters above and click Fetch to load users.
          </p>
        </div>
      )}

      {!isLoading && hasFetched && users.length === 0 && (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyHeading}>No users found</h2>
          <p className={styles.emptyMessage}>
            No users match the current filters. Try adjusting your filters and fetch again.
          </p>
        </div>
      )}

      {!isLoading && hasFetched && users.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.thSn}`}>SN</th>
                  <th className={styles.th}>User</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Role</th>
                  <th className={styles.th}>Verified</th>
                  <th className={styles.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={styles.tr}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <td className={`${styles.td} ${styles.tdSn}`}>
                      <span className={styles.snNumber}>{currentOffset + index + 1}</span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt={getDisplayName(user)}
                            className={styles.avatar}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {(user.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                          </div>
                        )}
                        <span className={styles.userName}>{getDisplayName(user)}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.email}>{user.email ?? '—'}</span>
                    </td>
                    <td className={styles.td}>
                      {user.role ? (
                        <span
                          className={`${styles.roleBadge} ${styles[ROLE_BADGE_CLASS[user.role] ?? 'roleUser']}`}
                        >
                          {user.role.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className={styles.muted}>—</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.verifiedBadge} ${user.email_verified ? styles.verifiedYes : styles.verifiedNo}`}
                      >
                        {user.email_verified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.date}>{formatDate(user.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={handlePrevious}
              disabled={currentOffset === 0 || isLoading}
            >
              <ChevronLeft />
              <span>Previous</span>
            </button>
            <span className={styles.paginationInfo}>
              Showing {currentOffset + 1}–{Math.min(currentOffset + PAGE_SIZE, totalCount)} of{' '}
              {totalCount} users
            </span>
            <button
              className={styles.paginationButton}
              onClick={handleNext}
              disabled={!hasNext || isLoading}
            >
              <span>Next</span>
              <ChevronRight />
            </button>
          </div>
        </>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

AdminUsers.displayName = 'AdminUsers';
