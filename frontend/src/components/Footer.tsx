import React from 'react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <button type="button" className="footer-brand" onClick={() => onNavigate('home')}>
        <span>Cars</span><b>&amp;</b><span>Bids</span>
      </button>
      <div className="footer-column">
        <h2>HOW IT WORKS</h2>
        <button type="button" onClick={() => onNavigate('home')}>Buying a Car</button>
        <button type="button" onClick={() => onNavigate('sellCar')}>Selling a Car</button>
        <button type="button" onClick={() => onNavigate('home')}>Finalizing the Sale</button>
        <button type="button" onClick={() => onNavigate('mainpage')}>FAQs</button>
      </div>
      <div className="footer-column">
        <h2>SELLERS</h2>
        <button type="button" onClick={() => onNavigate('sellCar')}>Submit Your Car</button>
        <button type="button" onClick={() => onNavigate('seller')}>Dashboard</button>
        <button type="button" onClick={() => onNavigate('mainpage')}>Certified Sellers</button>
        <button type="button" onClick={() => onNavigate('mainpage')}>Inspections</button>
      </div>
      <div className="footer-column">
        <h2>HELPFUL LINKS</h2>
        <button type="button" onClick={() => onNavigate('home')}>Auctions</button>
        <button type="button" onClick={() => onNavigate('watchlist')}>Watch list</button>
        <button type="button" onClick={() => onNavigate('settings')}>Settings</button>
      </div>
      <div className="footer-meta">
        <div className="footer-social" aria-label="Social links"><span>◉</span><span>◎</span><span>f</span><span>𝕏</span></div>
        <p>© {new Date().getFullYear()} Cars &amp; Bids<br />Terms of Use · Privacy Policy</p>
      </div>
    </div>
  </footer>
);

export default Footer;
