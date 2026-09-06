import React from 'react';
import VeyoLogo from './VeyoLogo';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
          <h2>HOW IT WORKS</h2>
          <button type="button" onClick={() => navigateToSection('finalizing-the-sale')}>SafePay</button>
          <button type="button" onClick={() => navigateToSection('buying-a-car')}>Buying a Car</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>Selling a Car</button>
          <button type="button" onClick={() => navigateToSection('finalizing-the-sale')}>Finalizing the Sale</button>
          <button type="button" onClick={() => navigateToSection('faq')}>FAQs</button>
        </div>

        <div className="footer-column">
          <h2>SELLERS</h2>
          <button type="button" onClick={() => onNavigate('sellCar')}>Submit Your Car</button>
          <button type="button" onClick={() => onNavigate('seller')}>Dashboard</button>
          <button type="button" onClick={() => navigateToSection('about-us')}>Certified Sellers</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>Photo Guide</button>
          <button type="button" onClick={() => navigateToSection('selling-a-car')}>Book a Photo Shoot</button>
          <button type="button" onClick={() => navigateToSection('buying-a-car')}>Inspections</button>
        </div>

        <div className="footer-column">
          <h2>HELPFUL LINKS</h2>
          <button type="button" onClick={() => onNavigate('home')}>Auctions</button>
          <button type="button" onClick={() => onNavigate('watchlist')}>Watch list</button>
          <button type="button" onClick={() => onNavigate('leaderboard')}>Leaderboard</button>
          <button type="button" onClick={() => onNavigate('settings')}>Settings</button>
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
