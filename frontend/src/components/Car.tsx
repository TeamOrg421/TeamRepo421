import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import { createAuctionConnection, destroyAuctionConnection } from '../services/auctionHub';
import type { BidPayload } from '../services/auctionHub';
import UserProfileLink from './UserProfileLink';
import './Car.css';

interface CarProps {
  onNavigate: (page: string, params?: { carId?: number | string; userId?: string }) => void;
  carId: string | null;
}

interface Bid {
  bidder: string;
  userId?: string;
  amount: number;
  time: string;
}

interface Comment {
  id: string;
  user: string;
  userId?: string;
  userAvatar?: string;
  text: string;
  time: string;
  isSeller?: boolean;
  bidAmount?: number;
  likes: number;
}

interface OtherAuctionCar {
  id: string | number;
  listingId?: string;
  title: string;
  description: string;
  location: string;
  currentBid: number;
  rawAuctionEnd?: string;
  timeRemaining: string;
  imageUrl: string;
  isFeatured?: boolean;
  isInspected?: boolean;
  noReserve?: boolean;
}

interface CarDetail {
  id: string;
  listingId?: string;
  title: string;
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
  location: string;
  seller: string;
  sellerId?: string;
  sellerType: string;
  currentBid: number;
  bidCount: number;
  viewsCount: number;
  watchCount: number;
  auctionStatus: AuctionStatus;
  rawAuctionEnd?: string | null;
  timeRemaining: string;
  endsAt: string;
  listingStatus: string;
  winnerName?: string;
  winnerBid?: number;
  highestBidderId?: string;
  highestBidderName?: string;
  images: string[];
  description: string;
  bids: Bid[];
  comments: Comment[];
}

type AuctionStatus = 'draft' | 'pending' | 'rejected' | 'active' | 'completed' | 'canceled' | 'unknown';

const auctionStatusFromApi = (value: unknown): AuctionStatus => {
  const numericStatuses: Record<number, AuctionStatus> = {
    0: 'draft',
    1: 'pending',
    2: 'rejected',
    3: 'active',
    4: 'completed',
    5: 'canceled'
  };
  if (typeof value === 'number') return numericStatuses[value] ?? 'unknown';
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return ['draft', 'pending', 'rejected', 'active', 'completed', 'canceled'].includes(normalized)
      ? (normalized as AuctionStatus)
      : 'unknown';
  }
  return 'unknown';
};

const FALLBACK_CAR_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 700%22%3E%3Crect width=%221200%22 height=%22700%22 fill=%22%231b1b1b%22/%3E%3Cpath d=%22M250 440h700l-75-165H380z%22 fill=%22%23353535%22/%3E%3Ccircle cx=%22400%22 cy=%22455%22 r=%2260%22 fill=%22%23111111%22 stroke=%22%232563eb%22 stroke-width=%2216%22/%3E%3Ccircle cx=%22800%22 cy=%22455%22 r=%2260%22 fill=%22%23111111%22 stroke=%22%232563eb%22 stroke-width=%2216%22/%3E%3Ctext x=%22600%22 y=%22600%22 fill=%22%2393c5fd%22 font-family=%22Arial,sans-serif%22 font-size=%2240%22 text-anchor=%22middle%22%3ENo photo uploaded%3C/text%3E%3C/svg%3E';

const normaliseImageList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const sorted = [...value].sort((a: any, b: any) => {
    const aMain = Boolean(a && typeof a === 'object' && a.isMain);
    const bMain = Boolean(b && typeof b === 'object' && b.isMain);
    return aMain === bMain ? 0 : aMain ? -1 : 1;
  });
  return sorted
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
  driveType: ['All-wheel drive (AWD)', 'Front-wheel drive (FWD)', 'Rear-wheel drive (RWD)'],
  bodyType: ['Sedan', 'Coupe', 'Hatchback', 'SUV', 'Wagon', 'Convertible', 'Minivan', 'Pickup'],
};

const formatEnum = (value: unknown, labels: string[]) => {
  if (typeof value === 'number') return labels[value] ?? 'Not specified';
  if (typeof value === 'string' && value.trim()) return value;
  return 'Not specified';
};

const formatEngine = (specification: any) => {
  if (!specification) return 'Not specified';
  const details = [];
  if (specification.engineVolume != null) details.push(`${Number(specification.engineVolume).toFixed(1)}L`);
  if (specification.fuelType != null) details.push(formatEnum(specification.fuelType, enumLabels.fuelType));
  if (specification.horsePower != null) details.push(`${Number(specification.horsePower).toLocaleString()} hp`);
  return details.length ? details.join(' · ') : 'Not specified';
};

const parseAuctionDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;
  const str = value.trim();
  if (!str) return null;
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(str);
  const parsed = new Date(hasTimeZone ? str : `${str}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimeRemaining = (value: unknown) => {
  if (!value) return 'Live';
  const end = parseAuctionDate(value)?.getTime();
  if (end == null) return 'Live';
  const milliseconds = end - Date.now();
  if (milliseconds <= 0) return 'Ended';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Car: React.FC<CarProps> = ({ onNavigate, carId }) => {
  const { isAuthenticated, user } = useAuth();
  const activeId = carId ?? '';

  const [carData, setCarData] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [liveTimeRemaining, setLiveTimeRemaining] = useState<string>('Live');

  // Hero & Modal States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  // Watchlist & Share
  const [isWatched, setIsWatched] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Tab filter states
  const [commentFilter, setCommentFilter] = useState<'newest' | 'upvoted' | 'seller' | 'bids'>('newest');
  const [commentInput, setCommentInput] = useState('');

  // Dynamic state
  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [currentBidPrice, setCurrentBidPrice] = useState(0);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [otherAuctions, setOtherAuctions] = useState<OtherAuctionCar[]>([]);

  // SignalR connection ref
  const connectionRef = useRef<import('@microsoft/signalr').HubConnection | null>(null);
  // Ref to prevent double-counting views in React StrictMode
  const viewedCarIdRef = useRef<string | null>(null);

  // ── Live Countdown Interval ───────────────────────────────────
  useEffect(() => {
    const rawTarget = carData?.rawAuctionEnd || carData?.endsAt;
    const update = () => {
      if (rawTarget) {
        setLiveTimeRemaining(formatTimeRemaining(rawTarget));
      }
      setOtherAuctions((prev) =>
        prev.map((o) => ({
          ...o,
          timeRemaining: formatTimeRemaining(o.rawAuctionEnd),
        }))
      );
    };
    update();
    const intervalId = setInterval(update, 1000);
    return () => clearInterval(intervalId);
  }, [carData?.rawAuctionEnd, carData?.endsAt]);

  // ── Fetch Car Details ─────────────────────────────────────────
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
        const currentBid = Number(data.currentBid ?? data.listing?.currentPrice ?? data.startingPrice ?? 0);
        const mappedImages = normaliseImageList(data.images);
        const make = data.brandName || data.make || 'Unknown';
        const model = data.modelName || data.model || 'Model';
        const year = Number(data.year ?? 0);

        // Real tracking of views (strictly +1 per vehicle navigation)
        const storageKey = `car_views_${activeId}`;
        let updatedViews = Number(localStorage.getItem(storageKey) || '0');
        if (viewedCarIdRef.current !== activeId) {
          viewedCarIdRef.current = activeId;
          updatedViews += 1;
          localStorage.setItem(storageKey, String(updatedViews));
        }

        const realWatchers = Number(data.watchCount ?? data.favoritesCount ?? (data.listing?.favorites?.length ?? 0));
        const rawAuctionEnd = data.auctionEnd ?? data.listing?.auctionEnd ?? data.endsAt ?? data.listing?.endsAt ?? null;
        const initialRemaining = formatTimeRemaining(rawAuctionEnd);
        setLiveTimeRemaining(initialRemaining);

        const mappedCar: CarDetail = {
          id: String(data.id),
          listingId: data.listingId ?? data.listing?.id ?? undefined,
          title: data.title || `${year ? `${year} ` : ''}${make} ${model}`.trim(),
          year,
          make,
          model,
          mileage: data.specification?.mileage != null ? `${Number(data.specification.mileage).toLocaleString()} miles` : 'Not specified',
          engine: formatEngine(data.specification),
          transmission: formatEnum(data.specification?.transmission, enumLabels.transmission),
          drivetrain: formatEnum(data.specification?.driveType, enumLabels.driveType),
          bodyStyle: formatEnum(data.specification?.bodyType, enumLabels.bodyType),
          exteriorColor: data.specification?.color || data.specification?.exteriorColor || 'Not specified',
          interiorColor: data.specification?.interiorColor || 'Not specified',
          vin: data.vin || 'Not specified',
          location: data.location || 'Location not specified',
          seller: data.sellerName || data.seller || 'Seller',
          sellerId: data.sellerId,
          sellerType: 'Private Party',
          currentBid,
          bidCount: Number(data.bidCount ?? data.listing?.bidCount ?? (data.listing?.bids?.length ?? 0)),
          viewsCount: updatedViews,
          watchCount: realWatchers,
          auctionStatus: auctionStatusFromApi(data.auctionStatus ?? data.listing?.status ?? 'active'),
          rawAuctionEnd: rawAuctionEnd ? String(rawAuctionEnd) : null,
          timeRemaining: initialRemaining,
          endsAt: parseAuctionDate(rawAuctionEnd)?.toLocaleString() ?? 'Not specified',
          listingStatus: data.listingStatus ?? data.listing?.status ?? 'Active',
          winnerName: data.winnerName ?? data.listing?.winner?.winnerName ?? data.winner?.winnerName ?? undefined,
          winnerBid: Number(data.winningBid ?? data.listing?.winner?.winningBid ?? data.winner?.winningBid ?? 0) || undefined,
          highestBidderId: data.highestBidderId ?? data.listing?.highestBidderId ?? undefined,
          images: mappedImages.length > 0 ? mappedImages : [FALLBACK_CAR_IMAGE],
          description: data.description || `${year ? `${year} ` : ''}${make} ${model} available for auction.`,
          bids: Array.isArray(data.bids)
            ? data.bids.map((b: any) => ({
                bidder: b.userName || b.user || (user?.id && String(b.userId).toLowerCase() === String(user.id).toLowerCase() ? 'You' : 'Bidder'),
                userId: b.userId,
                amount: Number(b.amount),
                time: b.createdAt
                  ? new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Recently',
              }))
            : [],
          comments: []
        };

        // Load real persistent comments from server
        try {
          const commentsRes = await fetch(`/api/cars/${activeId}/comments`);
          if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            if (Array.isArray(commentsData)) {
              mappedCar.comments = commentsData.map((c: any) => ({
                id: String(c.id),
                user: c.user || c.userName || 'User',
                userId: c.userId,
                userAvatar: c.userAvatar || c.profileImageUrl || undefined,
                text: c.text,
                time: c.time ? (new Date(c.time).toLocaleString() !== 'Invalid Date' ? new Date(c.time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : c.time) : 'Just now',
                isSeller: Boolean(c.isSeller),
                likes: Number(c.likes || 0),
                bidAmount: c.bidAmount != null ? Number(c.bidAmount) : undefined
              }));
            }
          }
        } catch {
          // ignore error loading comments
        }

        setCarData(mappedCar);
        setLocalBids(mappedCar.bids);
        setLocalComments(mappedCar.comments);
        setCurrentBidPrice(mappedCar.currentBid);
        setSelectedImageIndex(0);
        setBidAmount('');
        setBidError('');
        setBidSuccess('');
      } catch {
        setCarData(null);
        setLoadError('The requested car could not be loaded from the server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
  }, [activeId]);

  // ── Fetch Other Auctions (Strictly Real Cars) ──────────────────
  useEffect(() => {
    const loadOtherAuctions = async () => {
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to fetch other auctions');
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        const mapped: OtherAuctionCar[] = items
          .filter((item: any) => String(item.id) !== String(activeId))
          .slice(0, 5)
          .map((item: any) => {
            const images = normaliseImageList(item.images);
            const make = item.brandName || item.make || 'Vehicle';
            const model = item.modelName || item.model || '';
            const year = item.year || '';
            const rawEnd = item.auctionEnd ?? item.endsAt;
            return {
              id: item.id,
              listingId: item.listingId,
              title: item.title || `${year ? `${year} ` : ''}${make} ${model}`.trim(),
              description: item.description || `${make} ${model}`,
              location: item.location || 'Location not specified',
              currentBid: Number(item.currentBid ?? item.currentPrice ?? item.startingPrice ?? 0),
              rawAuctionEnd: rawEnd ? String(rawEnd) : undefined,
              timeRemaining: formatTimeRemaining(rawEnd),
              imageUrl: images[0] || FALLBACK_CAR_IMAGE,
              isFeatured: false,
              isInspected: true,
              noReserve: false
            };
          });

        setOtherAuctions(mapped);
      } catch {
        setOtherAuctions([]);
      }
    };

    loadOtherAuctions();
  }, [activeId]);

  // ── SignalR Hub ───────────────────────────────────────────────
  useEffect(() => {
    const listingId = carData?.listingId;
    if (!listingId) return;

    let cancelled = false;

    const connect = async () => {
      try {
        const conn = await createAuctionConnection(listingId);
        if (cancelled) {
          await destroyAuctionConnection(conn, listingId);
          return;
        }
        connectionRef.current = conn;

        conn.on('ReceiveBid', (payload: BidPayload) => {
          const incoming: Bid = {
            bidder: payload.bidder,
            userId: payload.userId,
            amount: payload.amount,
            time: new Date(payload.time).toLocaleTimeString(),
          };
          setLocalBids((prev) => [incoming, ...prev]);
          setCurrentBidPrice(payload.currentPrice);
          setCarData((prev) =>
            prev ? { ...prev, currentBid: payload.currentPrice, bidCount: prev.bidCount + 1 } : prev
          );
        });

        conn.on('AuctionEnded', () => {
          setCarData((prev) => (prev ? { ...prev, timeRemaining: 'Ended' } : prev));
        });
      } catch (err) {
        console.warn('[SignalR] Could not connect to auction hub:', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (connectionRef.current && listingId) {
        destroyAuctionConnection(connectionRef.current, listingId).catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [carData?.listingId]);

  // ── Sync Watchlist ────────────────────────────────────────────
  useEffect(() => {
    const syncWatchStatus = async () => {
      if (!isAuthenticated || !carData?.listingId) {
        setIsWatched(false);
        return;
      }

      try {
        const response = await apiCall('/users/me/watchlist');
        if (!response.ok) {
          setIsWatched(false);
          return;
        }
        const data = await response.json();
        const watched = Array.isArray(data) && data.some((item: any) => String(item.listingId) === String(carData.listingId));
        setIsWatched(watched);
        if (watched && carData && carData.watchCount === 0) {
          setCarData(prev => prev ? { ...prev, watchCount: 1 } : prev);
        }
      } catch {
        setIsWatched(false);
      }
    };

    syncWatchStatus();
  }, [carData?.listingId, isAuthenticated]);

  // ── Actions ───────────────────────────────────────────────────
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

      const nextWatchedState = !isWatched;
      setIsWatched(nextWatchedState);
      setCarData(prev => prev ? { ...prev, watchCount: Math.max(0, prev.watchCount + (nextWatchedState ? 1 : -1)) } : prev);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Unable to update watchlist.');
    } finally {
      setWatchLoading(false);
    }
  };

  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } else {
      alert('Link copied to clipboard!');
    }
  };

  const handleOpenBidModal = () => {
    setBidError('');
    setBidSuccess('');
    setBidAmount('');
    setIsBidModalOpen(true);
  };

  const handlePlaceBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');

    if (carData?.auctionStatus !== 'active' && carData?.timeRemaining === 'Ended') {
      setBidError('This auction has ended and is closed for bidding.');
      return;
    }

    if (isCurrentUserHighestBidder) {
      setBidError('You already hold the highest bid on this auction. You cannot outbid yourself.');
      return;
    }

    if (!isAuthenticated) {
      setBidError('You must sign in to place a bid.');
      return;
    }

    const numericalBid = parseFloat(bidAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericalBid)) {
      setBidError('Please enter a valid bid amount.');
      return;
    }

    const minRequiredBid = currentBidPrice + 250;
    if (numericalBid < minRequiredBid) {
      setBidError(`Bid must be at least $${minRequiredBid.toLocaleString()} ($250 min increment).`);
      return;
    }

    (async () => {
      try {
        if (!carData?.listingId) {
          setCurrentBidPrice(numericalBid);
          setLocalBids([
            { bidder: 'You', amount: numericalBid, time: 'Just now' },
            ...localBids
          ]);
          setBidSuccess(`Success! You placed a bid of $${numericalBid.toLocaleString()}.`);
          setTimeout(() => setIsBidModalOpen(false), 1500);
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

        setBidSuccess(`Success! You placed a bid of $${numericalBid.toLocaleString()}.`);
        setTimeout(() => setIsBidModalOpen(false), 1400);
      } catch {
        setBidError('Failed to place bid. Please check your network connection.');
      }
    })();
  };

  const handleLikeComment = async (id: string) => {
    if (likedCommentIds.includes(id)) return;

    try {
      const response = await apiCall(`/cars/comments/${id}/like`, { method: 'POST' });
      const data = response.ok ? await response.json() : null;
      setLikedCommentIds([...likedCommentIds, id]);
      setLocalComments(
        localComments.map((c) =>
          c.id === id ? { ...c, likes: data?.likes ?? c.likes + 1 } : c
        )
      );
    } catch {
      setLikedCommentIds([...likedCommentIds, id]);
      setLocalComments(
        localComments.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
      );
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    if (!isAuthenticated) {
      alert('Please sign in to post comments.');
      onNavigate('login');
      return;
    }

    try {
      const response = await apiCall(`/cars/${activeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentInput.trim() }),
      });

      const currentUserName = user?.name || user?.email?.split('@')[0] || 'You';
      const currentUserAvatar = user?.profileImageUrl || undefined;

      if (response.ok) {
        const data = await response.json();
        const newComment: Comment = {
          id: data.id || `c-${Date.now()}`,
          user: data.user || data.userName || currentUserName,
          userId: data.userId || user?.id,
          userAvatar: data.userAvatar || data.profileImageUrl || currentUserAvatar,
          text: data.text || commentInput.trim(),
          time: data.time || 'Just now',
          isSeller: data.isSeller || false,
          likes: data.likes || 0,
        };
        setLocalComments([newComment, ...localComments]);
      } else {
        const newComment: Comment = {
          id: `c-${Date.now()}`,
          user: currentUserName,
          userId: user?.id,
          userAvatar: currentUserAvatar,
          text: commentInput.trim(),
          time: 'Just now',
          isSeller: false,
          likes: 0,
        };
        setLocalComments([newComment, ...localComments]);
      }
      setCommentInput('');
    } catch {
      const currentUserName = user?.name || user?.email?.split('@')[0] || 'You';
      const newComment: Comment = {
        id: `c-${Date.now()}`,
        user: currentUserName,
        userId: user?.id,
        userAvatar: user?.profileImageUrl || undefined,
        text: commentInput.trim(),
        time: 'Just now',
        isSeller: false,
        likes: 0,
      };
      setLocalComments([newComment, ...localComments]);
      setCommentInput('');
    }
  };

  // ── Filtered Comments ─────────────────────────────────────────
  const filteredComments = useMemo(() => {
    if (commentFilter === 'upvoted') {
      return [...localComments].sort((a, b) => b.likes - a.likes);
    }
    if (commentFilter === 'seller') {
      return localComments.filter((c) => c.isSeller);
    }
    if (commentFilter === 'bids') {
      return localComments.filter((c) => c.bidAmount != null);
    }
    return localComments;
  }, [commentFilter, localComments]);

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="car-detail-page">
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
          <h2 style={{ color: '#fff', fontSize: '24px' }}>Loading vehicle...</h2>
          <p>Please wait while we load the auction details.</p>
        </div>
      </div>
    );
  }

  if (!carData) {
    return (
      <div className="car-detail-page">
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
          <h2 style={{ color: '#fff', fontSize: '24px' }}>Vehicle Not Found</h2>
          <p>{loadError || 'The requested car could not be located in our auctions database.'}</p>
          <button
            type="button"
            className="hero-place-bid-btn"
            style={{ marginTop: '20px', display: 'inline-block' }}
            onClick={() => onNavigate('home')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const subtitleLine = [carData.engine, carData.mileage !== 'Not specified' ? carData.mileage : '', carData.transmission, carData.location]
    .filter(Boolean)
    .join(' · ');

  const nextMinBid = currentBidPrice + 250;

  const isCurrentUserHighestBidder = Boolean(
    isAuthenticated &&
      user?.id &&
      ((carData?.highestBidderId &&
        String(carData.highestBidderId).toLowerCase() === String(user.id).toLowerCase()) ||
        (carData?.winnerName &&
          ((user.name && carData.winnerName === user.name) ||
            (user.email && carData.winnerName === user.email.split('@')[0]))) ||
        (localBids.length > 0 &&
          (localBids[0].bidder === 'You' ||
            (user.name && localBids[0].bidder === user.name) ||
            (user.email && localBids[0].bidder === user.email.split('@')[0]) ||
            ((localBids[0] as any).userId &&
              String((localBids[0] as any).userId).toLowerCase() === String(user.id).toLowerCase()))))
  );

  return (
    <div className="car-detail-page">
      {/* Top Header Row */}
      <header className="car-header-container">
        <div className="car-header-titles">
          <h1 className="car-main-title">{carData.title}</h1>
          <p className="car-header-subtitle">{subtitleLine}</p>
        </div>

        <div className="car-header-actions">
          <button
            type="button"
            className={`car-action-btn ${isWatched ? 'active' : ''}`}
            onClick={handleWatchToggle}
            disabled={watchLoading}
          >
            <svg viewBox="0 0 24 24" fill={isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>{isWatched ? 'Watching' : 'Watch'}</span>
          </button>

          <button type="button" className="car-action-btn" onClick={handleShareClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span>Share</span>
          </button>

          {shareToast && <div className="share-toast-notification">Link copied to clipboard!</div>}
        </div>
      </header>

      {/* Cinematic Hero Car Showcase */}
      <section className="car-hero-showcase">
        <div className="car-hero-image-wrapper">
          <img
            src={carData.images[selectedImageIndex] || FALLBACK_CAR_IMAGE}
            alt={carData.title}
            className="car-hero-image"
          />
          <div className="car-hero-gradient-overlay" />
        </div>

        {/* Floating Stat Cards (Left) */}
        <div className="hero-floating-stats">
          <div className="hero-stat-card">
            <span className="hero-stat-number">{carData.watchCount}</span>
            <div className="hero-stat-label">
              <span>Watching</span>
              <span>☆</span>
            </div>
          </div>

          <div className="hero-stat-card">
            <span className="hero-stat-number">{carData.viewsCount}</span>
            <div className="hero-stat-label">
              <span>Views</span>
              <span>👁</span>
            </div>
          </div>

          <div className="hero-stat-card">
            <span className="hero-stat-number">{carData.bidCount}</span>
            <div className="hero-stat-label">
              <span>Bids count</span>
              <span>⏱</span>
            </div>
          </div>
        </div>

        {/* Gallery Navigation Controls */}
        {carData.images.length > 1 && (
          <>
            <button
              type="button"
              className="hero-nav-arrow prev"
              onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : carData.images.length - 1))}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-nav-arrow next"
              onClick={() => setSelectedImageIndex((prev) => (prev < carData.images.length - 1 ? prev + 1 : 0))}
              aria-label="Next photo"
            >
              ›
            </button>
          </>
        )}

        {/* Centered Place Bid Action (Bottom Center) */}
        <div className="hero-action-container">
          {liveTimeRemaining === 'Ended' ? (
            isCurrentUserHighestBidder ? (
              <button
                type="button"
                className="hero-place-bid-btn outbid-disabled"
                disabled
                style={{ background: 'rgba(34, 197, 94, 0.25)', borderColor: '#22c55e', color: '#4ade80' }}
              >
                <span className="highest-bid-check">🏆</span> You Won this Auction! (${currentBidPrice.toLocaleString()})
              </button>
            ) : (
              <button
                type="button"
                className="hero-place-bid-btn"
                disabled
                style={{ background: '#334155', cursor: 'default', boxShadow: 'none', color: '#cbd5e1' }}
              >
                Auction Ended · {currentBidPrice > 0 ? `Sold for $${currentBidPrice.toLocaleString()}` : 'No Bids'}
              </button>
            )
          ) : isCurrentUserHighestBidder ? (
            <button
              type="button"
              className="hero-place-bid-btn outbid-disabled"
              disabled
              title="You currently hold the highest bid on this vehicle"
            >
              <span className="highest-bid-check">✓</span> You hold highest bid (${currentBidPrice.toLocaleString()})
            </button>
          ) : (
            <button
              type="button"
              className="hero-place-bid-btn"
              onClick={handleOpenBidModal}
            >
              Place Bid
            </button>
          )}
        </div>
      </section>

      {/* Main Two-Column Content Grid */}
      <div className="car-content-grid">
        {/* Left Column: Specifications, Description & Comments */}
        <div className="car-main-column">
          {/* Specifications Table (2 Column Grid) */}
          <section className="specs-table-wrapper">
            <div className="specs-table-col">
              <div className="specs-row">
                <span className="specs-cell-label">Brand</span>
                <span className="specs-cell-value">{carData.make}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Model</span>
                <span className="specs-cell-value">{carData.model}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Mileage</span>
                <span className="specs-cell-value">{carData.mileage}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">VIN</span>
                <span className="specs-cell-value">{carData.vin}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Title Status</span>
                <span className="specs-cell-value">Clean</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Location</span>
                <span className="specs-cell-value">{carData.location}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Seller</span>
                <span className="specs-cell-value">
                  <UserProfileLink
                    userId={carData.sellerId}
                    name={`👤 ${carData.seller}`}
                    onNavigate={onNavigate}
                    className="seller-link-badge"
                  />
                </span>
              </div>
            </div>

            <div className="specs-table-col">
              <div className="specs-row">
                <span className="specs-cell-label">Engine</span>
                <span className="specs-cell-value">{carData.engine}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Drivetrain</span>
                <span className="specs-cell-value">{carData.drivetrain}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Transmission</span>
                <span className="specs-cell-value">{carData.transmission}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Body Style</span>
                <span className="specs-cell-value">{carData.bodyStyle}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Exterior Color</span>
                <span className="specs-cell-value">{carData.exteriorColor}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Interior Color</span>
                <span className="specs-cell-value">{carData.interiorColor}</span>
              </div>
              <div className="specs-row">
                <span className="specs-cell-label">Seller Type</span>
                <span className="specs-cell-value">{carData.sellerType}</span>
              </div>
            </div>
          </section>

          {/* Description Section */}
          {carData.description && (
            <section className="car-detail-section">
              <h2 className="car-section-title">Description</h2>
              <p className="car-section-paragraph">{carData.description}</p>
            </section>
          )}

          {/* Comments Discussion Section */}
          <section className="comments-container">
            <div className="comments-header-row">
              <h2 className="comments-title">Comments</h2>
              <div className="comments-filters">
                <button
                  type="button"
                  className={`comment-filter-btn ${commentFilter === 'newest' ? 'active' : ''}`}
                  onClick={() => setCommentFilter('newest')}
                >
                  Newest
                </button>
                <button
                  type="button"
                  className={`comment-filter-btn ${commentFilter === 'upvoted' ? 'active' : ''}`}
                  onClick={() => setCommentFilter('upvoted')}
                >
                  Most Upvoted
                </button>
                <button
                  type="button"
                  className={`comment-filter-btn ${commentFilter === 'seller' ? 'active' : ''}`}
                  onClick={() => setCommentFilter('seller')}
                >
                  Seller Comments
                </button>
                <button
                  type="button"
                  className={`comment-filter-btn ${commentFilter === 'bids' ? 'active' : ''}`}
                  onClick={() => setCommentFilter('bids')}
                >
                  Bid History
                </button>
              </div>
            </div>

            {/* Comment Post Form */}
            <form className="comment-input-form" onSubmit={handlePostComment}>
              <div className="comment-input-bar">
                <input
                  type="text"
                  maxLength={180}
                  placeholder={isAuthenticated ? 'Leave a Comment below' : 'Sign in to leave a comment'}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={!isAuthenticated}
                  className="comment-input-field"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || !isAuthenticated}
                  className="comment-send-btn"
                  aria-label="Send comment"
                >
                  ↑
                </button>
              </div>
              <div className="comment-char-counter">{commentInput.length} / 180</div>
            </form>

            {/* Comments List */}
            <div className="comments-list">
              {filteredComments.length > 0 ? (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-user-row">
                      <div className="comment-avatar">
                        {comment.userAvatar ? (
                          <img
                            src={comment.userAvatar}
                            alt={comment.user}
                            className="comment-avatar-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              const initialSpan = parent?.querySelector('.comment-avatar-initial') as HTMLElement;
                              if (initialSpan) initialSpan.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span className="comment-avatar-initial" style={comment.userAvatar ? { display: 'none' } : undefined}>
                          {comment.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="comment-author-name">
                        <UserProfileLink
                          userId={comment.userId}
                          name={comment.user}
                          onNavigate={onNavigate}
                          className="seller-link-badge"
                        />
                        <span className="comment-verified-icon">✓</span>
                      </div>
                      <span className="comment-timestamp">{comment.time}</span>
                      {comment.isSeller && <span className="comment-seller-badge">Seller</span>}
                    </div>

                    <p className="comment-message">{comment.text}</p>

                    {comment.bidAmount && (
                      <div className="comment-bid-pill">
                        <span>Bid</span>
                        <span style={{ color: '#38bdf8' }}>${comment.bidAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="comment-actions-row">
                      <button type="button" className="comment-action-link" onClick={() => setCommentInput(`@${comment.user} `)}>
                        Reply ↪
                      </button>
                      <button
                        type="button"
                        className={`comment-action-link ${likedCommentIds.includes(comment.id) ? 'liked' : ''}`}
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        ♥ {comment.likes}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', margin: '8px 0' }}>
                  No comments in this section yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Other Auctions Sidebar (Real Data) */}
        <aside className="other-auctions-sidebar">
          <h2 className="other-auctions-title">Other auctions</h2>
          {otherAuctions.length > 0 ? (
            <div className="other-auctions-list">
              {otherAuctions.map((item) => (
                <article
                  key={String(item.id)}
                  className="other-auction-card"
                  onClick={() => onNavigate('car', { carId: item.id })}
                >
                  <div className="other-auction-image-container">
                    <img src={item.imageUrl} alt={item.title} className="other-auction-image" />
                    <button
                      type="button"
                      className="other-auction-fav-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Save auction"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                    <div className="other-auction-img-bottom">
                      <div className="other-auction-timer-badge">
                        <svg
                          viewBox="0 0 24 24"
                          width="12"
                          height="12"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{item.timeRemaining}</span>
                      </div>
                      <div className="other-auction-price-badge">
                        <span className="other-auction-dollar-circle">$</span>
                        <span>${item.currentBid.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="other-auction-body">
                    <h3 className="other-auction-name">{item.title}</h3>
                    <p className="other-auction-subtitle">{item.description}</p>
                    <p className="other-auction-location">{item.location}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
              No other active auctions currently listed.
            </p>
          )}
        </aside>
      </div>

      {/* Place Bid Modal Popup */}
      {isBidModalOpen && (
        <div className="bid-modal-backdrop" onClick={() => setIsBidModalOpen(false)}>
          <div className="bid-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="bid-modal-close-btn"
              onClick={() => setIsBidModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="bid-modal-thumb-wrapper">
              <img
                src={carData.images[0] || FALLBACK_CAR_IMAGE}
                alt={carData.title}
                className="bid-modal-thumb"
              />
            </div>

            <h3 className="bid-modal-title">{carData.title}</h3>

            <div className="bid-modal-stats-row">
              <div className="bid-modal-price-badge">
                <span className="car-hero-dollar-circle">$</span>
                <span>Last Bid: <strong className="bid-modal-last-bid">${currentBidPrice.toLocaleString()}</strong></span>
              </div>
              <div className="bid-modal-timer-badge">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{liveTimeRemaining}</span>
              </div>
            </div>

            {isCurrentUserHighestBidder && (
              <div className="bid-modal-status-msg warning">
                ✓ You currently hold the highest bid (${currentBidPrice.toLocaleString()}). You cannot outbid yourself.
              </div>
            )}

            <form className="bid-modal-form" onSubmit={handlePlaceBidSubmit}>
              <input
                type="text"
                placeholder={`Bid ${nextMinBid.toLocaleString()} or more`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="bid-modal-input"
                disabled={isCurrentUserHighestBidder}
                autoFocus={!isCurrentUserHighestBidder}
              />

              {bidError && <div className="bid-modal-status-msg error">{bidError}</div>}
              {bidSuccess && <div className="bid-modal-status-msg success">{bidSuccess}</div>}

              <button
                type="submit"
                className="bid-modal-submit-btn"
                disabled={isCurrentUserHighestBidder}
              >
                {isCurrentUserHighestBidder ? 'You are Leading Bidder' : 'Make a bid'}
              </button>
            </form>

            <p className="bid-modal-footer-note">Minimum bid increment is $250. All bids in USD.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Car;
