import React from 'react';
import AboutPage from './AboutPage';

interface MainPageProps {
  onNavigate?: (page: string) => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  return <AboutPage onNavigate={onNavigate} />;
};

export default MainPage;

