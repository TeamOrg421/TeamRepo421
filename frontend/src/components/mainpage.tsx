import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/*
  MainPage
  - Simple landing page that demonstrates access to `user` from AuthContext.
  - Shows `user.name` or `user.email` when available.
*/

type MainPageProps = {
  title?: string;
};

const MainPage: React.FC<MainPageProps> = ({ title = 'Auto Page' }) => {
  const { user } = useAuth();
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>{title}</h1>
      <p>Welcome{user ? `, ${user.name || user.email}` : ''} to the simple auto page.</p>
    </main>
  );
};

export default MainPage;
