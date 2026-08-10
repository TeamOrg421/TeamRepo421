import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';

interface WatchlistItem {
  favoriteId: string;
  listingId: string;
  carId?: string;
  carTitle: string;
  imageUrl?: string;
  currentPrice: number;
  auctionEnd?: string;
  bidCount: number;
}

interface WatchlistPageProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }

    const loadWatchlist = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiCall('/users/me/watchlist');
        if (!response.ok) {
          throw new Error('Failed to load watchlist');
        }

        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setError('Unable to load your saved auctions right now.');
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [isAuthenticated]);

  const handleRemove = async (listingId: string) => {
    try {
      const response = await apiCall(`/users/me/watchlist/${listingId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to remove auction');
      }

      setItems(prev => prev.filter(item => item.listingId !== listingId));
    } catch {
      setError('Unable to remove this auction from your watch list.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-page">
        <div className="profile-header-card glass-panel">
          <div className="profile-empty-state">
            <p className="profile-empty-title">Sign in to see your saved auctions</p>
            <p className="profile-empty-sub">Your watch list will appear here after you sign in.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header-card glass-panel">
        <div className="profile-top-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="profile-username">Watch List</h1>
            <p className="profile-bio">Saved auctions you want to keep an eye on.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('home')}>
            Browse Auctions
          </button>
        </div>

        {loading ? (
          <p className="profile-empty-sub">Loading your saved auctions...</p>
        ) : error ? (
          <p className="profile-empty-sub">{error}</p>
        ) : items.length === 0 ? (
          <div className="profile-empty-state" style={{ marginTop: '1.5rem' }}>
            <p className="profile-empty-title">No saved auctions yet</p>
            <p className="profile-empty-sub">Press “Watch Auction” on any listing to add it here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            {items.map(item => (
              <div
                key={item.favoriteId}
                className="glass-panel"
                role="button"
                tabIndex={0}
                onClick={async () => {
                  // If we already have carId, navigate directly
                  if (item.carId) {
                    onNavigate('car', { carId: item.carId });
                    return;
                  }

                  // Fallback: try to resolve carId by querying cars and matching listingId
                  try {
                    const resp = await apiCall('/cars?size=200');
                    if (!resp.ok) {
                      throw new Error('Failed to resolve vehicle');
                    }
                    const cars = await resp.json();
                    if (Array.isArray(cars)) {
                      const match = cars.find((c: any) => String(c.listingId) === String(item.listingId));
                      if (match && match.id) {
                        onNavigate('car', { carId: match.id });
                        return;
                      }
                    }
                    alert('Vehicle not found. It may have been removed.');
                  } catch (e) {
                    console.error(e);
                    alert('Unable to open auction.');
                  }
                }}
                onKeyDown={async (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    // reuse click handler logic
                    if (item.carId) {
                      onNavigate('car', { carId: item.carId });
                      return;
                    }

                    try {
                      const resp = await apiCall('/cars?size=200');
                      if (!resp.ok) {
                        throw new Error('Failed to resolve vehicle');
                      }
                      const cars = await resp.json();
                      if (Array.isArray(cars)) {
                        const match = cars.find((c: any) => String(c.listingId) === String(item.listingId));
                        if (match && match.id) {
                          onNavigate('car', { carId: match.id });
                          return;
                        }
                      }
                      alert('Vehicle not found. It may have been removed.');
                    } catch (e) {
                      console.error(e);
                      alert('Unable to open auction.');
                    }
                  }
                }}
                style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.carTitle} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 12 }} />
                  ) : (
                    <div style={{ width: 96, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.15)' }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, color: 'white' }}>{item.carTitle}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1' }}>
                      Current bid: ${item.currentPrice.toLocaleString()} • Bids: {item.bidCount}
                    </p>
                    {item.auctionEnd && (
                      <p style={{ margin: '0.2rem 0 0', color: '#94a3b8' }}>
                        Ends: {new Date(item.auctionEnd).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-unwatch-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(item.listingId);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
