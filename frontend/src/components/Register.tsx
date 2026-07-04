import React, { useState } from 'react';
import { apiCall } from '../services/config';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Заповніть усі поля');
      return;
    }

    try {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Помилка реєстрації');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Не вдалося підключитись до сервера');
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#4ade80', fontSize: '18px' }}>✅ Акаунт створено!</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('login')}>
          Увійти
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '380px', width: '100%', padding: '20px' }}>
      <h2 style={{ marginBottom: '24px' }}>Реєстрація</h2>

      {error && <p style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Ім'я</label>
          <input type="text" placeholder="Іван Іванов" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Пароль</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
          Створити акаунт
        </button>
      </form>

      <p style={{ marginTop: '16px', fontSize: '13px', color: '#aaa' }}>
        Вже є акаунт?{' '}
        <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => onNavigate('login')}>Увійти</span>
      </p>
    </div>
  );
};

export default Register;
