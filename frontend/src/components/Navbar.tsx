import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

import VeyoLogo from './VeyoLogo';

interface NavbarProps {
  onNavigate: (page: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, searchValue, onSearchChange }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState(searchValue);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Auctions', page: 'home' },
    { label: 'Sell your car', page: isAuthenticated ? 'sellCar' : 'login' },
    { label: "What's VEYO?", page: 'mainpage' },
    { label: 'Leaderboard', page: 'leaderboard' },
  ];

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

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchChange(searchInput.trim());
    onNavigate('home');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => onNavigate('home')} title="VEYO">
          <VeyoLogo height={40} />
        </div>

        <div className="navbar-menu">
          {navLinks.map((item) => (
            <button key={item.label} className="navbar-menu-item" type="button" onClick={() => onNavigate(item.page)}>
              {item.label}
            </button>
          ))}
        </div>

        <form className="navbar-search" onSubmit={submitSearch} role="search">
          <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search for car or model"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
        </form>

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
                  className="hamburger-dropdown-item hamburger-admin-item"
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate('adminCars'); }}
                >
                  Admin Panel
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
