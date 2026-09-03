import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
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

interface SavedSearchGroup {
  id: string;
  title: string;
  moreCount: number;
  item: WatchlistCardData;
}

interface WatchlistPageProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

const DEMO_WATCHLIST: WatchlistCardData[] = [
  {
    favoriteId: 'demo-fav-1',
    listingId: 'demo-lot-1',
    carId: '1',
    carTitle: '1991 Nissan Skyline GT-R',
    description: 'Extensively Modified for Racing, Dyno-Verified 706whp, 6-Speed Sequential Manual',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
    currentPrice: 25250,
    timeRemaining: '12:18:03',
    auctionEnd: new Date(Date.now() + 12 * 3600 * 1000 + 18 * 60 * 1000).toISOString(),
    bidCount: 4,
    location: 'Fort Collins, CO 80524',
    isFeatured: true,
    isInspected: true,
    isNoReserve: true,
    isWatched: true,
  },
  {
    favoriteId: 'demo-fav-2',
    listingId: 'demo-lot-2',
    carId: '2',
    carTitle: '2015 Jaguar F-Type R Coupe',
    description: 'Supercharged V8, Italian Racing Red, Texas-Owned',
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
    currentPrice: 25000,
    timeRemaining: '26:12:41',
    auctionEnd: new Date(Date.now() + 26 * 3600 * 1000 + 12 * 60 * 1000).toISOString(),
    bidCount: 2,
    location: 'Austin, TX 78704',
    isFeatured: false,
    isInspected: false,
    isNoReserve: true,
    isWatched: true,
  },
  {
    favoriteId: 'demo-fav-3',
    listingId: 'demo-lot-3',
    carId: '3',
    carTitle: '2022 Porsche 911 Turbo S Coupe',
    description: '580-hp Twin-Turbo Flat-6, Bordeaux White Interior, Unmodified, and additional info.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    currentPrice: 115000,
    timeRemaining: '03:48:12',
    auctionEnd: new Date(Date.now() + 3 * 3600 * 1000 + 48 * 60 * 1000).toISOString(),
    bidCount: 7,
    location: 'Duxbury, MA 02332',
    isFeatured: true,
    isInspected: true,
    isNoReserve: true,
    isWatched: true,
  },
  {
    favoriteId: 'demo-fav-4',
    listingId: 'demo-lot-4',
    carId: '4',
    carTitle: '2020 Porsche Macan S',
    description: '348-hp Turbo V6, Premium Package Plus, California-Owned',
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
    currentPrice: 21750,
    timeRemaining: '60:35:22',
    auctionEnd: new Date(Date.now() + 60 * 3600 * 1000 + 35 * 60 * 1000).toISOString(),
    bidCount: 5,
    location: 'Rockville, MD 20850',
    isFeatured: true,
    isInspected: false,
    isNoReserve: true,
    isWatched: true,
  },
];

const SAVED_SEARCHES: SavedSearchGroup[] = [
  {
    id: 'search-porsche',
    title: 'Porsche',
    moreCount: 21,
    item: {
      favoriteId: 'saved-search-porsche-1',
      listingId: 'saved-search-porsche-lot',
      carId: '3',
      carTitle: '2022 Porsche 911 Turbo S Coupe',
      description: '580-hp Twin-Turbo Flat-6, Bordeaux White Interior, Unmodified, and additional info.',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      currentPrice: 115000,
      timeRemaining: '03:48:12',
      bidCount: 7,
      location: 'Duxbury, MA 02332',
      isFeatured: true,
      isInspected: true,
      isNoReserve: true,
      isWatched: true,
    },
  },
  {
    id: 'search-jaguar',
    title: 'Jaguar F-Type',
    moreCount: 21,
    item: {
      favoriteId: 'saved-search-jag-1',
      listingId: 'saved-search-jag-lot',
      carId: '2',
      carTitle: '2015 Jaguar F-Type R Coupe',
      description: 'Supercharged V8, Italian Racing Red, Texas-Owned',
      imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
      currentPrice: 25000,
      timeRemaining: '26:12:41',
      bidCount: 2,
      location: 'Austin, TX 78704',
      isFeatured: false,
      isInspected: false,
      isNoReserve: true,
      isWatched: true,
    },
  },
];

const TABS = ['Auctions', 'Ending soon', 'New cars', 'Inspected', 'No reserve'] as const;
type TabType = (typeof TABS)[number];

const formatRemainingTime = (auctionEnd?: string, fallback: string = '12:18:03') => {
  if (!auctionEnd) return fallback;
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
  const [items, setItems] = useState<WatchlistCardData[]>(DEMO_WATCHLIST);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems(DEMO_WATCHLIST);
      return;
    }

    const loadWatchlist = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/users/me/watchlist');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: WatchlistCardData[] = data.map((item: any, idx: number) => ({
              favoriteId: item.favoriteId || `fav-${item.listingId}`,
              listingId: String(item.listingId),
              carId: item.carId,
              carTitle: item.carTitle || 'Vehicle',
              description: item.description || DEMO_WATCHLIST[idx % DEMO_WATCHLIST.length].description,
              imageUrl: item.imageUrl || DEMO_WATCHLIST[idx % DEMO_WATCHLIST.length].imageUrl,
              currentPrice: item.currentPrice || DEMO_WATCHLIST[idx % DEMO_WATCHLIST.length].currentPrice,
              timeRemaining: formatRemainingTime(item.auctionEnd, DEMO_WATCHLIST[idx % DEMO_WATCHLIST.length].timeRemaining),
              auctionEnd: item.auctionEnd,
              auctionStart: item.auctionStart,
              bidCount: item.bidCount ?? 1,
              location: item.location || DEMO_WATCHLIST[idx % DEMO_WATCHLIST.length].location,
              isFeatured: idx % 2 === 0,
              isInspected: idx % 2 === 0,
              isNoReserve: true,
              isWatched: true,
            }));
            setItems(mapped);
          } else {
            setItems(DEMO_WATCHLIST);
          }
        } else {
          setItems(DEMO_WATCHLIST);
        }
      } catch {
        setItems(DEMO_WATCHLIST);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [isAuthenticated]);

  const handleToggleWatch = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();

    // Toggle local state
    setItems(prev =>
      prev.map(item => {
        if (item.listingId === listingId) {
          return { ...item, isWatched: !item.isWatched };
        }
        return item;
      })
    );

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

  return (
    <div className="watchlist-page-container">
      {/* ─── Left Sidebar Navigation ───────────────────────────────────────── */}
      <aside className="watchlist-sidebar">
        <button
          type="button"
          className="watchlist-nav-link"
          onClick={() => onNavigate('profile')}
        >
          Profile
        </button>
        <button
          type="button"
          className="watchlist-nav-link"
          onClick={() => onNavigate('seller')}
        >
          Seller dashboard
        </button>
        <button
          type="button"
          className="watchlist-nav-link active"
          onClick={() => onNavigate('watchlist')}
        >
          Watchlist
        </button>
        <button
          type="button"
          className="watchlist-nav-link"
          onClick={() => onNavigate('settings')}
        >
          Settings
        </button>
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────────────── */}
      <main className="watchlist-main-area">
        {/* Header and Filter Tabs */}
        <section className="watchlist-header-section">
          <h1 className="watchlist-title">Watchlist</h1>

          <nav className="watchlist-tabs" aria-label="Watchlist filters">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                className={`watchlist-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </section>

        {/* ─── Main Auctions Grid ────────────────────────────────────────── */}
        {loading ? (
          <div className="watchlist-empty-state">
            <p className="watchlist-empty-sub">Loading your watchlist...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="watchlist-empty-state">
            <p className="watchlist-empty-title">No auctions found</p>
            <p className="watchlist-empty-sub">There are currently no saved items in this category.</p>
          </div>
        ) : (
          <div className="watchlist-grid">
            {filteredItems.map(item => (
              <article
                key={item.favoriteId}
                className="watchlist-car-card"
                onClick={() => handleCardClick(item)}
              >
                {/* Image Section */}
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

                  {/* Star Icon */}
                  <button
                    type="button"
                    className={`watchlist-star-btn ${item.isWatched ? 'watched' : 'unwatched'}`}
                    onClick={(e) => handleToggleWatch(e, item.listingId)}
                    title={item.isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    aria-label="Toggle Watchlist"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={item.isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>

                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <div className="watchlist-featured-badge">Featured</div>
                  )}

                  {/* Bottom Time & Bid Overlay */}
                  <div className="watchlist-time-bid-tag">
                    <span className="tag-time">{item.timeRemaining || '12:18:03'}</span>
                    <span className="tag-sep">|</span>
                    <span className="tag-bid">${item.currentPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Details Section */}
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

        {/* ─── Saved Searches Section ────────────────────────────────────── */}
        <section className="saved-searches-section">
          <h2 className="saved-searches-title">Saved Searches</h2>

          <div className="saved-searches-grid">
            {SAVED_SEARCHES.map(group => (
              <div key={group.id} className="saved-search-item">
                <div className="saved-search-header">
                  <h3 className="saved-search-name">{group.title}</h3>
                  <div className="saved-search-header-right">
                    <button
                      type="button"
                      className="saved-search-btn"
                      onClick={() => onNavigate('home')}
                    >
                      +{group.moreCount} more {group.title}
                    </button>
                    <button
                      type="button"
                      className="saved-search-settings-btn"
                      title="Search Settings"
                      aria-label="Search Settings"
                      onClick={() => alert(`Settings for saved search: ${group.title}`)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search Item Card */}
                <article
                  className="watchlist-car-card"
                  onClick={() => handleCardClick(group.item)}
                >
                  <div className="watchlist-card-img-wrap">
                    {group.item.imageUrl && (
                      <img
                        src={group.item.imageUrl}
                        alt={group.item.carTitle}
                        className="watchlist-card-img"
                        loading="lazy"
                      />
                    )}

                    <button
                      type="button"
                      className={`watchlist-star-btn ${group.item.isWatched ? 'watched' : 'unwatched'}`}
                      onClick={(e) => handleToggleWatch(e, group.item.listingId)}
                      title="Watchlist"
                      aria-label="Toggle Watchlist"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={group.item.isWatched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>

                    {group.item.isFeatured && (
                      <div className="watchlist-featured-badge">Featured</div>
                    )}

                    <div className="watchlist-time-bid-tag">
                      <span className="tag-time">{group.item.timeRemaining || '03:48:12'}</span>
                      <span className="tag-sep">|</span>
                      <span className="tag-bid">${group.item.currentPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="watchlist-card-info">
                    <h2 className="watchlist-card-title">{group.item.carTitle}</h2>
                    {group.item.description && (
                      <p className="watchlist-card-desc">{group.item.description}</p>
                    )}

                    <div className="watchlist-card-badges">
                      {group.item.isInspected && (
                        <span className="badge-pill badge-inspected">Inspected</span>
                      )}
                      {group.item.isNoReserve && (
                        <span className="badge-pill badge-no-reserve">No Reserve</span>
                      )}
                    </div>

                    {group.item.location && (
                      <p className="watchlist-card-location">{group.item.location}</p>
                    )}
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default WatchlistPage;
