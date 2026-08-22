import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';

interface SellerDashboardProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface SellerListing {
  listingId: string;
  carId: string;
  title: string;
  vehicle: string;
  imageUrl: string;
  location: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  auctionStart: string;
  auctionEnd: string;
  bidCount: number;
  watcherCount: number;
}

interface DashboardStats {
  totalListings: number;
  liveListings: number;
  scheduledListings: number;
  completedListings: number;
  totalBids: number;
  totalWatchers: number;
}

const emptyStats: DashboardStats = {
  totalListings: 0,
  liveListings: 0,
  scheduledListings: 0,
  completedListings: 0,
  totalBids: 0,
  totalWatchers: 0,
};

const getListingState = (listing: SellerListing) => {
  const now = Date.now();
  const start = new Date(listing.auctionStart).getTime();
  const end = new Date(listing.auctionEnd).getTime();

  if (listing.status === 'Completed' || (Number.isFinite(end) && end <= now)) return 'Ended';
  if (Number.isFinite(start) && start > now) return 'Scheduled';
  return listing.status === 'Active' ? 'Live' : listing.status;
};

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { isAuthenticated, user } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiCall('/users/me/seller-dashboard');
        if (!response.ok) throw new Error('Unable to load seller dashboard.');

        const data = await response.json();
        setListings(Array.isArray(data.listings) ? data.listings : []);
        setStats({ ...emptyStats, ...(data.stats ?? {}) });
      } catch {
        setError('Unable to load your auctions right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAuthenticated]);

  const totalCurrentValue = useMemo(
    () => listings.reduce((sum, listing) => sum + Number(listing.currentPrice ?? 0), 0),
    [listings],
  );

  if (!isAuthenticated) {
    return (
      <section className="seller-dashboard-page">
        <div className="seller-empty glass-panel">
          <h1>Seller Dashboard</h1>
          <p>Sign in to manage the auctions you have created.</p>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('login')}>Sign In</button>
        </div>
      </section>
    );
  }

  return (
    <section className="seller-dashboard-page">
      <header className="seller-dashboard-header">
        <div>
          <p className="seller-eyebrow">Seller Dashboard</p>
          <h1>Your auctions</h1>
          <p>Manage the listings you have published, and track bids and watchers.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('sellCar')}>Sell a car</button>
      </header>

      <div className="seller-stats-grid">
        <div className="seller-stat glass-panel"><span>Live auctions</span><strong>{stats.liveListings}</strong></div>
        <div className="seller-stat glass-panel"><span>All listings</span><strong>{stats.totalListings}</strong></div>
        <div className="seller-stat glass-panel"><span>Total bids</span><strong>{stats.totalBids}</strong></div>
        <div className="seller-stat glass-panel"><span>Watchers</span><strong>{stats.totalWatchers}</strong></div>
        <div className="seller-stat seller-stat-wide glass-panel"><span>Current listed value</span><strong>${totalCurrentValue.toLocaleString()}</strong></div>
      </div>

      <div className="seller-listing-section glass-panel">
        <div className="seller-listing-heading">
          <div>
            <h2>{user?.name || 'Your'} listings</h2>
            <p>{stats.scheduledListings} scheduled · {stats.completedListings} completed or ended</p>
          </div>
        </div>

        {loading ? (
          <p className="seller-muted">Loading your auctions…</p>
        ) : error ? (
          <p className="seller-error">{error}</p>
        ) : listings.length === 0 ? (
          <div className="seller-empty">
            <h3>No auctions yet</h3>
            <p>Create your first listing and it will appear here.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('sellCar')}>Create an auction</button>
          </div>
        ) : (
          <div className="seller-listings">
            {listings.map((listing) => {
              const state = getListingState(listing);
              return (
                <article className="seller-listing" key={listing.listingId}>
                  {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title} /> : <div className="seller-listing-image-placeholder">No photo</div>}
                  <div className="seller-listing-main">
                    <div className="seller-listing-topline">
                      <span className={`seller-status seller-status-${state.toLowerCase()}`}>{state}</span>
                      <span>{listing.location || 'Location not specified'}</span>
                    </div>
                    <h3>{listing.title}</h3>
                    <p>{listing.vehicle}</p>
                    <small>Ends {new Date(listing.auctionEnd).toLocaleString()}</small>
                  </div>
                  <div className="seller-listing-metrics">
                    <div><span>Current bid</span><strong>${Number(listing.currentPrice).toLocaleString()}</strong></div>
                    <div><span>Bids</span><strong>{listing.bidCount}</strong></div>
                    <div><span>Watchers</span><strong>{listing.watcherCount}</strong></div>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => onNavigate('car', { carId: listing.carId })}>View</button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SellerDashboard;
