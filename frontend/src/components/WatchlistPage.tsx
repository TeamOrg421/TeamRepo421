import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import Pagination from './Pagination';
import './Watchlist.css';

export interface WatchlistCardData {
  favoriteId: string;
  listingId: string;
  carId?: string | number;
  carTitle: string;
  description?: string;
  imageUrl?: string;
  currentPrice: number;
  timeRemaining?: string;
  auctionEnd?: string;
  auctionStart?: string;
  bidCount: number;
  location?: string;
  isFeatured?: boolean;
  isInspected?: boolean;
  isNoReserve?: boolean;
  isWatched?: boolean;
}

interface WatchlistPageProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

const TABS = ['Auctions', 'Ending soon', 'New cars', 'Inspected', 'No reserve'] as const;
const ITEMS_PER_PAGE = 12;
type TabType = (typeof TABS)[number];

const formatRemainingTime = (auctionEnd?: string) => {
  if (!auctionEnd) return 'Ended';
  const end = new Date(auctionEnd).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Auctions');
  const [items, setItems] = useState<WatchlistCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    const loadWatchlist = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/users/me/watchlist');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const mapped: WatchlistCardData[] = data.map((item: any) => ({
              favoriteId: item.favoriteId || `fav-${item.listingId}`,
              listingId: String(item.listingId),
              carId: item.carId,
              carTitle: item.carTitle || 'Vehicle',
              description: item.description || '',
              imageUrl: item.imageUrl || '',
              currentPrice: item.currentPrice || 0,
              timeRemaining: formatRemainingTime(item.auctionEnd),
              auctionEnd: item.auctionEnd,
              auctionStart: item.auctionStart,
              bidCount: item.bidCount ?? 0,
              location: item.location || 'Location not specified',
              isFeatured: item.bidCount > 5,
              isInspected: true,
              isNoReserve: item.startingPrice === 0,
              isWatched: true,
            }));
            setItems(mapped);
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [isAuthenticated]);

  const handleToggleWatch = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();

    setItems(prev => prev.filter(item => item.listingId !== listingId));

    if (isAuthenticated) {
      try {
        await apiCall(`/users/me/watchlist/${listingId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to update watchlist on server', err);
      }
    }
  };

  const handleCardClick = (item: WatchlistCardData) => {
    if (item.carId) {
      onNavigate('car', { carId: item.carId });
    } else {
      onNavigate('home');
    }
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeTab === 'Ending soon') {
      result.sort((a, b) => {
        const timeA = a.auctionEnd ? new Date(a.auctionEnd).getTime() : 9999999999999;
        const timeB = b.auctionEnd ? new Date(b.auctionEnd).getTime() : 9999999999999;
        return timeA - timeB;
      });
    } else if (activeTab === 'New cars') {
      result.sort((a, b) => {
        const timeA = a.auctionStart ? new Date(a.auctionStart).getTime() : 0;
        const timeB = b.auctionStart ? new Date(b.auctionStart).getTime() : 0;
        return timeB - timeA;
      });
    } else if (activeTab === 'Inspected') {
      result = result.filter(item => item.isInspected);
    } else if (activeTab === 'No reserve') {
      result = result.filter(item => item.isNoReserve);
    }

    return result;
  }, [items, activeTab]);

  const pageCount = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const visibleItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="watchlist-page-container">
      <main className="watchlist-main-area">
        <section className="watchlist-header-section">
          <h1 className="watchlist-title">Watchlist</h1>

          <nav className="watchlist-tabs" aria-label="Watchlist filters">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                className={`watchlist-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setPage(1); }}
              >
                {tab}
              </button>
            ))}
          </nav>
        </section>

        {!isAuthenticated ? (
          <div className="watchlist-empty-state">
            <p className="watchlist-empty-title">Sign in to view your Watchlist</p>
            <p className="watchlist-empty-sub">Save your favorite cars and track active auctions in real time.</p>
            <button
              type="button"
              className="saved-search-btn"
              style={{ marginTop: '16px', padding: '10px 24px', fontSize: '14px' }}
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
          </div>
        ) : loading ? (
          <div className="watchlist-empty-state">
            <p className="watchlist-empty-sub">Loading your watchlist...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="watchlist-empty-state">
            <p className="watchlist-empty-title">Your Watchlist is empty</p>
            <p className="watchlist-empty-sub">
              {activeTab === 'Auctions'
                ? 'Explore active auctions and click the heart icon on any car to track its bidding progress.'
                : `No watched cars matching the "${activeTab}" filter.`}
            </p>
            <button
              type="button"
              className="saved-search-btn"
              style={{ marginTop: '16px', padding: '10px 24px', fontSize: '14px' }}
              onClick={() => onNavigate('home')}
            >
              Browse Auctions
            </button>
          </div>
        ) : (
          <div className="watchlist-grid">
            {visibleItems.map(item => (
              <article
                key={item.favoriteId}
                className="watchlist-car-card"
                onClick={() => handleCardClick(item)}
              >
                <div className="watchlist-card-img-wrap">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.carTitle}
                      className="watchlist-card-img"
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1e293b' }} />
                  )}

                  <button
                    type="button"
                    className={`watchlist-heart-btn ${item.isWatched ? 'watched' : 'unwatched'}`}
                    onClick={(e) => handleToggleWatch(e, item.listingId)}
                    title={item.isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    aria-label="Toggle Watchlist"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={item.isWatched ? '#f472b6' : 'none'} stroke={item.isWatched ? '#f472b6' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>

                  {item.isFeatured && (
                    <div className="watchlist-featured-badge">Featured</div>
                  )}

                  <div className="watchlist-time-bid-tag">
                    <span className="tag-time">{item.timeRemaining}</span>
                    <span className="tag-sep">|</span>
                    <span className="tag-bid">${item.currentPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="watchlist-card-info">
                  <h2 className="watchlist-card-title">{item.carTitle}</h2>
                  {item.description && (
                    <p className="watchlist-card-desc">{item.description}</p>
                  )}

                  <div className="watchlist-card-badges">
                    {item.isInspected && (
                      <span className="badge-pill badge-inspected">Inspected</span>
                    )}
                    {item.isNoReserve && (
                      <span className="badge-pill badge-no-reserve">No Reserve</span>
                    )}
                  </div>

                  {item.location && (
                    <p className="watchlist-card-location">{item.location}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {filteredItems.length > 0 && <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />}
      </main>
    </div>
  );
};

export default WatchlistPage;
