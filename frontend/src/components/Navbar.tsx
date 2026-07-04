import React from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('home')}>
        <span style={{ fontSize: '22px' }}>🏎️</span>
        <span className="gradient-text-accent">Cars & Bids</span>
      </div>
      <div className="navbar-links">
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
      </div>
    </nav>
  );
};

export default Navbar;
