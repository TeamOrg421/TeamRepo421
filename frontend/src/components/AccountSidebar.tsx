import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export type AccountPage = 'profile' | 'adminCars' | 'manager' | 'leaderboard' | 'watchlist' | 'seller' | 'settings' | 'chats';

interface AccountSidebarProps {
  currentPage: AccountPage;
  onNavigate: (page: AccountPage) => void;
}

const links: Array<{ page: AccountPage; key: 'profile' | 'adminPanel' | 'managerDashboard' | 'leaderboard' | 'watchList' | 'sellerDashboard' | 'chats' | 'settings'; roles?: string[] }> = [
  { page: 'profile', key: 'profile' },
  { page: 'adminCars', key: 'adminPanel', roles: ['Admin'] },
  { page: 'manager', key: 'managerDashboard', roles: ['Admin', 'Moderator'] },
  { page: 'leaderboard', key: 'leaderboard' },
  { page: 'watchlist', key: 'watchList' },
  { page: 'seller', key: 'sellerDashboard' },
  { page: 'chats', key: 'chats' },
  { page: 'settings', key: 'settings' },
];

const AccountSidebar: React.FC<AccountSidebarProps> = ({ currentPage, onNavigate }) => {
  const { roles: userRoles } = useAuth();
  const { t } = useLanguage();
  const visibleLinks = links.filter((link) => !link.roles || link.roles.some((role) => userRoles.includes(role)));

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      {visibleLinks.map((link) => (
        <button key={link.page} type="button" className={link.page === currentPage ? 'account-sidebar-link active' : 'account-sidebar-link'} aria-current={link.page === currentPage ? 'page' : undefined} onClick={() => onNavigate(link.page)}>
          {t(link.key)}
        </button>
      ))}
    </aside>
  );
};

export default AccountSidebar;
