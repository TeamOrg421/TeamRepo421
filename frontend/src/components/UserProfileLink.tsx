import React from 'react';

interface UserProfileLinkProps {
  userId?: string;
  name: string;
  onNavigate: (page: string, params?: { userId?: string }) => void;
  className?: string;
}

const UserProfileLink: React.FC<UserProfileLinkProps> = ({ userId, name, onNavigate, className }) => {
  if (!userId) return <span className={className}>{name}</span>;

  return (
    <button
      type="button"
      className={`user-profile-link ${className ?? ''}`}
      onClick={() => onNavigate('user-profile', { userId })}
    >
      {name}
    </button>
  );
};

export default UserProfileLink;
