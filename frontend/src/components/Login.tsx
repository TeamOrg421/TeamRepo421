import React, { useMemo } from 'react';
import AuthContainer from './AuthContainer';

interface LoginProps {
  onNavigate: (page: string) => void;
  initialAuthView?: 'login' | 'register-step1' | 'register-step2' | 'forgot' | 'check-email' | 'reset-password' | 'reset-success' | null;
}

const Login: React.FC<LoginProps> = ({ onNavigate, initialAuthView }) => {
  const initialView = useMemo(() => {
    if (initialAuthView && initialAuthView !== 'login') {
      return initialAuthView;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (token && email) {
      return 'reset-password' as const;
    }
    return 'login' as const;
  }, [initialAuthView]);

  return <AuthContainer initialView={initialView} onNavigate={onNavigate} />;
};

export default Login;
