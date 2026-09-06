import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';
import './ManagerDashboard.css';

interface ManagerDashboardProps {
  onNavigate: (page: string, params?: { carId?: number | string; auctionId?: string }) => void;
}

interface AuctionListItem {
  id: string;
  auctionId?: string;
  title: string;
  description: string;
  location: string;
  startingPrice: number;
  auctionStart: string;
  auctionEnd: string;
  carId?: string;
  images?: Array<{ imageUrl?: string; isMain?: boolean }>;
  seller?: { name?: string; email?: string };
  car?: {
    id?: string;
    year?: number;
    vin?: string;
    mileage?: number;
    transmission?: string;
    fuelType?: string;
    model?: { name?: string; brand?: { name?: string } };
    images?: Array<{ imageUrl?: string; isMain?: boolean }>;
  };
}

const getAuctionImage = (auction: AuctionListItem) => {
  const images = auction.car?.images ?? auction.images ?? [];
  return images.find((image) => image.isMain)?.imageUrl ?? images[0]?.imageUrl ?? '';
};

const getAuctionId = (auction: AuctionListItem) => auction.id || auction.auctionId || '';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const { isAuthenticated } = useAuth();

  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'progress'>('new');

  const [activeAuctions, setActiveAuctions] = useState<AuctionListItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState('');
  const [activeLoaded, setActiveLoaded] = useState(false);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiCall('/AuctionModeration/pending');
      if (!response.ok) throw new Error('Unable to load pending auctions.');
      const data = await response.json();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load pending auctions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveAuctions = useCallback(async () => {
    setActiveLoading(true);
    setActiveMessage('');
    try {
      const response = await apiCall('/AuctionModeration/active');
      if (!response.ok) throw new Error('Unable to load active auctions.');
      const data = await response.json();
      setActiveAuctions(Array.isArray(data) ? data : []);
    } catch (error) {
      setActiveMessage(error instanceof Error ? error.message : 'Unable to load active auctions.');
    } finally {
      setActiveLoading(false);
      setActiveLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadAuctions();
    else setLoading(false);
  }, [isAuthenticated, loadAuctions]);

  // Lazy-load active auctions the first time the "In Progress" tab is opened.
  useEffect(() => {
    if (isAuthenticated && activeTab === 'progress' && !activeLoaded) {
      void loadActiveAuctions();
    }
  }, [isAuthenticated, activeTab, activeLoaded, loadActiveAuctions]);

  const approve = async (id: string) => {
    const response = await apiCall(`/AuctionModeration/${id}/approve`, { method: 'POST' });
    if (!response.ok) {
      setMessage('The auction could not be approved.');
      return;
    }
    setAuctions((current) => current.filter((auction) => auction.id !== id));
  };

  const reject = async (id: string) => {
    if (!reason.trim()) {
      setMessage('Add a reason before rejecting the auction.');
      return;
    }
    const response = await apiCall(`/AuctionModeration/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (!response.ok) {
      setMessage('The auction could not be rejected.');
      return;
    }
    setAuctions((current) => current.filter((auction) => auction.id !== id));
    setRejectingId(null);
    setReason('');
  };

  const refresh = () => {
    if (activeTab === 'progress') void loadActiveAuctions();
    else void loadAuctions();
  };

  return (
    <section className="dashboard-reference-page manager-reference-page">
      <h1>Manager Dashboard</h1>
      <div className="dashboard-tabs" role="tablist" aria-label="Manager dashboard sections">
        <button className={activeTab === 'new' ? 'dashboard-tab active' : 'dashboard-tab'} onClick={() => setActiveTab('new')} type="button">
          <span className="dashboard-tab-icon">▱</span><span>New commission</span>
        </button>
        <button className={activeTab === 'progress' ? 'dashboard-tab active' : 'dashboard-tab'} onClick={() => setActiveTab('progress')} type="button">
          <span className="dashboard-tab-icon">◷</span><span>In Progress</span>
        </button>
      </div>

      {activeTab === 'new' && message && <p className="manager-message">{message}</p>}
      {activeTab === 'progress' && activeMessage && <p className="manager-message">{activeMessage}</p>}

      {activeTab === 'progress' ? (
        activeLoading ? (
          <div className="manager-reference-empty">Loading active auctions...</div>
        ) : activeAuctions.length === 0 ? (
          <div className="manager-reference-empty">No auctions are currently running.</div>
        ) : (
          <div className="dashboard-progress-grid">
            {activeAuctions.map((auction) => {
              const imageUrl = getAuctionImage(auction);
              const auctionId = getAuctionId(auction);
              const make = auction.car?.model?.brand?.name ?? '';
              const model = auction.car?.model?.name ?? '';
              return (
                <div className="dashboard-progress-card" key={auction.id}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={auction.title} />
                  ) : (
                    <div className="manager-reference-image-placeholder dashboard-progress-image-empty">No photo</div>
                  )}
                  <div className="dashboard-progress-copy">
                    <h2>{auction.car?.year ?? ''} {make} {model}</h2>
                    <p>{auction.description}</p>
                    <div className="dashboard-car-meta">
                      {auction.car?.fuelType && <span>{auction.car.fuelType}</span>}
                      {auction.car?.transmission && <span>{auction.car.transmission}</span>}
                      {typeof auction.car?.mileage === 'number' && <span>{auction.car.mileage.toLocaleString()} km</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => auctionId && onNavigate('auction-review', { carId: auction.car?.id ?? auction.carId, auctionId })}
                    >
                      Review details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : loading ? (
        <div className="manager-reference-empty">Loading submissions...</div>
      ) : auctions.length === 0 ? (
        <div className="manager-reference-empty">No auctions are waiting for review.</div>
      ) : (
        <div className="dashboard-commission-list manager-commission-list">
          {auctions.map((auction) => {
            const imageUrl = getAuctionImage(auction);
            const auctionId = getAuctionId(auction);
            const make = auction.car?.model?.brand?.name ?? '';
            const model = auction.car?.model?.name ?? '';
            return (
              <article className="dashboard-commission-row manager-commission-row" key={auction.id}>
                {imageUrl ? <img src={imageUrl} alt={auction.title} /> : <div className="manager-reference-image-placeholder">No photo</div>}
                <div className="dashboard-car-copy">
                  <h2>{auction.title}</h2>
                  <p>{auction.car?.year ?? ''} {make} {model} · {auction.description}</p>
                  <div className="dashboard-car-meta">
                    <span>Pending</span><span>{auction.location}</span><span>${Number(auction.startingPrice).toLocaleString()}</span>
                  </div>
                  {rejectingId === auction.id && <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection" rows={3} />}
                </div>
                <div className="manager-reference-actions">
                  <button className="manager-reference-approve" type="button" onClick={() => void approve(auction.id)}>Approve <b>›</b></button>
                  {rejectingId === auction.id ? <><button className="manager-reference-reject" type="button" onClick={() => void reject(auction.id)}>Confirm reject</button><button type="button" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</button></> : <button className="manager-reference-reject" type="button" onClick={() => setRejectingId(auction.id)}>Reject <b>›</b></button>}
                  <button type="button" onClick={() => auctionId && onNavigate('auction-review', { carId: auction.car?.id ?? auction.carId, auctionId })}>Review details <b>›</b></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <button className="manager-reference-refresh" type="button" onClick={refresh}>Refresh submissions</button>
    </section>
  );
};

export default ManagerDashboard;