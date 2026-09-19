import React from 'react';
import VeyoLogo from './VeyoLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const navigateToSection = (sectionId: string) => {
    onNavigate('mainpage');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand-col">
          <div className="footer-brand" onClick={() => onNavigate('home')} title="VEYO">
            <VeyoLogo height={34} />
          </div>
        </div>

        <div className="footer-column">
          <h2>{t('howItWorks')}</h2>
          <button type="button" onClick={() => navigateToSection('finalizing-the-sale')}>{t('safePay')}</button>
          <button type="button" onClick={() => navigateToSection('buying-a-car')}>{t('buyingCar')}</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>{t('sellingCar')}</button>
          <button type="button" onClick={() => navigateToSection('finalizing-the-sale')}>{t('finalizingSale')}</button>
          <button type="button" onClick={() => navigateToSection('faq')}>{t('faqs')}</button>
        </div>

        <div className="footer-column">
          <h2>{t('sellers')}</h2>
          <button type="button" onClick={() => onNavigate('sellCar')}>{t('submitCar')}</button>
          <button type="button" onClick={() => onNavigate('seller')}>{t('dashboard')}</button>
          <button type="button" onClick={() => navigateToSection('about-us')}>{t('certifiedSellers')}</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>{t('photoGuide')}</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>{t('bookPhotoShoot')}</button>
          <button type="button" onClick={() => navigateToSection('buying-a-car')}>{t('inspections')}</button>
        </div>

        <div className="footer-column">
          <h2>{t('helpfulLinks')}</h2>
          <button type="button" onClick={() => onNavigate('home')}>{t('auctions')}</button>
          <button type="button" onClick={() => onNavigate('watchlist')}>{t('watchList')}</button>
          <button type="button" onClick={() => onNavigate('leaderboard')}>{t('leaderboard')}</button>
          <button type="button" onClick={() => onNavigate('settings')}>{t('settings')}</button>
        </div>

        <div className="footer-meta">
          <div className="footer-social" aria-label="Social links">
            <span title="YouTube">▶</span>
            <span title="Instagram">📷</span>
            <span title="Facebook">f</span>
            <span title="X">𝕏</span>
          </div>
          <div className="footer-app-badges">
            <div className="app-badge-box">
              <span className="app-badge-sub">Download on the</span>
              <span className="app-badge-main">App Store</span>
            </div>
            <div className="app-badge-box">
              <span className="app-badge-sub">GET IT ON</span>
              <span className="app-badge-main">Google Play</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} VEYO Auctions LLC<br />Terms of Use · Privacy Policy</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
