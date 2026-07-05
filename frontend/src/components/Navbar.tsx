import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');

  const navLinks = ['Auctions', 'Community', 'Events', 'About Us', 'Leaderboard'];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => onNavigate('home')}>
          <span className="brand-cars">Cars</span>
          <span className="brand-amp">&</span>
          <span className="brand-bids">Bids</span>
        </div>

        <div className="navbar-menu">
          {navLinks.map((item) => (
            <button key={item} className="navbar-menu-item" type="button">
              {item}
            </button>
          ))}
          <button
            className="btn-sell-car"
            type="button"
            onClick={() => onNavigate('register')}
          >
            Sell a Car
          </button>
        </div>

        <div className="navbar-search">
          <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search for cars (ex. BMW, Audi, Ford)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">{user?.name || user?.email || 'User'}</span>
              <button
                className="btn btn-signup"
                type="button"
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn btn-signup" type="button" onClick={() => onNavigate('register')}>
              Sign Up
            </button>
          )}
          <button className="navbar-icon-btn" type="button" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <button className="navbar-icon-btn" type="button" aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
