import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';

interface UserProfileProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  garageItems: string;
  createdAt: string;
}

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSave }) => {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const [garageInput, setGarageInput] = useState('');
  const [garageList, setGarageList] = useState<string[]>(
    profile.garageItems ? profile.garageItems.split('|').filter(Boolean) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddGarage = () => {
    const trimmed = garageInput.trim();
    if (!trimmed) return;
    setGarageList(prev => [...prev, trimmed]);
    setGarageInput('');
  };

  const handleRemoveGarage = (idx: number) => {
    setGarageList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const resp = await apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim() || profile.name,
          bio: bio.trim(),
          garageItems: garageList.join('|'),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Update failed' }));
        setError(err.message || 'Update failed');
        return;
      }

      const updated = await resp.json();
      onSave({ ...profile, ...updated });
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box glass-panel">
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="modal-avatar-row">
          <div className="modal-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </div>
          <button type="button" className="modal-avatar-btn">
            Choose a profile photo
          </button>
        </div>

        {/* Name */}
        <div className="modal-field">
          <label className="modal-label">Display Name</label>
          <input
            type="text"
            className="modal-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        {/* Bio */}
        <div className="modal-field">
          <label className="modal-label">Bio</label>
          <textarea
            className="modal-textarea"
            rows={4}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Add a short bio. Where are you located? What kind of cars do you like? What do you own? What do you want other members to know about you?"
          />
        </div>

        {/* Garage */}
        <div className="modal-field">
          <label className="modal-label">What's in your garage?</label>
          <div className="modal-garage-input-row">
            <input
              type="text"
              className="modal-input"
              value={garageInput}
              onChange={e => setGarageInput(e.target.value)}
              placeholder="2003 BMW M3"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGarage(); } }}
            />
            <button type="button" className="modal-add-btn" onClick={handleAddGarage}>
              Add
            </button>
          </div>
          {garageList.length > 0 && (
            <ul className="modal-garage-list">
              {garageList.map((item, idx) => (
                <li key={idx} className="modal-garage-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    className="modal-garage-remove"
                    onClick={() => handleRemoveGarage(idx)}
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-footer">
          <button
            type="button"
            className="modal-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const resp = await apiCall('/users/me');
        if (resp.ok) {
          const data = await resp.json();
          setProfile(data);
        }
      } catch {/* ignore */}
    })();
  }, [isAuthenticated]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = profile?.name || authUser?.name || authUser?.email?.split('@')[0] || 'User';
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'July 2026';

  const garageItems = profile?.garageItems
    ? profile.garageItems.split('|').filter(Boolean)
    : [];

  const profileToEdit = profile ?? {
    id: authUser?.id ?? '',
    name: displayName,
    email: authUser?.email ?? '',
    bio: '',
    garageItems: '',
    createdAt: new Date().toISOString(),
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-header-card glass-panel">
          <div className="profile-empty-state">
            <div className="profile-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
              </svg>
            </div>
            <p className="profile-empty-title">Sign in to view your profile</p>
            <p className="profile-empty-sub">Sign in to edit your profile and see your account details.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page">
        {/* ── Header Card ─────────────────────────────────────────────────── */}
        <div className="profile-header-card glass-panel">
          <div className="profile-header-inner">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="profile-avatar-icon">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </div>
            </div>

            <div className="profile-info-block">
              <div className="profile-top-row">
                <div className="profile-name-group">
                  <h1 className="profile-username">{displayName}</h1>
                  <span className="profile-join-date">Joined {joinDate}</span>
                </div>
                <button type="button" className="profile-share-btn" onClick={handleShare}>
                  {copied ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="share-icon">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      Share
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="share-icon">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="profile-bio">{profile.bio}</p>
              )}

              {/* Garage */}
              <div className="profile-garage-section">
                <span className="profile-garage-label">My Garage</span>
                {garageItems.length > 0 ? (
                  <ul className="profile-garage-list">
                    {garageItems.map((item, idx) => (
                      <li key={idx} className="profile-garage-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="3" width="15" height="13" rx="1" />
                          <path d="M16 8h4l3 3v5h-7V8z" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="profile-garage-empty">Your garage is empty</span>
                )}
              </div>

              {/* Stats + Edit */}
              <div className="profile-stats-row">
                <button type="button" className="profile-stat-btn">
                  <span className="profile-stat-count">0</span>
                  <span className="profile-stat-label">Followers</span>
                </button>
                <button type="button" className="profile-stat-btn">
                  <span className="profile-stat-count">0</span>
                  <span className="profile-stat-label">Following</span>
                </button>
                <button
                  type="button"
                  className="btn profile-edit-btn"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      {showEditModal && (
        <EditProfileModal
          profile={profileToEdit}
          onClose={() => setShowEditModal(false)}
          onSave={updated => {
            setProfile(updated);
            updateUser({ name: updated.name });
          }}
        />
      )}
    </>
  );
};

export default UserProfile;
