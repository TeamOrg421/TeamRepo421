import React from 'react';

interface CarProps {
  onNavigate: (page: string) => void;
}

const Car: React.FC<CarProps> = ({ onNavigate }) => {
  return (
    <div className="car-page">
      <button type="button" className="car-back-btn" onClick={() => onNavigate('home')}>
        ← Back to Auctions
      </button>
      <div className="car-placeholder-image" />
      <h1 className="car-title">Vehicle Details</h1>
      <p className="car-subtitle">Car page placeholder</p>
    </div>
  );
};

export default Car;
