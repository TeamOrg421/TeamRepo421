import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';
import { GoogleLogin } from '@react-oauth/google';

export type AuthView =
  | 'login'
  | 'register-step1'
  | 'register-step2'
  | 'forgot'
  | 'check-email'
  | 'reset-password'
  | 'reset-success';

interface AuthContainerProps {
  initialView?: AuthView;
  onNavigate: (page: string) => void;
}

const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

interface SocialButtonsProps {
  onGoogleCredential: (idToken: string) => void;
  onGoogleError: () => void;
  googleLoading: boolean;
}

const SocialButtons: React.FC<SocialButtonsProps> = ({ onGoogleCredential, onGoogleError, googleLoading }) => (
  <>
    <div className="auth-divider">
      <span className="auth-divider-text">or</span>
    </div>
    <div className="auth-social-row">
      <div className="auth-social-btn auth-google-btn" aria-label="Google">
        {googleLoading ? (
          <span className="auth-social-spinner" />
        ) : (
          <GoogleLogin
            onSuccess={(res) => {
              if (res.credential) onGoogleCredential(res.credential);
              else onGoogleError();
            }}
            onError={onGoogleError}
            type="icon"
            theme="outline"
            size="large"
            shape="square"
            logo_alignment="center"
          />
        )}
      </div>
      <button className="auth-social-btn" type="button" aria-label="Apple" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8.92-2.87-.93.04-2.02.63-2.66 1.38-.56.65-1.06 1.7-.92 2.74 1.04.08 2.05-.5 2.66-1.25z" />
        </svg>
      </button>
      <button className="auth-social-btn" type="button" aria-label="Facebook" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
    </div>
  </>
);

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialView = 'login',
  onNavigate,
}) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { login } = useAuth();

  const goTo = (v: AuthView) => { setError(''); setView(v); };

  // ===================== CHECK RESET PASSWORD LINK =====================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const resetEmail = params.get('email');

    if (token && resetEmail) {
      setResetToken(decodeURIComponent(token));
      setEmail(decodeURIComponent(resetEmail));
      goTo('reset-password');
    }
  }, []);

  // ===================== GOOGLE AUTH =====================
  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Не вдалося увійти через Google');
      } else {
        const token = data.token || data.Token;
        if (token) {
          login(token);
          onNavigate('mainpage');
        } else {
          setError('Сервер не повернув токен авторизації');
        }
      }
    } catch {
      setError('Не вдалося з’єднатися із сервером');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ===================== EMAIL/PASSWORD AUTH =====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid email or password');
      } else {
        const token = data.token || data.Token;
        if (token) login(token);
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        onNavigate('mainpage');
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return; }
    if (!name.trim()) { setError('Please enter your name'); return; }
    goTo('register-step2');
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter a password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed');
      } else {
        const token = data.token || data.Token;
        if (token) {
          login(token);
          onNavigate('mainpage');
        } else {
          goTo('login');
        }
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }).catch(() => null);
    } finally {
      setLoading(false);
      goTo('check-email');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword) { setError('Please enter a password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
      } else {
        goTo('reset-success');
        setTimeout(() => {
          goTo('login');
          setNewPassword('');
          setConfirmPassword('');
          setResetToken('');
        }, 3000);
      }
    } catch {
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-overlay">
      <div className="auth-backdrop-dimmer" />
      <div className="auth-card">

        {/* Back button */}
        {(view === 'register-step2' || view === 'forgot' || view === 'check-email' || view === 'reset-password' || view === 'reset-success') && (
          <button
            className="auth-nav-icon-btn auth-back-btn"
            type="button"
            aria-label="Back"
            onClick={() => {
              if (view === 'register-step2') goTo('register-step1');
              else if (view === 'forgot' || view === 'check-email') goTo('login');
              else if (view === 'reset-password' || view === 'reset-success') goTo('login');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Close button */}
        <button
          className="auth-nav-icon-btn auth-close-btn"
          type="button"
          aria-label="Close"
          onClick={() => onNavigate('home')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {error && <div className="auth-error-msg">{error}</div>}

        {/* ===================== LOGIN ===================== */}
        {view === 'login' && (
          <>
            <h2 className="auth-title">Welcome back</h2>
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label">Enter your email</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="example@yourmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Enter your password</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input has-toggle"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="example_spassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div className="auth-options-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <span className="auth-forgot-link" onClick={() => goTo('forgot')}>
                  Forgot password?
                </span>
              </div>
              <div className="auth-btn-row">
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>
            <SocialButtons
              onGoogleCredential={handleGoogleCredential}
              onGoogleError={() => setError('Помилка входу через Google. Спробуйте ще раз.')}
              googleLoading={googleLoading}
            />
            <p className="auth-footer">
              Don't have an account?{' '}
              <span className="auth-footer-link" onClick={() => goTo('register-step1')}>Sign Up</span>
            </p>
          </>
        )}

        {/* ===================== REGISTER STEP 1: email + name ===================== */}
        {view === 'register-step1' && (
          <>
            <h2 className="auth-title">Sign Up</h2>
            <form onSubmit={handleRegisterStep1}>
              <div className="auth-field">
                <label className="auth-label">Enter your email</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="example@yourmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Enter your name</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="example Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <p className="auth-field-hint">Other users will see this name</p>
              </div>
              <div className="auth-btn-row">
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  Continue
                </button>
              </div>
            </form>
            <SocialButtons
              onGoogleCredential={handleGoogleCredential}
              onGoogleError={() => setError('Помилка входу через Google. Спробуйте ще раз.')}
              googleLoading={googleLoading}
            />
            <p className="auth-footer">
              Already have an account?{' '}
              <span className="auth-footer-link" onClick={() => goTo('login')}>Sign in here</span>
            </p>
            <p className="auth-disclaimer">By pressing continue I agree to Terms and conditions</p>
          </>
        )}

        {/* ===================== REGISTER STEP 2: create password ===================== */}
        {view === 'register-step2' && (
          <>
            <h2 className="auth-title">Create password</h2>
            <p className="auth-subtitle">
              Please create a password for your account. Make sure it's at least 6 characters long.
            </p>
            <form onSubmit={handleRegisterStep2}>
              <div className="auth-field">
                <label className="auth-label">Create password</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input has-toggle"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="example_spassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input has-toggle"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="example_spassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div className="auth-btn-row">
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===================== FORGOT PASSWORD ===================== */}
        {view === 'forgot' && (
          <>
            <h2 className="auth-title">Forgot Password?</h2>
            <p className="auth-subtitle">
              Don't worry, we've got you covered. Please enter your registered email below. We will send you a verification link.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="auth-field">
                <label className="auth-label">Enter your email</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="example@yourmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="auth-btn-row">
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send email'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===================== CHECK YOUR EMAIL ===================== */}
        {view === 'check-email' && (
          <>
            <h2 className="auth-title">Check your email</h2>
            <p className="auth-subtitle">
              We have sent the password reset link to <strong style={{ color: '#60a5fa' }}>{email}</strong>. Please check your inbox and follow the instructions.
            </p>
            <div className="auth-btn-row">
              <button type="button" className="auth-submit-btn" onClick={() => onNavigate('home')}>
                Back to main page
              </button>
            </div>
            <p className="auth-footer" style={{ marginTop: '6px' }}>
              Didn't receive?{' '}
              <span className="auth-footer-link" onClick={() => goTo('forgot')}>Resend</span>
            </p>
          </>
        )}

        {/* ===================== RESET PASSWORD ===================== */}
        {view === 'reset-password' && (
          <>
            <h2 className="auth-title">Create new password</h2>
            <p className="auth-subtitle">
              Please create a password for your account. Make sure it's at least 6 characters long.
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label className="auth-label">Create new password</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input has-toggle"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="example_spassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowNewPassword(p => !p)}>
                    {showNewPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input has-toggle"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="example_spassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </div>
              <div className="auth-btn-row">
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Resetting password...' : 'Reset password'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===================== RESET SUCCESS ===================== */}
        {view === 'reset-success' && (
          <>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h2 className="auth-title">Your password has been changed</h2>
              <p className="auth-subtitle" style={{ marginBottom: '30px' }}>
                Your password has been successfully reset. You will be redirected to login in a moment.
              </p>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
              <button type="button" className="auth-submit-btn" onClick={() => goTo('login')}>
                Back to Sign in
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthContainer;
