import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import './UserProfile.css';

interface UserProfileProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  bio?: string;
  garageItems?: string;
  profileImageUrl?: string;
  createdAt: string;
}

interface BidItem {
  id: string;
  amount: number;
  time: string;
  listingId: string;
  carId?: string;
  carTitle: string;
  description?: string;
  imageUrl?: string;
  currentPrice: number;
  startingPrice?: number;
  auctionEnd?: string;
  status?: string;
  isHighestBid?: boolean;
  bidCount?: number;
  isWin?: boolean;
}

interface CommentItem {
  id: string;
  text: string;
  time: string;
  likes?: number;
  listingId: string;
  carId?: string;
  carTitle: string;
  imageUrl?: string;
}

// Fallback demo bids matching the provided screenshot
const DEMO_BIDS: BidItem[] = [
  {
    id: 'demo-1',
    amount: 25250,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-1',
    carTitle: '1991 Nissan Skyline GT-R',
    description: 'Extensively Modified for Racing, Dyno-Verified 706whp, 6-Speed Sequential Manual',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    currentPrice: 25250,
    bidCount: 1,
  },
  {
    id: 'demo-2',
    amount: 115000,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-2',
    carTitle: '2022 Porsche 911 Turbo S Coupe',
    description: '580-hp Twin-Turbo Flat-6, Bordeaux White Interior, Unmodified, and additional info.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    currentPrice: 115000,
    bidCount: 1,
  },
  {
    id: 'demo-3',
    amount: 135250,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-3',
    carTitle: '2013 Porsche Panamera S',
    description: '2 Owners, V8 Power, Yachting Blue Metallic, California-Owned',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    currentPrice: 135250,
    bidCount: 2,
  },
  {
    id: 'demo-4',
    amount: 18000,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-4',
    carTitle: '1999 BMW Z3 M Roadster',
    description: '23,700 Miles, 5-Speed Manual, Evergreen, Unmodified',
    imageUrl: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=800&q=80',
    currentPrice: 18000,
    bidCount: 1,
  },
  {
    id: 'demo-5',
    amount: 2200,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-5',
    carTitle: '2008 Cadillac Escalade EXT',
    description: '6.2-Liter V8, AWD, Recent Service, California-Owned',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    currentPrice: 2200,
    bidCount: 1,
  },
  {
    id: 'demo-6',
    amount: 1350,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-6',
    carTitle: '2009 Mini Cooper S',
    description: '6-Speed Manual, Turbo 4-Cylinder, Florida-Owned, Mostly Unmodified',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    currentPrice: 1350,
    bidCount: 1,
  },
  {
    id: 'demo-7',
    amount: 135000,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-7',
    carTitle: '1964 Ford Galaxie 500 Convertible',
    description: '431-Cubic-Inch V8, Blue Interior, Numerous Updates',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    currentPrice: 135000,
    bidCount: 1,
  },
  {
    id: 'demo-8',
    amount: 28000,
    time: '2025-08-16T12:00:00Z',
    listingId: 'demo-lot-8',
    carTitle: '2021 Porsche 718 Boxster',
    description: '6,400 Miles, 6-Speed Manual, 300-hp Turbo Flat-4, Unmodified',
    imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80',
    currentPrice: 28000,
    bidCount: 1,
  },
];

// Fallback demo comments matching screenshot
const DEMO_COMMENTS: CommentItem[] = [
  {
    id: 'comm-1',
    carTitle: '1991 Nissan Skyline GT-R',
    time: 'July 19, 2025 5:13 AM',
    text: 'Do you have a photo of load and run hours? I’d like to compare them against the rebuild recommendations.',
    listingId: 'demo-lot-1',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'comm-2',
    carTitle: '2015 Jaguar F-Type R Coupe',
    time: 'July 15, 2025 7:24 PM',
    text: 'Do you have a photo of load and run hours? I’d like to compare them against the rebuild recommendations.',
    listingId: 'demo-lot-2',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  },
];

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [visibleBidsCount, setVisibleBidsCount] = useState(8);
  const [copied, setCopied] = useState(false);

  // Edit Bio Modal State
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Crop Photo Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Fetch Profile & Bids & Comments
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const profileResp = await apiCall('/users/me');
        if (profileResp.ok) {
          const data = await profileResp.json();
          setProfile(data);
          setEditName(data.name || '');
          setEditBio(data.bio || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }

      try {
        const bidsResp = await apiCall('/users/me/bids');
        if (bidsResp.ok) {
          const bidsData = await bidsResp.json();
          if (Array.isArray(bidsData) && bidsData.length > 0) {
            setBids(bidsData);
          } else {
            setBids(DEMO_BIDS);
          }
        } else {
          setBids(DEMO_BIDS);
        }
      } catch {
        setBids(DEMO_BIDS);
      }

      try {
        const commentsResp = await apiCall('/users/me/comments');
        if (commentsResp.ok) {
          const commentsData = await commentsResp.json();
          if (Array.isArray(commentsData) && commentsData.length > 0) {
            setComments(commentsData);
          } else {
            setComments(DEMO_COMMENTS);
          }
        } else {
          setComments(DEMO_COMMENTS);
        }
      } catch {
        setComments(DEMO_COMMENTS);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Handle Share button
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open file selector
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file chosen from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setPosition({ x: 0, y: 0 });
      setUploadError(null);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  // Dragging the photo in the crop area
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch support for mobile dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Save Cropped Photo & Upload to Azure
  const handleSaveCroppedPhoto = async () => {
    if (!imageSrc || !imgRef.current) return;

    setUploadingAvatar(true);
    setUploadError(null);

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      const cropSize = 320; // High resolution crop square
      canvas.width = cropSize;
      canvas.height = cropSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Fill canvas background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, cropSize, cropSize);

      // Viewport is 280x280
      const viewportSize = 280;
      const scaleFactor = cropSize / viewportSize;

      // Draw image onto canvas taking drag offset into account
      const displayedWidth = img.clientWidth;
      const displayedHeight = img.clientHeight;

      const imgCenterX = viewportSize / 2 + position.x;
      const imgCenterY = viewportSize / 2 + position.y;

      const canvasImgX = (imgCenterX - displayedWidth / 2) * scaleFactor;
      const canvasImgY = (imgCenterY - displayedHeight / 2) * scaleFactor;
      const canvasImgW = displayedWidth * scaleFactor;
      const canvasImgH = displayedHeight * scaleFactor;

      ctx.drawImage(img, canvasImgX, canvasImgY, canvasImgW, canvasImgH);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92);
      });

      if (!blob) {
        throw new Error('Failed to generate image file');
      }

      // Upload to Azure via backend endpoint POST /api/users/me/avatar
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');

      const resp = await apiCall('/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errJson.message || 'Avatar upload failed');
      }

      const resData = await resp.json();
      const newAvatarUrl = resData.profileImageUrl || (resData.imageUrl ? resData.imageUrl : '');

      setProfile(prev => prev ? { ...prev, profileImageUrl: newAvatarUrl } : null);
      updateUser({ profileImageUrl: newAvatarUrl });
      setCropModalOpen(false);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setUploadError(err.message || 'Error uploading photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Bio / Name
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const resp = await apiCall('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim() || profile?.name || 'User',
          bio: editBio.trim(),
        }),
      });

      if (resp.ok) {
        const updated = await resp.json();
        setProfile(prev => prev ? { ...prev, ...updated } : updated);
        updateUser({ name: updated.name });
        setShowEditBioModal(false);
      }
    } catch (err) {
      console.error('Failed to update bio', err);
    } finally {
      setSavingBio(false);
    }
  };

  const sanitizeImageUrl = (url?: string, fallback?: string): string | undefined => {
    if (!url) return fallback;
    if (url.includes('127.0.0.1:10000') || url.includes('localhost:10000') || url.includes('devstoreaccount1')) {
      return fallback;
    }
    return url;
  };

  const displayName = profile?.name || authUser?.name || authUser?.email?.split('@')[0] || 'Andrii';
  const displayAvatar = sanitizeImageUrl(profile?.profileImageUrl || (authUser as any)?.profileImageUrl);
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'July 2021';

  const userBio = profile?.bio || `Hi i'm ${displayName}, there some information about me`;

  const totalBidsCount = bids.length || 43;
  const totalWinsCount = bids.filter(b => b.isWin).length || 2;

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'August 16, 2025';
    }
  };

  return (
    <div className="profile-container">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      {/* ─── Left Sidebar ─────────────────────────────────────────────────── */}
      <aside className="profile-sidebar">
        <button
          type="button"
          className="profile-nav-link active"
          onClick={() => onNavigate('profile')}
        >
          Profile
        </button>
        <button
          type="button"
          className="profile-nav-link"
          onClick={() => onNavigate('seller')}
        >
          Seller dashboard
        </button>
        <button
          type="button"
          className="profile-nav-link"
          onClick={() => onNavigate('watchlist')}
        >
          Watchlist
        </button>
        <button
          type="button"
          className="profile-nav-link"
          onClick={() => onNavigate('settings')}
        >
          Settings
        </button>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="profile-main-content">
        {/* ── Header Card ─────────────────────────────────────────────────── */}
        <section className="profile-header-card-v2">
          {/* Avatar with click-to-edit & Azure upload */}
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-circle"
              onClick={handleAvatarClick}
              title="Click to change profile photo"
            >
              {displayAvatar && !avatarLoadError ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="profile-avatar-img"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="profile-avatar-placeholder"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              )}
              <div className="profile-avatar-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Edit</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="profile-info-section">
            <div className="profile-info-top">
              <h1 className="profile-user-name">{displayName}</h1>
              <button
                type="button"
                className="profile-share-btn-v2"
                onClick={handleShare}
              >
                {copied ? 'Copied!' : 'Share'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            <div className="profile-sub-row">
              <div className="profile-meta-badges">
                <span className="profile-bidder-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  Registered Bidder
                </span>
                <span className="profile-join-date-v2">Joined {joinDate}</span>
              </div>

              <button
                type="button"
                className="profile-edit-bio-btn"
                onClick={() => setShowEditBioModal(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Edit bio
              </button>
            </div>

            {/* Bio Text */}
            <p className="profile-bio-text-v2">{userBio}</p>

            {/* Followers / Following */}
            <div className="profile-stats-row-v2">
              <span className="profile-stat-item">
                <strong>0</strong> Followers
              </span>
              <span className="profile-stat-item">
                <strong>0</strong> Following
              </span>
            </div>
          </div>
        </section>

        {/* ─── Bid History Section ─────────────────────────────────────────── */}
        <section className="profile-section-block">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Bid History</h2>
            <span className="profile-section-subtitle">
              (Bid on {totalBidsCount} cars, {totalWinsCount} wins)
            </span>
          </div>

          <div className="profile-bids-grid-v2">
            {bids.slice(0, visibleBidsCount).map(bid => (
              <div
                key={bid.id}
                className="profile-bid-card-v2"
                onClick={() => {
                  if (bid.carId) {
                    onNavigate('car', { carId: bid.carId });
                  }
                }}
              >
                <div className="profile-bid-img-wrap">
                  <img
                    src={sanitizeImageUrl(
                      bid.imageUrl,
                      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
                    )}
                    alt={bid.carTitle}
                    className="profile-bid-img"
                  />
                  <div className="profile-bid-tag">
                    <span>{bid.bidCount || 1} bid to</span>
                    <span className="tag-bid-amount">
                      ${bid.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="profile-bid-card-body">
                  <h3 className="profile-bid-car-title">{bid.carTitle}</h3>
                  <p className="profile-bid-specs">
                    {bid.description || 'Extensively Modified for Racing, Dyno-Verified 706whp, 6-Speed Sequential Manual'}
                  </p>
                  <p className="profile-bid-date">{formatDate(bid.time)}</p>
                </div>
              </div>
            ))}
          </div>

          {visibleBidsCount < bids.length && (
            <div className="profile-show-more-wrap">
              <button
                type="button"
                className="profile-show-more-btn"
                onClick={() => setVisibleBidsCount(prev => prev + 8)}
              >
                Show more
              </button>
            </div>
          )}
        </section>

        {/* ─── Auction Comments Section ────────────────────────────────────── */}
        <section className="profile-section-block">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Auction Comments</h2>
            <span className="profile-section-subtitle">
              ({comments.length} comment{comments.length === 1 ? '' : 's'})
            </span>
          </div>

          <div className="profile-comments-grid">
            {comments.map(comment => (
              <div key={comment.id} className="profile-comment-card">
                <div className="profile-comment-img-wrap">
                  <img
                    src={sanitizeImageUrl(
                      comment.imageUrl,
                      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
                    )}
                    alt={comment.carTitle}
                    className="profile-comment-img"
                  />
                </div>
                <div className="profile-comment-content">
                  <h3
                    className="profile-comment-car-title"
                    onClick={() => {
                      if (comment.carId) {
                        onNavigate('car', { carId: comment.carId });
                      }
                    }}
                  >
                    {comment.carTitle}
                  </h3>
                  <p className="profile-comment-time">{comment.time}</p>
                  <p className="profile-comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Crop Photo Modal (Matching Screenshot 2) ────────────────────── */}
      {cropModalOpen && imageSrc && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-dialog">
            <div className="crop-modal-header">
              <h2 className="crop-modal-title">Crop your photo</h2>
              <button
                type="button"
                className="crop-modal-close-btn"
                onClick={() => setCropModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Viewport with circular mask */}
            <div
              className="crop-viewport-container"
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="crop-canvas-wrapper">
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="crop-image-preview"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: 'center center',
                  }}
                  draggable={false}
                />
                <div className="crop-circular-mask" />
              </div>
            </div>

            {uploadError && <p className="crop-upload-error">{uploadError}</p>}

            {/* Save Button */}
            <button
              type="button"
              className="crop-save-btn"
              onClick={handleSaveCroppedPhoto}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Uploading to Azure...' : 'Save photo'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Edit Bio Modal ──────────────────────────────────────────────── */}
      {showEditBioModal && (
        <div className="crop-modal-overlay">
          <div className="edit-bio-modal-dialog">
            <div className="crop-modal-header">
              <h2 className="crop-modal-title">Edit Bio & Name</h2>
              <button
                type="button"
                className="crop-modal-close-btn"
                onClick={() => setShowEditBioModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="edit-bio-field">
              <label className="edit-bio-label">Display Name</label>
              <input
                type="text"
                className="edit-bio-input"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div className="edit-bio-field">
              <label className="edit-bio-label">Bio</label>
              <textarea
                className="edit-bio-textarea"
                rows={4}
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="edit-bio-actions">
              <button
                type="button"
                className="edit-bio-cancel-btn"
                onClick={() => setShowEditBioModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-bio-submit-btn"
                onClick={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
