import React from 'react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1>Cars &amp; Bids</h1>
      <p style={{ color: '#aaa', margin: '12px 0 32px' }}>Платформа для аукціонів автомобілів</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => onNavigate('register')}>Реєстрація</button>
        <button className="btn btn-secondary" onClick={() => onNavigate('login')}>Увійти</button>
      </div>
    </div>
  );
};

export default Home;
