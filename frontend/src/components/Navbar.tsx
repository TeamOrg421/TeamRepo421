import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/*
  Navbar
  - Displays different UI depending on authentication state from `useAuth()`.
  - Shows user's `name` or `email` when logged in and provides a logout button.
*/

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('home')}>
        <span style={{ fontSize: '22px' }}>🏎️</span>
        <span className="gradient-text-accent">Cars & Bids</span>
      </div>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <span style={{ color: '#fff', marginRight: '12px' }}>
              Привіт, {user?.name || user?.email || 'користувач'}
            </span>
            <button className="btn btn-secondary" onClick={() => { logout(); onNavigate('home') }}>
              Вийти
            </button>
          </>
        ) : (
          <>
        <button
          className={`btn btn-text ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
          style={currentPage === 'home' ? { color: 'var(--text-primary)', fontWeight: 600 } : {}}
        >
          Головна
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onNavigate('login')}
        >
          Увійти
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('register')}
        >
          Реєстрація
        </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
