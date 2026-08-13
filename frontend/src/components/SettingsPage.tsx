import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

type ThemeMode = 'dark' | 'light';

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (nextTheme: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update profile.');
      }

      updateUser({
        name: data?.name || name.trim(),
        email: data?.email || email.trim(),
      });
      setMessage('Changes saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account. Continue?');
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      const response = await apiCall('/users/me', { method: 'DELETE' });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Could not delete account.');
      }

      logout();
      onNavigate('home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-page">
        <div className="settings-card glass-panel">
          <div className="settings-header">
            <div>
              <p className="settings-eyebrow">Account</p>
              <h1>Settings</h1>
              <p>Sign in to manage your account preferences.</p>
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-description">You need to be signed in to change your theme, name, email, or delete your account.</p>
            <div className="settings-actions">
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>
                Sign In
              </button>
              <button type="button" className="btn" onClick={() => onNavigate('register')}>
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-card glass-panel">
        <div className="settings-header">
          <div>
            <p className="settings-eyebrow">Account Preferences</p>
            <h1>Settings</h1>
            <p>Choose how the site looks and update your account details.</p>
          </div>
        </div>

        {message && <div className="settings-success">{message}</div>}
        {error && <div className="settings-error">{error}</div>}

        <form onSubmit={handleSave} className="settings-section">
          <h2>Appearance</h2>
          <p className="settings-description">Switch between a light and dark experience.</p>
          <div className="settings-theme-switcher">
            <button
              type="button"
              className={`settings-option-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              Dark
            </button>
            <button
              type="button"
              className={`settings-option-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              Light
            </button>
          </div>
        </form>

        <form onSubmit={handleSave} className="settings-section">
          <h2>Account Details</h2>
          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-name">Name</label>
            <input id="settings-name" className="settings-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-email">Email</label>
            <input id="settings-email" className="settings-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="settings-section settings-danger-section">
          <h2>Delete Account</h2>
          <p className="settings-description">This action deletes your account permanently and cannot be undone.</p>
          <button type="button" className="btn settings-danger-btn" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
