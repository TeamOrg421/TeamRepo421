import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import './PublicUserProfilePage.css';
import { useLanguage } from '../contexts/LanguageContext';

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
  activeListingsCount: number;
  completedListingsCount: number;
  bidsCount: number;
  commentsCount: number;
  winsCount: number;
}

const PublicUserProfilePage: React.FC<PublicUserProfilePageProps> = ({ userId, onBack }) => {
  const { t } = useLanguage();
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

  if (loading) return <div className="public-profile-state">{t('loadingProfile')}</div>;
  if (!profile) return <div className="public-profile-state">{message || t('userNotFound')}</div>;

  return (
    <section className="public-profile-page">
      <button className="public-profile-back" type="button" onClick={onBack}>← {t('backToLeaderboard')}</button>
      <div className="public-profile-card">
        <div className="public-profile-heading">
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.name} className="public-profile-avatar" />
          ) : (
            <div className="public-profile-avatar public-profile-avatar-fallback">{profile.name.charAt(0).toUpperCase()}</div>
          )}
          <div>
            <p className="public-profile-eyebrow">{t('communityMember')}</p>
            <h1>{profile.name || t('unnamedUser')}</h1>
            <p className="public-profile-joined">{t('joined')} {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <p className="public-profile-bio">{profile.bio || t('noBio')}</p>

        <div className="public-profile-stats">
          <div><strong>{profile.listingsCount}</strong><span>{t('listings')}</span></div>
          <div><strong>{profile.activeListingsCount}</strong><span>{t('activeNow')}</span></div>
          <div><strong>{profile.completedListingsCount}</strong><span>{t('completed')}</span></div>
          <div><strong>{profile.bidsCount}</strong><span>{t('bids')}</span></div>
          <div><strong>{profile.winsCount}</strong><span>{t('auctionWins')}</span></div>
          <div><strong>{profile.commentsCount}</strong><span>{t('comments')}</span></div>
        </div>

        {profile.garageItems && (
          <div className="public-profile-garage">
            <h2>{t('garage')}</h2>
            <p>{profile.garageItems}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PublicUserProfilePage;
