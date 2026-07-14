import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = ['Auctions', 'Community', 'Events', 'About Us', 'Leaderboard'];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {isAuthenticated && (
            <span className="navbar-user">{user?.name || user?.email || 'User'}</span>
          )}
          {!isAuthenticated && (
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

          {/* Hamburger menu with dropdown */}
          <div className="navbar-hamburger-wrapper" ref={menuRef}>
            <button
              className={`navbar-icon-btn${menuOpen ? ' active' : ''}`}
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {menuOpen && (
              <div className="hamburger-dropdown">
                {isAuthenticated && (
                  <div className="hamburger-dropdown-user">
                    <span className="hamburger-user-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <span className="hamburger-user-name">{user?.name || user?.email || 'User'}</span>
                  </div>
                )}
                <button
                  className="hamburger-dropdown-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('profile'); }}
                >
                  Profile
                </button>
                <button
                  className="hamburger-dropdown-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('leaderboard'); }}
                >
                  Leaderboard
                </button>
                <button
                  className="hamburger-dropdown-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('watchlist'); }}
                >
                  Watch List
                </button>
                <button
                  className="hamburger-dropdown-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('seller'); }}
                >
                  Seller Dashboard
                </button>
                <button
                  className="hamburger-dropdown-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('settings'); }}
                >
                  Settings
                </button>
                {isAuthenticated && (
                  <button
                    className="hamburger-dropdown-item hamburger-signout"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      onNavigate('home');
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
