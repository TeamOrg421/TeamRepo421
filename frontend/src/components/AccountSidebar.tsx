import React from 'react';

export type AccountPage = 'profile' | 'adminCars' | 'manager' | 'leaderboard' | 'watchlist' | 'seller' | 'settings';

interface AccountSidebarProps {
  currentPage: Exclude<AccountPage, 'profile'>;
  onNavigate: (page: AccountPage) => void;
}

const links: Array<{ page: AccountPage; label: string }> = [
  { page: 'profile', label: 'Profile' },
  { page: 'adminCars', label: 'Admin Panel' },
  { page: 'manager', label: 'Manager Dashboard' },
  { page: 'leaderboard', label: 'Leaderboard' },
  { page: 'watchlist', label: 'Watch List' },
  { page: 'seller', label: 'Seller Dashboard' },
  { page: 'settings', label: 'Settings' },
];

const AccountSidebar: React.FC<AccountSidebarProps> = ({ currentPage, onNavigate }) => (
  <aside className="account-sidebar" aria-label="Account navigation">
    {links.map((link) => (
      <button key={link.page} type="button" className={link.page === currentPage ? 'account-sidebar-link active' : 'account-sidebar-link'} aria-current={link.page === currentPage ? 'page' : undefined} onClick={() => onNavigate(link.page)}>
        {link.label}
      </button>
    ))}
  </aside>
);

export default AccountSidebar;
