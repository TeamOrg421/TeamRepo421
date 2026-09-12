import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export type AccountPage = 'profile' | 'adminCars' | 'manager' | 'leaderboard' | 'watchlist' | 'seller' | 'settings';

interface AccountSidebarProps {
  currentPage: Exclude<AccountPage, 'profile'>;
  onNavigate: (page: AccountPage) => void;
}

const links: Array<{ page: AccountPage; label: string; roles?: string[] }> = [
  { page: 'profile', label: 'Profile' },
  { page: 'adminCars', label: 'Admin Panel', roles: ['Admin'] },
  { page: 'manager', label: 'Manager Dashboard', roles: ['Admin', 'Moderator'] },
  { page: 'leaderboard', label: 'Leaderboard' },
  { page: 'watchlist', label: 'Watch List' },
  { page: 'seller', label: 'Seller Dashboard' },
  { page: 'settings', label: 'Settings' },
];

const AccountSidebar: React.FC<AccountSidebarProps> = ({ currentPage, onNavigate }) => {
  const { roles: userRoles } = useAuth();
  const visibleLinks = links.filter((link) => !link.roles || link.roles.some((role) => userRoles.includes(role)));

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      {visibleLinks.map((link) => (
        <button key={link.page} type="button" className={link.page === currentPage ? 'account-sidebar-link active' : 'account-sidebar-link'} aria-current={link.page === currentPage ? 'page' : undefined} onClick={() => onNavigate(link.page)}>
          {link.label}
        </button>
      ))}
    </aside>
  );
};

export default AccountSidebar;
