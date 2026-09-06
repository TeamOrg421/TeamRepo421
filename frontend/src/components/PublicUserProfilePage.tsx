import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import './PublicUserProfilePage.css';

interface PublicUserProfilePageProps {
  userId: string;
  onBack: () => void;
}

interface PublicUserProfile {
  id: string;
  name: string;
  bio: string;
  garageItems: string;
  profileImageUrl: string;
  createdAt: string;
  listingsCount: number;
  bidsCount: number;
  commentsCount: number;
}

const PublicUserProfilePage: React.FC<PublicUserProfilePageProps> = ({ userId, onBack }) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiCall(`/users/${userId}`);
      if (!response.ok) throw new Error('Unable to load this profile.');
      setProfile(await response.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load this profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  if (loading) return <div className="public-profile-state">Loading profile...</div>;
  if (!profile) return <div className="public-profile-state">{message || 'User not found.'}</div>;

  return (
    <section className="public-profile-page">
      <button className="public-profile-back" type="button" onClick={onBack}>← Back</button>
      <div className="public-profile-card">
        <div className="public-profile-heading">
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.name} className="public-profile-avatar" />
          ) : (
            <div className="public-profile-avatar public-profile-avatar-fallback">{profile.name.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <p className="public-profile-eyebrow">Community member</p>
            <h1>{profile.name || 'Unnamed user'}</h1>
            <p className="public-profile-joined">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <p className="public-profile-bio">{profile.bio || 'This user has not added a bio yet.'}</p>

        <div className="public-profile-stats">
          <div><strong>{profile.listingsCount}</strong><span>Listings</span></div>
          <div><strong>{profile.bidsCount}</strong><span>Bids</span></div>
          <div><strong>{profile.commentsCount}</strong><span>Comments</span></div>
        </div>

        {profile.garageItems && (
          <div className="public-profile-garage">
            <h2>Garage</h2>
            <p>{profile.garageItems}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicUserProfilePage;
