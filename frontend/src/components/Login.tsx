import React, { useMemo } from 'react';
import AuthContainer from './AuthContainer';

interface LoginProps {
  onNavigate: (page: string) => void;
  initialAuthView?: 'login' | 'register-step1' | 'register-step2' | 'forgot' | 'check-email' | 'reset-password' | 'reset-success' | null;
}

const Login: React.FC<LoginProps> = ({ onNavigate, initialAuthView }) => {
  // Перевіряємо URL параметри для скидання пароля
  const initialView = useMemo(() => {
    // Якщо явно передано initialAuthView, використовуємо його
    if (initialAuthView && initialAuthView !== 'login') {
      return initialAuthView;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    // Якщо є токен та email, показуємо форму скидання пароля
    if (token && email) {
      return 'reset-password' as const;
    }
    return 'login' as const;
  }, [initialAuthView]);

  return <AuthContainer initialView={initialView} onNavigate={onNavigate} />;
};

export default Login;
