import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import './Car.css';

interface CarProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
  carId: string | null;
}

interface Bid {
  bidder: string;
  amount: number;
  time: string;
}

interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  isSeller?: boolean;
  isVerified?: boolean;
  likes: number;
  /** Present when the commenter attached a bid to their message. */
  bidAmount?: number;
}

interface ServiceHistoryEntry {
  date: string;
  mileage?: string;
  notes: string;
}

interface OtherAuction {
  id: string;
  title: string;
  subtitle?: string;
  location?: string;
  image: string;
  currentBid?: number;
  startingBid?: number;
  bidCount?: number;
  tags: string[];
}

interface CarDetail {
  id: string;
  listingId?: string;
  title: string;
  tagline: string;
  year: number;
  make: string;
  model: string;
  mileage: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  bodyStyle: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  titleStatus: string;
  location: string;
  seller: string;
  sellerType: string;
  currentBid: number;
  bidCount: number;
  watchingCount: number;
  viewCount: number;
  timeRemaining: string;
  endsAt: string;
  images: string[];
  imageCaption: string;
  overview: string;
  carfaxReport: string;
  serviceHistory: ServiceHistoryEntry[];
  equipment: string[];
  ownershipHistory: string;
  sellerNotes: string;
  description: string;
  bids: Bid[];
  comments: Comment[];
}

type CommentTab = 'newest' | 'upvoted' | 'seller' | 'bids';

const FALLBACK_CAR_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 700%22%3E%3Crect width=%221200%22 height=%22700%22 fill=%22%231b1b1b%22/%3E%3Cpath d=%22M250 440h700l-75-165H380z%22 fill=%22%23353535%22/%3E%3Ccircle cx=%22400%22 cy=%22455%22 r=%2260%22 fill=%22%23111111%22 stroke=%22%23f2711c%22 stroke-width=%2216%22/%3E%3Ccircle cx=%22800%22 cy=%22455%22 r=%2260%22 fill=%22%23111111%22 stroke=%22%23f2711c%22 stroke-width=%2216%22/%3E%3Ctext x=%22600%22 y=%22600%22 fill=%22%23e9c9a8%22 font-family=%22Arial,sans-serif%22 font-size=%2240%22 text-anchor=%22middle%22%3ENo photo uploaded%3C/text%3E%3C/svg%3E';

const COMMENT_MAX_LENGTH = 500;

const normaliseImageList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'imageUrl' in item) return String((item as any).imageUrl ?? '');
      return '';
    })
    .filter((item): item is string => Boolean(item && item.trim()));
};

const enumLabels = {
  fuelType: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Gas'],
  transmission: ['Manual', 'Automatic', 'Automated manual', 'CVT'],
  driveType: ['All-wheel drive', 'Front-wheel drive', 'Rear-wheel drive'],
  bodyType: ['Sedan', 'Coupe', 'Hatchback', 'SUV', 'Wagon', 'Convertible', 'Minivan', 'Pickup'],
};

const formatEnum = (value: unknown, labels: string[]) => {
  if (typeof value === 'number') return labels[value] ?? 'Not specified';
  if (typeof value === 'string' && value.trim()) return value;
  return 'Not specified';
};

const formatEngine = (specification: any) => {
  if (!specification) return 'Not specified';
  const details: string[] = [];
  if (specification.engineVolume != null) details.push(`${Number(specification.engineVolume).toFixed(1)}L`);
  if (specification.fuelType != null) details.push(formatEnum(specification.fuelType, enumLabels.fuelType));
  if (specification.horsePower != null) details.push(`${Number(specification.horsePower).toLocaleString()} hp`);
  return details.length ? details.join(' · ') : 'Not specified';
};

const formatTimeRemaining = (value: unknown) => {
  if (typeof value !== 'string') return 'Not specified';
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return 'Not specified';

  const milliseconds = end - Date.now();
  if (milliseconds <= 0) return 'Ended';
  const hours = Math.floor(milliseconds / 3_600_000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}d ${hours % 24}h` : `${Math.max(1, hours)}h`;
};

const buildTagline = (data: any): string => {
  if (data.tagline || data.subtitle) return data.tagline || data.subtitle;
  const spec = data.specification;
  const parts = [
    spec?.engineVolume != null ? `${Number(spec.engineVolume).toFixed(1)}L ${formatEnum(spec?.fuelType, enumLabels.fuelType)}` : null,
    spec?.mileage != null ? `~${Number(spec.mileage).toLocaleString()} Miles` : null,
    spec?.transmission != null ? formatEnum(spec.transmission, enumLabels.transmission) : null,
  ].filter(Boolean);
  return parts.join(', ');
};

const mapServiceHistory = (value: unknown): ServiceHistoryEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry: any) => ({
      date: entry?.date || entry?.performedAt || '',
      mileage: entry?.mileage != null ? String(entry.mileage) : undefined,
      notes: entry?.notes || entry?.description || '',
    }))
    .filter((entry) => entry.date || entry.notes);
};

const mapComments = (value: unknown): Comment[] => {
  if (!Array.isArray(value)) return [];
  return value.map((c: any) => ({
    id: String(c.id),
    user: c.user || c.username || 'Anonymous',
    text: c.text || '',
    time: c.time || 'Just now',
    isSeller: Boolean(c.isSeller),
    isVerified: Boolean(c.isVerified),
    likes: Number(c.likes ?? 0),
    bidAmount: c.bidAmount != null ? Number(c.bidAmount) : undefined,
  }));
};

const mapBids = (value: unknown): Bid[] => {
  if (!Array.isArray(value)) return [];
  return value.map((b: any) => ({
    bidder: b.bidder || b.user || 'Bidder',
    amount: Number(b.amount ?? 0),
    time: b.time || 'Just now',
  }));
};

const mapOtherAuctions = (value: unknown, excludeId: string): OtherAuction[] => {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((item: any) => String(item?.id) !== String(excludeId))
    .slice(0, 5)
    .map((item: any) => ({
      id: String(item.id),
      title: item.title || `${item.year ?? ''} ${item.brandName || item.make || ''} ${item.modelName || item.model || ''}`.trim(),
      subtitle: item.subtitle || item.shortDescription || '',
      location: item.location || '',
      image: normaliseImageList(item.images)[0] || FALLBACK_CAR_IMAGE,
      currentBid: Number(item.currentBid ?? item.listing?.currentPrice ?? 0),
      startingBid: item.startingBid != null ? Number(item.startingBid) : undefined,
      bidCount: Number(item.bidCount ?? item.listing?.bidCount ?? 0),
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
};

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const GavelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 13l-8.5 8.5a2 2 0 0 1-2.83-2.83L11 10" />
    <path d="M16.5 4.5l3 3L15 12l-3-3z" />
    <path d="M13 6l5 5" />
    <path d="M17 2l5 5" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={`chevron-icon ${open ? 'open' : ''}`}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckBadgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="verified-badge-icon">
    <path d="M12 2l2.4 1.6 2.85-.4 1.2 2.55 2.55 1.2-.4 2.85L22.2 12l-1.6 2.4.4 2.85-2.55 1.2-1.2 2.55-2.85-.4L12 22.2l-2.4-1.6-2.85.4-1.2-2.55-2.55-1.2.4-2.85L1.8 12l1.6-2.4-.4-2.85 2.55-1.2 1.2-2.55 2.85.4z" />
    <path d="M9 12.5l2 2 4-4.5" stroke="#0b0b0d" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CommentTabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button type="button" className={`comment-tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
    {label}
  </button>
);

const Car: React.FC<CarProps> = ({ onNavigate, carId }) => {
  const { isAuthenticated, user } = useAuth();

  const activeId = carId ?? '';
  const [carData, setCarData] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Watchlist
  const [isWatched, setIsWatched] = useState(false);
  const [watchAnimation, setWatchAnimation] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  // Bidding
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [currentBidPrice, setCurrentBidPrice] = useState(0);

  // Comments
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentTab, setCommentTab] = useState<CommentTab>('newest');

  // Seller Q&A
  const [qaOpen, setQaOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [questionStatus, setQuestionStatus] = useState('');

  // Sidebar
  const [otherAuctions, setOtherAuctions] = useState<OtherAuction[]>([]);

  useEffect(() => {
    const fetchCar = async () => {
      if (!activeId) {
        setIsLoading(false);
        setLoadError('Vehicle not selected');
        return;
      }

      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch(`/api/cars/${activeId}`);
        if (!response.ok) {
          throw new Error('Failed to load car details');
        }

        const data = await response.json();
        const currentBid = Number(data.currentBid ?? data.listing?.currentPrice ?? 0);
        const mappedImages = normaliseImageList(data.images);
        const mappedCar: CarDetail = {
          id: String(data.id),
          listingId: data.listingId ?? data.listing?.id ?? undefined,
          title: data.title || `${data.year || ''} ${data.brandName || data.make || 'Unknown'} ${data.modelName || data.model || 'model'}`.trim(),
          tagline: buildTagline(data),
          year: Number(data.year ?? 0),
          make: data.brandName || data.make || 'Unknown',
          model: data.modelName || data.model || 'Unknown',
          mileage: data.specification?.mileage != null ? `${Number(data.specification.mileage).toLocaleString()} miles` : 'Not specified',
          engine: formatEngine(data.specification),
          transmission: formatEnum(data.specification?.transmission, enumLabels.transmission),
          drivetrain: formatEnum(data.specification?.driveType, enumLabels.driveType),
          bodyStyle: formatEnum(data.specification?.bodyType, enumLabels.bodyType),
          exteriorColor: data.specification?.color || 'Not specified',
          interiorColor: data.specification?.interiorColor || 'Not specified',
          vin: data.vin || 'Not specified',
          titleStatus: data.titleStatus || data.title_status || 'Not specified',
          location: data.location || 'Location not specified',
          seller: data.sellerName || data.seller || 'Seller',
          sellerType: data.sellerType || (data.isDealer ? 'Dealer' : 'Private Party'),
          currentBid,
          bidCount: Number(data.bidCount ?? data.listing?.bidCount ?? 0),
          watchingCount: Number(data.watchingCount ?? data.watchCount ?? 0),
          viewCount: Number(data.viewCount ?? data.views ?? 0),
          timeRemaining: formatTimeRemaining(data.auctionEnd ?? data.endsAt),
          endsAt: data.auctionEnd || data.endsAt ? new Date(data.auctionEnd ?? data.endsAt).toLocaleString() : 'Not specified',
          images: mappedImages.length > 0 ? mappedImages : [FALLBACK_CAR_IMAGE],
          imageCaption: data.aiSummary || data.imageCaption || '',
          overview: data.overview || data.highlightsOverview || '',
          carfaxReport: data.carfaxReport || data.carfaxSummary || '',
          serviceHistory: mapServiceHistory(data.serviceHistory),
          equipment: Array.isArray(data.equipment) ? data.equipment : [],
          ownershipHistory: data.ownershipHistory || '',
          sellerNotes: data.sellerNotes || data.notes || '',
          description: data.description || `${data.year || ''} ${data.brandName || data.make || 'Unknown'} ${data.modelName || data.model || 'Unknown'} available for auction.`.trim(),
          bids: mapBids(data.bids),
          comments: mapComments(data.comments),
        };

        setCarData(mappedCar);
        setLocalBids(mappedCar.bids);
        setLocalComments(mappedCar.comments);
        setCurrentBidPrice(mappedCar.currentBid);
        setSelectedImageIndex(0);
        setBidAmount('');
        setBidError('');
        setBidSuccess('');
        setIsWatched(false);
        setShowBidModal(false);
        setCommentTab('newest');
      } catch (error) {
        setCarData(null);
        setLoadError('The requested car could not be loaded from the server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
  }, [activeId]);

  useEffect(() => {
    const syncWatchStatus = async () => {
      if (!isAuthenticated || !carData?.listingId) {
        setIsWatched(false);
        return;
      }

      try {
        const response = await apiCall('/users/me/watchlist');
        if (!response.ok) {
          if (response.status === 401) {
            setIsWatched(false);
          }
          return;
        }

        const data = await response.json();
        const watched = Array.isArray(data) && data.some((item: any) => String(item.listingId) === String(carData.listingId));
        setIsWatched(watched);
      } catch {
        setIsWatched(false);
      }
    };

    syncWatchStatus();
  }, [carData?.listingId, isAuthenticated]);

  useEffect(() => {
    const fetchOtherAuctions = async () => {
      if (!activeId) {
        setOtherAuctions([]);
        return;
      }
      try {
        const response = await fetch(`/api/cars?exclude=${activeId}&limit=5`);
        if (!response.ok) throw new Error('Failed to load other auctions');
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.items ?? data.cars ?? [];
        setOtherAuctions(mapOtherAuctions(list, activeId));
      } catch {
        setOtherAuctions([]);
      }
    };

    fetchOtherAuctions();
  }, [activeId]);

  if (isLoading) {
    return (
      <div className="car-detail-page">
        <div className="car-error-page glass-panel">
          <h2>Loading vehicle...</h2>
          <p>Please wait while we load the auction details.</p>
        </div>
      </div>
    );
  }

  if (!carData) {
    return (
      <div className="car-detail-page">
        <div className="car-error-page glass-panel">
          <h2>Vehicle Not Found</h2>
          <p>{loadError || 'The requested car could not be located in our auctions database.'}</p>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleWatchToggle = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save this auction to your watch list.');
      onNavigate('login');
      return;
    }

    if (!carData?.listingId) {
      alert('This auction does not have a listing reference yet.');
      return;
    }

    setWatchLoading(true);
    setWatchAnimation(true);

    try {
      const endpoint = isWatched ? `/users/me/watchlist/${carData.listingId}` : '/users/me/watchlist';
      const options: RequestInit = { method: isWatched ? 'DELETE' : 'POST' };

      if (!isWatched) {
        options.body = JSON.stringify({ listingId: carData.listingId });
      }

      const response = await apiCall(endpoint, options);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Unable to update watchlist' }));
        throw new Error(err.message || 'Unable to update watchlist');
      }

      setIsWatched((prev) => !prev);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Unable to update watchlist.');
    } finally {
      setWatchLoading(false);
      setTimeout(() => setWatchAnimation(false), 600);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: carData?.title, url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard.');
      }
    } catch {
      // Share sheet dismissed by the user - nothing to do.
    }
  };

  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (!isAuthenticated) {
      setBidError('You must sign in to place a bid.');
      return;
    }

    const numericalBid = parseFloat(bidAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericalBid)) {
      setBidError('Please enter a valid bid amount.');
      return;
    }

    if (numericalBid <= currentBidPrice) {
      setBidError(`Bid must be higher than the current bid of $${currentBidPrice.toLocaleString()}.`);
      return;
    }

    (async () => {
      try {
        if (!carData?.listingId) {
          setBidError('Listing information missing.');
          return;
        }

        const resp = await apiCall('/bids', {
          method: 'POST',
          body: JSON.stringify({ listingId: carData.listingId, amount: numericalBid }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ message: 'Bid failed' }));
          setBidError(err.message || 'Bid failed');
          return;
        }

        await resp.json();

        const newBid: Bid = {
          bidder: user?.name || user?.email || 'You',
          amount: numericalBid,
          time: 'Just now',
        };

        setLocalBids([newBid, ...localBids]);
        setCurrentBidPrice(numericalBid);
        setCarData((prev) =>
          prev
            ? {
                ...prev,
                currentBid: numericalBid,
                bidCount: prev.bidCount + 1,
              }
            : prev
        );
        setBidSuccess(`Success! You are currently the highest bidder at $${numericalBid.toLocaleString()}.`);
        setBidAmount('');
      } catch {
        setBidError('Failed to place bid.');
      }
    })();
  };

  const handleLikeComment = async (id: string) => {
    if (likedCommentIds.includes(id)) return;

    try {
      const response = await apiCall(`/cars/comments/${id}/like`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to like comment');

      const data = await response.json();
      setLikedCommentIds([...likedCommentIds, id]);
      setLocalComments(localComments.map((c) => (c.id === id ? { ...c, likes: data.likes ?? c.likes + 1 } : c)));
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    if (!isAuthenticated) {
      alert('Please sign in to post comments.');
      return;
    }

    try {
      const response = await apiCall(`/cars/${activeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentInput.trim() }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const data = await response.json();
      const newComment: Comment = {
        id: data.id,
        user: data.user,
        text: data.text,
        time: data.time,
        isSeller: data.isSeller,
        isVerified: data.isVerified,
        likes: data.likes,
        bidAmount: data.bidAmount != null ? Number(data.bidAmount) : undefined,
      };

      setLocalComments([newComment, ...localComments]);
      setCommentInput('');
    } catch (error) {
      console.error(error);
      alert('Unable to post comment. Please try again.');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    if (!isAuthenticated) {
      alert('Please sign in to ask the seller a question.');
      return;
    }

    try {
      const response = await apiCall(`/cars/${activeId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ text: questionInput.trim() }),
      });
      if (!response.ok) throw new Error('Failed to send question');
      setQuestionInput('');
      setQuestionStatus('Your question has been sent to the seller.');
    } catch {
      setQuestionStatus('Unable to send your question right now. Please try again.');
    }
  };

  const visibleComments: Comment[] = (() => {
    if (commentTab === 'bids') return [];
    let list = [...localComments];
    if (commentTab === 'seller') list = list.filter((c) => c.isSeller);
    if (commentTab === 'upvoted') list = list.sort((a, b) => b.likes - a.likes);
    return list;
  })();

  const equipmentRows = carData.equipment.map((entry) => {
    const separatorIndex = entry.indexOf(':');
    if (separatorIndex === -1) return { label: '', text: entry };
    return { label: entry.slice(0, separatorIndex).trim(), text: entry.slice(separatorIndex + 1).trim() };
  });

  return (
    <div className="car-detail-page">
      {/* Top bar */}
      <div className="detail-topbar">
        <button type="button" className="car-back-btn" onClick={() => onNavigate('home')} aria-label="Back to auctions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="topbar-actions">
          <button
            type="button"
            onClick={handleWatchToggle}
            disabled={watchLoading}
            className={`btn-watch-item ${isWatched ? 'active' : ''} ${watchAnimation ? 'animate-heart' : ''}`}
          >
            <StarIcon filled={isWatched} />
            {isWatched ? 'Watching' : 'Watch'}
          </button>
          <button type="button" className="btn-share" onClick={handleShare}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="vehicle-header">
        <h1 className="vehicle-detail-title">{carData.title}</h1>
        {carData.tagline && <p className="vehicle-tagline">{carData.tagline}</p>}
      </header>

      {/* Stats row */}
      <section className="stats-row">
        <div className="stat-card glass-panel">
          <span className="stat-value">{carData.watchingCount.toLocaleString()}</span>
          <span className="stat-label">
            <StarIcon /> Watching
          </span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value">{carData.viewCount.toLocaleString()}</span>
          <span className="stat-label">
            <EyeIcon /> Views
          </span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-value">{carData.bidCount.toLocaleString()}</span>
          <span className="stat-label">
            <GavelIcon /> Bids count
          </span>
        </div>
      </section>

      {/* Hero gallery */}
      <section className="hero-gallery glass-panel">
        <img src={carData.images[selectedImageIndex]} alt={`${carData.title} view`} className="hero-image" />

        {carData.images.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-nav-btn prev"
              onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : carData.images.length - 1))}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="gallery-nav-btn next"
              onClick={() => setSelectedImageIndex((prev) => (prev < carData.images.length - 1 ? prev + 1 : 0))}
              aria-label="Next photo"
            >
              ›
            </button>
            <div className="gallery-dots">
              {carData.images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`gallery-dot ${selectedImageIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {carData.imageCaption && (
          <div className="hero-caption-box">
            <p>{carData.imageCaption}</p>
          </div>
        )}

        <button type="button" className="btn-place-bid-hero" onClick={() => setShowBidModal(true)}>
          Place Bid
        </button>
      </section>

      {/* Specs */}
      <section className="specs-section glass-panel">
        <div className="specs-grid-2col">
          <div className="specs-col">
            <div className="spec-row">
              <span className="spec-name">Brand</span>
              <span className="spec-value">{carData.make}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Model</span>
              <span className="spec-value">{carData.model}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Mileage</span>
              <span className="spec-value">{carData.mileage}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">VIN</span>
              <span className="spec-value code-font">{carData.vin}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Title Status</span>
              <span className="spec-value">{carData.titleStatus}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Location</span>
              <span className="spec-value">{carData.location}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Seller</span>
              <span className="spec-value">@{carData.seller}</span>
            </div>
          </div>
          <div className="specs-col">
            <div className="spec-row">
              <span className="spec-name">Engine</span>
              <span className="spec-value">{carData.engine}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Drivetrain</span>
              <span className="spec-value">{carData.drivetrain}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Transmission</span>
              <span className="spec-value">{carData.transmission}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Body Style</span>
              <span className="spec-value">{carData.bodyStyle}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Exterior Color</span>
              <span className="spec-value">{carData.exteriorColor}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Interior Color</span>
              <span className="spec-value">{carData.interiorColor}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Seller Type</span>
              <span className="spec-value">{carData.sellerType}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      {(carData.overview || carData.carfaxReport) && (
        <section className="info-section glass-panel">
          <h3 className="section-title">Highlights</h3>
          {carData.overview && (
            <p className="info-paragraph">
              <strong>Overview:</strong> {carData.overview}
            </p>
          )}
          {carData.carfaxReport && (
            <p className="info-paragraph">
              <strong>Carfax Report:</strong> {carData.carfaxReport}
            </p>
          )}
        </section>
      )}

      {/* Service history */}
      <section className="info-section glass-panel">
        <h3 className="section-title">Recent Service History</h3>
        {carData.serviceHistory.length > 0 ? (
          <ul className="service-history-list">
            {carData.serviceHistory.map((entry, index) => (
              <li key={index}>
                <strong>
                  {entry.date}
                  {entry.mileage ? ` (${Number(entry.mileage).toLocaleString()} miles)` : ''}:
                </strong>{' '}
                {entry.notes}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-items-text">No service history has been reported for this vehicle.</p>
        )}
      </section>

      {/* Equipment */}
      {equipmentRows.length > 0 && (
        <section className="info-section glass-panel">
          <h3 className="section-title">Equipment</h3>
          <ul className="equipment-list">
            {equipmentRows.map((row, index) => (
              <li key={index}>
                {row.label && <strong>{row.label}:</strong>} {row.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ownership history */}
      <section className="info-section glass-panel">
        <h3 className="section-title">Ownership History</h3>
        <p className="info-paragraph">{carData.ownershipHistory || 'No ownership history has been reported for this vehicle.'}</p>
      </section>

      {/* Seller notes */}
      <section className="info-section glass-panel seller-notes-section">
        <h3 className="section-title">Seller Notes</h3>
        <p className="info-paragraph">{carData.sellerNotes || 'The seller has not left any additional notes.'}</p>
      </section>

      <div className="content-with-sidebar">
        <div className="main-column">
          {/* Seller Q&A */}
          <section className="qa-section glass-panel">
            <button type="button" className="qa-header" onClick={() => setQaOpen((prev) => !prev)}>
              <h3 className="section-title no-margin">Seller Q&amp;A</h3>
              <span className="qa-ask-link">Ask a Question</span>
              <ChevronIcon open={qaOpen} />
            </button>
            {qaOpen && (
              <form className="qa-form" onSubmit={handleAskQuestion}>
                <textarea
                  placeholder={isAuthenticated ? 'Ask the seller a question about this vehicle...' : 'Please sign in to ask a question.'}
                  disabled={!isAuthenticated}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  rows={3}
                />
                <div className="qa-form-actions">
                  {questionStatus && <span className="qa-status">{questionStatus}</span>}
                  <button type="submit" className="btn btn-primary" disabled={!questionInput.trim() || !isAuthenticated}>
                    Send Question
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Comments */}
          <section className="comments-section glass-panel">
            <h3 className="section-title">Comments ({localComments.length})</h3>

            <div className="comment-tabs">
              <CommentTabButton active={commentTab === 'newest'} onClick={() => setCommentTab('newest')} label="Newest" />
              <CommentTabButton active={commentTab === 'upvoted'} onClick={() => setCommentTab('upvoted')} label="Most Upvoted" />
              <CommentTabButton active={commentTab === 'seller'} onClick={() => setCommentTab('seller')} label="Seller Comments" />
              <CommentTabButton active={commentTab === 'bids'} onClick={() => setCommentTab('bids')} label="Bid History" />
            </div>

            <form className="comment-post-form" onSubmit={handlePostComment}>
              <textarea
                placeholder={isAuthenticated ? 'Leave a comment below' : 'Please sign in to participate in the conversation.'}
                disabled={!isAuthenticated}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                className="comment-textarea"
                rows={2}
              />
              <div className="comment-form-actions">
                <span className="comment-char-count">
                  {commentInput.length} / {COMMENT_MAX_LENGTH}
                </span>
                <button type="submit" className="comment-send-btn" disabled={!commentInput.trim() || !isAuthenticated} aria-label="Post comment">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="comments-feed-thread">
              {commentTab === 'bids' ? (
                localBids.length > 0 ? (
                  localBids.map((bid, index) => (
                    <div key={index} className="bid-log-row">
                      <div className="bidder-meta">
                        <span className="bid-avatar">{bid.bidder.charAt(0).toUpperCase()}</span>
                        <div className="bidder-info">
                          <span className="bidder-name">@{bid.bidder}</span>
                          <span className="bid-timestamp">{bid.time}</span>
                        </div>
                      </div>
                      <div className="bid-amount-log">
                        <span className={`bid-badge-status ${index === 0 ? 'highest-bid' : ''}`}>{index === 0 ? 'High Bid' : 'Outbid'}</span>
                        <span className="bid-logged-price">${bid.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-items-text">No bids have been placed yet. Be the first!</p>
                )
              ) : visibleComments.length > 0 ? (
                visibleComments.map((comment) => (
                  <article key={comment.id} className={`comment-card-box ${comment.isSeller ? 'seller-comment' : ''}`}>
                    <div className="comment-header-row">
                      <div className="commenter-profile">
                        <div className={`avatar ${comment.isSeller ? 'seller-avatar' : ''}`}>{comment.user.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className="comment-username">
                            @{comment.user}
                            {comment.isVerified && <CheckBadgeIcon />}
                          </span>
                          {comment.isSeller && <span className="seller-badge">Seller</span>}
                          <span className="comment-time-ago">{comment.time}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLikeComment(comment.id)}
                        className={`comment-like-action-btn ${likedCommentIds.includes(comment.id) ? 'liked' : ''}`}
                      >
                        <svg viewBox="0 0 24 24" fill={likedCommentIds.includes(comment.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                    <div className="comment-body-text">
                      <p>{comment.text}</p>
                    </div>
                    {comment.bidAmount != null && <span className="comment-bid-tag">Bid ${comment.bidAmount.toLocaleString()}</span>}
                    <div className="comment-footer-actions">
                      <button type="button" className="comment-action-link">
                        Reply
                      </button>
                      <button type="button" className="comment-action-link">
                        Report message
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="no-items-text">No comments yet. Start the conversation!</p>
              )}
            </div>
          </section>
        </div>

        {/* Other auctions sidebar */}
        {otherAuctions.length > 0 && (
          <aside className="sidebar-column">
            <h3 className="section-title">Other auctions</h3>
            <div className="other-auctions-list">
              {otherAuctions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="other-auction-card"
                  onClick={() => onNavigate('car', { carId: item.id })}
                >
                  <div className="oa-thumb-wrap">
                    <img src={item.image} alt={item.title} className="oa-thumb" />
                    {item.tags.length > 0 && (
                      <div className="oa-tags-row">
                        {item.tags.map((tag) => (
                          <span key={tag} className={`oa-tag oa-tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="oa-content">
                    <span className="oa-title">{item.title}</span>
                    {item.subtitle && <span className="oa-subtitle">{item.subtitle}</span>}
                    {item.location && <span className="oa-location">{item.location}</span>}
                    <div className="oa-price-row">
                      {item.startingBid != null && <span className="oa-starting-price">${item.startingBid.toLocaleString()}</span>}
                      <span className="oa-current-price">${(item.currentBid ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Bid modal */}
      {showBidModal && (
        <div className="bid-modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="bid-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bid-modal-close" onClick={() => setShowBidModal(false)} aria-label="Close">
              ×
            </button>
            <h3 className="section-title">Place Your Bid</h3>

            <div className="pricing-stats-block">
              <div className="stat-box">
                <span className="stat-label">Current Bid</span>
                <span className="stat-value text-gradient-accent">${currentBidPrice.toLocaleString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Bids</span>
                <span className="stat-value">{carData.bidCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Time Left</span>
                <span className="stat-value text-gradient-accent">{carData.timeRemaining}</span>
              </div>
            </div>

            <p className="auction-deadline-notice">
              Ends on <strong>{carData.endsAt}</strong>
            </p>

            <form className="place-bid-form" onSubmit={handlePlaceBid}>
              <div className="input-group">
                <span className="currency-symbol">$</span>
                <input
                  type="text"
                  placeholder={`Min bid: $${(currentBidPrice + 500).toLocaleString()}`}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="bid-input-field"
                  autoFocus
                />
                <button type="submit" className="btn btn-primary submit-bid-btn">
                  Place Bid
                </button>
              </div>

              {bidError && <div className="bid-message error-msg">{bidError}</div>}
              {bidSuccess && <div className="bid-message success-msg">{bidSuccess}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Car;