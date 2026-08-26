import React from 'react';
import AuthContainer from './AuthContainer';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  return <AuthContainer initialView="register-step1" onNavigate={onNavigate} />;
};

export default Register;
