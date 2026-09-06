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

interface SellerComment {
  id: string | number;
  text: string;
  carId: string;
  carTitle: string;
  imageUrl: string;
}

type DashboardTab = 'progress' | 'live' | 'comments' | 'past';

const tabItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
  { id: 'progress', label: 'In Progress', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 1-8.5 12M3 8V3h5M12 7v5l3.5 2" /></svg> },
  { id: 'live', label: 'Live Auctions', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14V9h11l3 3h3a1 1 0 0 1 1 1v3h-2M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 14h9" /></svg> },
  { id: 'comments', label: 'Comments', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h-.5A2.5 2.5 0 0 1 4 13.5z" /></svg> },
  { id: 'past', label: 'Past Listings', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3v5a4 4 0 0 0 8 0V3M16 21v-5a4 4 0 0 0-8 0v5M8 8l8 8" /></svg> },
];

const getListingState = (listing: SellerListing) => {
  const now = Date.now();
  const start = new Date(listing.auctionStart).getTime();
  const end = new Date(listing.auctionEnd).getTime();
  if (listing.status === 'Completed' || listing.status === 'Canceled' || (Number.isFinite(end) && end <= now)) return 'past';
  if (listing.status === 'Active' && Number.isFinite(start) && start <= now) return 'live';
  return 'progress';
};

const formatPrice = (value: number) => `$${Number(value ?? 0).toLocaleString()}`;

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date to be announced' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit' }).format(date);
};

const getTimeRemaining = (value: string, now: number) => {
  const ms = new Date(value).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return 'Ended';
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000) % 24;
  const days = Math.floor(ms / 86400000);
  return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ListingImage: React.FC<{ listing: SellerListing }> = ({ listing }) => listing.imageUrl
  ? <img className="seller-dashboard-image" src={listing.imageUrl} alt={listing.title} />
  : <div className="seller-dashboard-image seller-dashboard-image-empty">No photo</div>;

const ListingTags: React.FC<{ listing: SellerListing; includeInspection?: boolean }> = ({ listing, includeInspection = false }) => (
  <div className="seller-dashboard-tags">
    <span>{listing.status === 'Active' ? 'Live auction' : listing.status}</span>
    {listing.location && <span>{listing.location}</span>}
    {includeInspection && <b>Inspected</b>}
  </div>
);

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [comments, setComments] = useState<SellerComment[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTab>('progress');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    const loadDashboard = async () => {
      try {
        setLoading(true); setError('');
        const [dashboardResponse, commentsResponse] = await Promise.all([apiCall('/users/me/seller-dashboard'), apiCall('/users/me/comments')]);
        if (!dashboardResponse.ok) throw new Error('Unable to load seller dashboard.');
        const dashboard = await dashboardResponse.json();
        setListings(Array.isArray(dashboard.listings) ? dashboard.listings : []);
        if (commentsResponse.ok) {
          const commentData = await commentsResponse.json();
          setComments(Array.isArray(commentData) ? commentData : []);
        }
      } catch { setError('Unable to load your auctions right now. Please try again.'); }
      finally { setLoading(false); }
    };
    void loadDashboard();
  }, [isAuthenticated]);

  const tabListings = useMemo(() => listings.filter((listing) => getListingState(listing) === activeTab), [activeTab, listings, now]);

  if (!isAuthenticated) return <section className="seller-dashboard-page"><div className="seller-dashboard-empty"><h1>Dashboard</h1><p>Sign in to manage your listings.</p><button type="button" onClick={() => onNavigate('login')}>Sign In</button></div></section>;

  const renderListing = (listing: SellerListing) => {
    const state = getListingState(listing);
    const isLive = state === 'live';
    const isPast = state === 'past';
    return <article className="seller-dashboard-row" key={listing.listingId}>
      <ListingImage listing={listing} />
      <div className="seller-dashboard-copy"><h2>{listing.title || listing.vehicle}</h2>{listing.vehicle && listing.title !== listing.vehicle && <p>{listing.vehicle}</p>}<ListingTags listing={listing} includeInspection={!isPast} /></div>
      <div className="seller-dashboard-summary">
        {isLive ? <><span>Time left</span><strong className="seller-dashboard-time">{getTimeRemaining(listing.auctionEnd, now)}</strong><span>Current bid</span><strong className="seller-dashboard-bid">{formatPrice(listing.currentPrice)}</strong></> : isPast ? <><span>{listing.status === 'Canceled' ? 'Ended' : 'Sold for'}</span><strong>{formatPrice(listing.currentPrice)}</strong></> : <><strong>Will be published on {formatDate(listing.auctionStart)}</strong><small>{listing.status === 'Rejected' ? 'Listing needs changes' : 'No additional information needed.'}</small></>}
      </div>
      <div className="seller-dashboard-actions">{!isPast && <button type="button" onClick={() => onNavigate('car', { carId: listing.carId })}>{isLive ? 'See details' : 'Open chat'}</button>}<button type="button" onClick={() => onNavigate('car', { carId: listing.carId })}>See details <span aria-hidden="true">›</span></button></div>
    </article>;
  };

  return <section className="seller-dashboard-page" aria-label="Seller dashboard">
    <h1>Dashboard</h1>
    <div className="seller-dashboard-tabs" role="tablist" aria-label="Seller dashboard sections">
      {tabItems.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}><i>{tab.icon}</i><span>{tab.label}</span></button>)}
    </div>
    {loading ? <div className="seller-dashboard-empty">Loading your listings...</div> : error ? <div className="seller-dashboard-empty seller-dashboard-error">{error}</div> : activeTab === 'comments' ? (
      comments.length ? <div className="seller-dashboard-list seller-dashboard-comments">{comments.map((comment) => <article className="seller-dashboard-row" key={comment.id}><div className="seller-dashboard-image seller-dashboard-image-empty">{comment.imageUrl ? <img src={comment.imageUrl} alt="" /> : 'No photo'}</div><div className="seller-dashboard-copy"><h2>{comment.carTitle}</h2><p>{comment.text}</p></div><div className="seller-dashboard-actions"><button type="button" onClick={() => onNavigate('car', { carId: comment.carId })}>See comment <span aria-hidden="true">›</span></button></div></article>)}</div> : <div className="seller-dashboard-empty">No comments yet.</div>
    ) : tabListings.length ? <div className="seller-dashboard-list">{tabListings.map(renderListing)}</div> : <div className="seller-dashboard-empty"><p>{activeTab === 'live' ? 'No live auctions right now.' : activeTab === 'past' ? 'No past listings yet.' : 'No listings in progress.'}</p><button type="button" onClick={() => onNavigate('sellCar')}>Sell a car</button></div>}
  </section>;
};

export default SellerDashboard;
