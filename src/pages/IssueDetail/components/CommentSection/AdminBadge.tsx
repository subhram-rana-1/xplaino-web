import React from 'react';
import styles from './AdminBadge.module.css';

interface AdminBadgeProps {
  role: 'ADMIN' | 'SUPER_ADMIN';
}

/**
 * AdminBadge - Badge component to display admin role
 */
export const AdminBadge: React.FC<AdminBadgeProps> = ({ role }) => {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const badgeClass = isSuperAdmin ? styles.superAdmin : styles.admin;
  const label = isSuperAdmin ? 'Super admin' : 'Admin';

  return (
    <div className={`${styles.badge} ${badgeClass}`}>
      {label}
    </div>
  );
};

AdminBadge.displayName = 'AdminBadge';

