import React from 'react';

interface VeyoLogoProps {
  className?: string;
  height?: number | string;
  onClick?: () => void;
}

export const VeyoLogo: React.FC<VeyoLogoProps> = ({
  className = '',
  height = 28,
  onClick,
}) => {
  return (
    <img
      src="/veyo-logo.png"
      alt="VEYO"
      className={`veyo-logo ${className}`}
      onClick={onClick}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        imageRendering: 'auto',
        cursor: 'pointer',
      }}
    />
  );
};

export default VeyoLogo;
