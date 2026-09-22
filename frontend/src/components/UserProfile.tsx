import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import { addBankCard, getBankCards, topUpBankCard, withdrawFromBankCard } from '../services/bankCards';
import type { BankCardDto, CreateBankCardDto } from '../services/bankCards';
import { useLanguage } from '../contexts/LanguageContext';
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

interface OwnedCar {
  id: string;
  vin: string;
  year: number;
  brand: string;
  model: string;
  imageUrl?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onNavigate }) => {
  const { user: authUser, isAuthenticated, updateUser } = useAuth();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [ownedCars, setOwnedCars] = useState<OwnedCar[]>([]);
  const [visibleBidsCount, setVisibleBidsCount] = useState(8);
  const [copied, setCopied] = useState(false);

  // Edit Bio Modal State
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletCards, setWalletCards] = useState<BankCardDto[]>([]);
  const [walletSelectedId, setWalletSelectedId] = useState('');
  const [walletAmount, setWalletAmount] = useState('100');
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');
  const [walletError, setWalletError] = useState('');
  const [walletForm, setWalletForm] = useState<CreateBankCardDto>({
    cardNumber: '',
    cvv: '',
    cardHolderName: '',
    expiryDate: '',
    billingAddress: '',
    isDefault: false,
  });

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
          setBids(Array.isArray(bidsData) ? bidsData : []);
        } else {
          setBids([]);
        }
      } catch {
        setBids([]);
      }

      try {
        const commentsResp = await apiCall('/users/me/comments');
        if (commentsResp.ok) {
          const commentsData = await commentsResp.json();
          setComments(Array.isArray(commentsData) ? commentsData : []);
        } else {
          setComments([]);
        }
      } catch {
        setComments([]);
      }

      try {
        const carsResp = await apiCall('/users/me/cars');
        setOwnedCars(carsResp.ok ? await carsResp.json() : []);
      } catch {
        setOwnedCars([]);
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

  const loadWalletCards = useCallback(async () => {
    if (!isAuthenticated) {
      setWalletError('Please log in first to view your wallet.');
      setWalletCards([]);
      setWalletSelectedId('');
      return;
    }
    try {
      const cards = await getBankCards();
      setWalletCards(cards);
      setWalletSelectedId(current => (cards.some(card => card.id === current) ? current : cards[0]?.id ?? ''));
      setWalletError('');
    } catch (err) {
      console.error('Failed to load wallet cards', err);
      setWalletCards([]);
      setWalletSelectedId('');
      setWalletError('Failed to load wallet. Please try again.');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (showWalletModal) {
      void loadWalletCards();
    }
  }, [showWalletModal, loadWalletCards]);

  const submitWalletCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWalletBusy(true);
    setWalletError('');
    setWalletMessage('');

    try {
      const created = await addBankCard(walletForm);
      setWalletForm({
        cardNumber: '',
        cvv: '',
        cardHolderName: '',
        expiryDate: '',
        billingAddress: '',
        isDefault: false,
      });
      await loadWalletCards();
      setWalletSelectedId(created.id);
      setWalletMessage('Card added successfully.');
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Failed to add card.');
    } finally {
      setWalletBusy(false);
    }
  };

  const submitWalletTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountNum = Number(walletAmount);
    if (!walletSelectedId || !amountNum || amountNum <= 0) {
      setWalletError('Please choose a card and enter a valid positive amount.');
      return;
    }

    setWalletBusy(true);
    setWalletError('');
    setWalletMessage('');

    try {
      if (walletAction === 'deposit') {
        const result = await topUpBankCard({ cardId: walletSelectedId, amount: amountNum });
        setWalletMessage(result.message || 'Deposit successful.');
      } else {
        const result = await withdrawFromBankCard({ cardId: walletSelectedId, amount: amountNum });
        setWalletMessage(result.message || 'Withdrawal successful.');
      }
      await loadWalletCards();
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Transaction failed.');
    } finally {
      setWalletBusy(false);
    }
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

  const displayName = profile?.name || authUser?.name || authUser?.email?.split('@')[0] || 'User';
  const displayAvatar = sanitizeImageUrl(profile?.profileImageUrl || (authUser as any)?.profileImageUrl);
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(language === 'UA' ? 'uk-UA' : 'en-US', { month: 'long', year: 'numeric' })
    : t('recently');

  const userBio = profile?.bio || `Hi, I'm ${displayName}.`;

  const totalBidsCount = bids.length;
  const totalWinsCount = bids.filter(b => b.isWin).length;
  const totalBidsAmount = bids.reduce((sum, bid) => sum + Number(bid.amount || 0), 0);

  const formatDate = (isoString: string) => {
    try {
      if (!isoString) return '';
      return new Date(isoString).toLocaleDateString(language === 'UA' ? 'uk-UA' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
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
                <span>{t('edit')}</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="profile-info-section">
            <div className="profile-info-top">
              <h1 className="profile-user-name">{displayName}</h1>
              <div className="profile-header-toolbar">
                <span className="profile-total-bids">Total bids: ${totalBidsAmount.toLocaleString()}</span>
                <button type="button" className="profile-toolbar-btn" onClick={handleShare}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  {copied ? t('copied') : t('share')}
                </button>
                <button type="button" className="profile-toolbar-btn" onClick={() => setShowEditBioModal(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  {t('editBio')}
                </button>
                <button
                  type="button"
                  className="profile-toolbar-btn"
                  onClick={() => setShowWalletModal(true)}
                  aria-label="Manage payment cards"
                  title="Manage payment cards"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="3" />
                    <path d="M2 10h20" />
                    <path d="M7 15h3" />
                  </svg>
                  {t('cards')}
                </button>
              </div>
            </div>

            <div className="profile-sub-row">
              <div className="profile-meta-badges">
                <span className="profile-bidder-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  {t('registeredBidder')}
                </span>
                <span className="profile-join-date-v2">{t('joined')} {joinDate}</span>
              </div>

            </div>

            {/* Bio Text */}
            <p className="profile-bio-text-v2">{userBio}</p>

            {/* Followers / Following */}
            <div className="profile-stats-row-v2">
              <span className="profile-stat-item">
                <strong>0</strong> {t('followers')}
              </span>
              <span className="profile-stat-item">
                <strong>0</strong> {t('following')}
              </span>
            </div>
          </div>
        </section>

        {/* ─── Bid History Section ─────────────────────────────────────────── */}
        <section className="profile-section-block">
          <div className="profile-section-header">
            <h2 className="profile-section-title">{t('bidHistory')}</h2>
            <span className="profile-section-subtitle">
              ({t('bidOn')} {totalBidsCount} {totalBidsCount === 1 ? t('car') : t('cars')}, {totalWinsCount} {totalWinsCount === 1 ? t('win') : t('wins')})
            </span>
          </div>

          {bids.length > 0 ? (
            <>
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
                        <span>{bid.bidCount || 1} {t('bidTo')}</span>
                        <span className="tag-bid-amount">
                          ${bid.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="profile-bid-card-body">
                      <h3 className="profile-bid-car-title">{bid.carTitle}</h3>
                      {bid.description && (
                        <p className="profile-bid-specs">{bid.description}</p>
                      )}
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
                    {t('showMore')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="profile-empty-state">
              <div className="profile-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="profile-empty-title">{t('noBidsPlaced')}</div>
              <div className="profile-empty-sub">{t('biddingHistoryEmpty')}</div>
            </div>
          )}
        </section>

        <section className="profile-section-block">
          <div className="profile-section-header">
            <h2 className="profile-section-title">My vehicles</h2>
            <span className="profile-section-subtitle">({ownedCars.length})</span>
          </div>
          {ownedCars.length > 0 ? (
            <div className="profile-owned-cars-grid">
              {ownedCars.map(car => (
                <button key={car.id} type="button" className="profile-owned-car" onClick={() => onNavigate('car', { carId: car.id })}>
                  {car.imageUrl ? <img src={car.imageUrl} alt={`${car.brand} ${car.model}`} /> : <div className="profile-owned-car-placeholder" />}
                  <span>{car.year} {car.brand} {car.model}</span>
                  <small>VIN: {car.vin}</small>
                </button>
              ))}
            </div>
          ) : <div className="profile-empty-state"><div className="profile-empty-title">No vehicles yet</div></div>}
        </section>

        {/* ─── Auction Comments Section ────────────────────────────────────── */}
        <section className="profile-section-block">
          <div className="profile-section-header">
            <h2 className="profile-section-title">{t('auctionComments')}</h2>
            <span className="profile-section-subtitle">
              ({comments.length} {comments.length === 1 ? t('comment') : t('commentsLower')})
            </span>
          </div>

          {comments.length > 0 ? (
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
                    <p className="profile-comment-time">{comment.time ? formatDate(comment.time) : ''}</p>
                    <p className="profile-comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <div className="profile-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="profile-empty-title">{t('noCommentsYet')}</div>
              <div className="profile-empty-sub">{t('commentsHistoryEmpty')}</div>
            </div>
          )}
        </section>
      </main>

      {showWalletModal && (
        <div className="crop-modal-overlay">
          <div className="wallet-modal-dialog">
            <div className="crop-modal-header">
              <h2 className="crop-modal-title">{t('paymentCards')}</h2>
              <button type="button" className="crop-modal-close-btn" onClick={() => setShowWalletModal(false)}>✕</button>
            </div>

            <div className="wallet-modal-layout">
              <div className="wallet-card-panel">
                <div className="wallet-panel-header">
                  <h3>Your cards</h3>
                  <span>{walletCards.length} linked</span>
                </div>

                <div className="wallet-card-list">
                  {walletCards.length > 0 ? walletCards.map(card => (
                    <button
                      key={card.id}
                      type="button"
                      className={`wallet-card-item ${walletSelectedId === card.id ? 'selected' : ''}`}
                      onClick={() => setWalletSelectedId(card.id)}
                    >
                      <div className="wallet-card-mainline">
                        <span className="wallet-card-number">{card.maskedCardNumber}</span>
                        {card.isDefault && <span className="wallet-default-pill">Default</span>}
                      </div>
                      <div className="wallet-card-meta">
                        <span>{card.cardHolderName}</span>
                        <strong>${Number(card.balance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
                      </div>
                    </button>
                  )) : (
                    <div className="wallet-empty-state">No cards yet.</div>
                  )}
                </div>

                <form className="wallet-form" onSubmit={submitWalletCard}>
                  <h4>Add a new card</h4>
                  <div className="wallet-field-grid">
                    <input
                      placeholder="Cardholder name"
                      value={walletForm.cardHolderName}
                      onChange={e => setWalletForm(current => ({ ...current, cardHolderName: e.target.value }))}
                    />
                    <input
                      placeholder="Card number"
                      value={walletForm.cardNumber}
                      onChange={e => setWalletForm(current => ({ ...current, cardNumber: e.target.value }))}
                    />
                    <input
                      placeholder="MM/YY"
                      value={walletForm.expiryDate}
                      onChange={e => setWalletForm(current => ({ ...current, expiryDate: e.target.value }))}
                    />
                    <input
                      placeholder="CVV"
                      value={walletForm.cvv}
                      onChange={e => setWalletForm(current => ({ ...current, cvv: e.target.value }))}
                    />
                    <input
                      className="wallet-span-2"
                      placeholder="Billing address"
                      value={walletForm.billingAddress}
                      onChange={e => setWalletForm(current => ({ ...current, billingAddress: e.target.value }))}
                    />
                  </div>
                  <label className="wallet-checkbox">
                    <input
                      type="checkbox"
                      checked={walletForm.isDefault}
                      onChange={e => setWalletForm(current => ({ ...current, isDefault: e.target.checked }))}
                    />
                    Set as default
                  </label>
                  <button type="submit" className="wallet-primary-btn" disabled={walletBusy}>
                    {walletBusy ? 'Saving...' : 'Add card'}
                  </button>
                </form>
              </div>

              <div className="wallet-ops-panel">
                <div className="wallet-panel-header">
                  <h3>Test funds</h3>
                  <span>Demo wallet</span>
                </div>

                <form className="wallet-ops-form" onSubmit={submitWalletTransaction}>
                  <div className="wallet-toggle-row">
                    <button
                      type="button"
                      className={walletAction === 'deposit' ? 'wallet-toggle active' : 'wallet-toggle'}
                      onClick={() => setWalletAction('deposit')}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      className={walletAction === 'withdraw' ? 'wallet-toggle active' : 'wallet-toggle'}
                      onClick={() => setWalletAction('withdraw')}
                    >
                      Withdraw
                    </button>
                  </div>

                  <select value={walletSelectedId} onChange={e => setWalletSelectedId(e.target.value)}>
                    {walletCards.map(card => (
                      <option key={card.id} value={card.id}>{card.maskedCardNumber}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={walletAmount}
                    onChange={e => setWalletAmount(e.target.value)}
                    placeholder="Amount"
                  />

                  <button type="submit" className="wallet-primary-btn" disabled={walletBusy || !walletSelectedId}>
                    {walletBusy ? 'Processing...' : walletAction === 'deposit' ? 'Add funds' : 'Withdraw funds'}
                  </button>
                </form>

                {walletMessage && <div className="wallet-result success">{walletMessage}</div>}
                {walletError && <div className="wallet-result error">{walletError}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

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
