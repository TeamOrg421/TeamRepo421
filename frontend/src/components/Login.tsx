import React, { useState } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';

/*
  Login component
  - Submits credentials to `/api/auth/login` via `apiCall`.
  - On success calls `login(token)` from `useAuth()` so token and user
    are stored in the centralized AuthContext.
  - Afterwards navigates to `mainpage` (simple internal navigation used here).
*/

interface LoginProps {
  onNavigate: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Заповніть усі поля');
      return;
    }

    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Невірний email або пароль');
      } else {
        const token = data.token || data.Token;
        if (token) {
          login(token);
        }
        console.log('Logged in:', data);
        onNavigate('mainpage');
      }
    } catch {
      setError('Не вдалося підключитись до сервера');
    }
  };

  return (
    <div style={{ maxWidth: '380px', width: '100%', padding: '20px' }}>
      <h2 style={{ marginBottom: '24px' }}>Вхід</h2>

      {error && <p style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
          Увійти
        </button>
      </form>

      <p style={{ marginTop: '16px', fontSize: '13px', color: '#aaa' }}>
        Немає акаунту?{' '}
        <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => onNavigate('register')}>Реєстрація</span>
      </p>
    </div>
  );
};

export default Login;
