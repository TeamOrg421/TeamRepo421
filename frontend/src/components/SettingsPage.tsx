import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

interface AccountDetails {
  name: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
}

type ThemeMode = 'dark' | 'light';

const responseMessage = async (response: Response, fallback: string) => {
  const body = await response.json().catch(() => null);
  return body?.message || fallback;
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);

  const clearFeedback = () => {
    setMessage(null);
    setError(null);
  };

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAccount = async () => {
      try {
        const response = await apiCall('/users/me');
        if (!response.ok) return;

        const account = await response.json() as Partial<AccountDetails>;
        setName(account.name ?? user?.name ?? '');
        setEmail(account.email ?? user?.email ?? '');
        setPhoneNumber(account.phoneNumber ?? '');
        setEmailConfirmed(Boolean(account.emailConfirmed));
      } catch {
        // The page remains usable with the account data contained in the JWT.
      }
    };

    loadAccount();
  }, [isAuthenticated, user?.email, user?.name]);

  const applyTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setSavingProfile(true);
    try {
      const response = await apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!response.ok) throw new Error(await responseMessage(response, 'Failed to update account details.'));

      const account = await response.json() as Partial<AccountDetails>;
      const nextName = account.name ?? name.trim();
      const nextEmail = account.email ?? email.trim();
      setName(nextName);
      setEmail(nextEmail);
      setEmailConfirmed(Boolean(account.emailConfirmed));
      updateUser({ name: nextName, email: nextEmail });
      setMessage(account.emailConfirmed ? 'Account details saved.' : 'Account details saved. Confirm the email address to finish verification.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update account details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhoneSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setSavingPhone(true);

    try {
      const response = await apiCall('/users/me/phone', {
        method: 'PUT',
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Failed to save phone number.'));

      const data = await response.json();
      setPhoneNumber(data.phoneNumber ?? '');
      setMessage(phoneNumber.trim() ? 'Phone number saved.' : 'Phone number removed.');
    } catch (phoneError) {
      setError(phoneError instanceof Error ? phoneError.message : 'Failed to save phone number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiCall('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Failed to change password.'));

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRequestVerification = async () => {
    clearFeedback();
    setRequestingCode(true);

    try {
      const response = await apiCall('/users/me/email/verification', { method: 'POST' });
      if (!response.ok) throw new Error(await responseMessage(response, 'Unable to generate a confirmation code.'));

      const data = await response.json();
      setDevelopmentCode(data.debugCode ?? null);
      setMessage(data.message || 'A confirmation code has been generated.');
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Unable to generate a confirmation code.');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleConfirmEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setConfirmingEmail(true);

    try {
      const response = await apiCall('/users/me/email/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode.trim() }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Unable to confirm email.'));

      setEmailConfirmed(true);
      setVerificationCode('');
      setDevelopmentCode(null);
      setMessage('Email confirmed successfully.');
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : 'Unable to confirm email.');
    } finally {
      setConfirmingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account. Continue?')) return;

    clearFeedback();
    setDeleting(true);
    try {
      const response = await apiCall('/users/me', { method: 'DELETE' });
      if (!response.ok) throw new Error(await responseMessage(response, 'Could not delete account.'));

      logout();
      onNavigate('home');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-page">
        <div className="settings-card glass-panel settings-auth-card">
          <p className="settings-eyebrow">Account</p>
          <h1>Settings</h1>
          <p className="settings-description">Sign in to manage account security, contact information and appearance.</p>
          <div className="settings-actions">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>Sign In</button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('register')}>Create Account</button>
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
            <p className="settings-eyebrow">Account &amp; Security</p>
            <h1>Settings</h1>
            <p>Manage your profile, contact information and login security.</p>
          </div>
          <span className={`settings-verification-badge ${emailConfirmed ? 'verified' : 'unverified'}`}>
            {emailConfirmed ? 'Email verified' : 'Email needs verification'}
          </span>
        </div>

        {message && <div className="settings-success" role="status">{message}</div>}
        {error && <div className="settings-error" role="alert">{error}</div>}

        <section className="settings-section">
          <h2>Appearance</h2>
          <p className="settings-description">Choose the theme you prefer to use on this device.</p>
          <div className="settings-theme-switcher">
            <button type="button" className={`settings-option-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => applyTheme('dark')}>Dark</button>
            <button type="button" className={`settings-option-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => applyTheme('light')}>Light</button>
          </div>
        </section>

        <form onSubmit={handleProfileSave} className="settings-section">
          <h2>Account details</h2>
          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-name">Name</label>
            <input id="settings-name" required className="settings-input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-email">Email address</label>
            <input id="settings-email" required className="settings-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <small className="settings-hint">Changing the email makes it unverified until you confirm it again.</small>
          </div>
          <div className="settings-actions"><button type="submit" className="btn btn-primary" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save account details'}</button></div>
        </form>

        <section className="settings-section">
          <div className="settings-section-heading">
            <div><h2>Confirm email</h2><p className="settings-description">Verify that you control {email || 'this email address'}.</p></div>
            <span className={`settings-status-dot ${emailConfirmed ? 'confirmed' : ''}`}>{emailConfirmed ? 'Confirmed' : 'Not confirmed'}</span>
          </div>
          {!emailConfirmed && (
            <>
              <div className="settings-actions"><button type="button" className="btn btn-secondary" disabled={requestingCode} onClick={handleRequestVerification}>{requestingCode ? 'Generating…' : 'Get confirmation code'}</button></div>
              {developmentCode && <p className="settings-development-code">Development code: <code>{developmentCode}</code></p>}
              <form className="settings-inline-form" onSubmit={handleConfirmEmail}>
                <input required className="settings-input" aria-label="Email confirmation code" placeholder="Enter confirmation code" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} />
                <button type="submit" className="btn btn-primary" disabled={confirmingEmail}>{confirmingEmail ? 'Confirming…' : 'Confirm email'}</button>
              </form>
            </>
          )}
        </section>

        <form onSubmit={handlePhoneSave} className="settings-section">
          <h2>Phone number</h2>
          <p className="settings-description">Add a phone number for account contact and future auction notifications.</p>
          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-phone">Phone number</label>
            <input id="settings-phone" className="settings-input" type="tel" inputMode="tel" maxLength={32} placeholder="+380 00 000 00 00" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
          </div>
          <div className="settings-actions"><button type="submit" className="btn btn-primary" disabled={savingPhone}>{savingPhone ? 'Saving…' : 'Save phone number'}</button></div>
        </form>

        <form onSubmit={handlePasswordChange} className="settings-section">
          <h2>Password</h2>
          <p className="settings-description">Use your current password before setting a new one.</p>
          <div className="settings-security-grid">
            <label className="settings-field"><span className="settings-label">Current password</span><input required minLength={6} className="settings-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label className="settings-field"><span className="settings-label">New password</span><input required minLength={6} className="settings-input" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <label className="settings-field"><span className="settings-label">Repeat new password</span><input required minLength={6} className="settings-input" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          </div>
          <div className="settings-actions"><button type="submit" className="btn btn-primary" disabled={changingPassword}>{changingPassword ? 'Changing…' : 'Change password'}</button></div>
        </form>

        <div className="settings-section settings-danger-section">
          <h2>Delete account</h2>
          <p className="settings-description">This permanently deletes your account and cannot be undone.</p>
          <button type="button" className="btn settings-danger-btn" onClick={handleDeleteAccount} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete account'}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
