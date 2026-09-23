import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import { useAuth } from '../contexts/AuthContext';
import Pagination from './Pagination';
import './ManagerDashboard.css';

interface ManagerDashboardProps {
  onNavigate: (page: string, params?: { carId?: number | string; auctionId?: string; listingId?: string }) => void;
}

interface AuctionListItem {
  id: string;
  auctionId?: string;
  title: string;
  description: string;
  location: string;
  startingPrice: number;
  currentPrice?: number;
  auctionStart: string;
  auctionEnd: string;
  carId?: string;
  year?: number;
  brandName?: string;
  modelName?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  images?: Array<{ imageUrl?: string; isMain?: boolean } | string>;
  seller?: { name?: string; email?: string };
  sellerName?: string;
  sellerEmail?: string;
  car?: {
    id?: string;
    year?: number;
    vin?: string;
    mileage?: number;
    transmission?: string;
    fuelType?: string;
    model?: { name?: string; brand?: { name?: string } };
    images?: Array<{ imageUrl?: string; isMain?: boolean } | string>;
  };
}

const enumLabels = {
  fuelType: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Gas'],
  transmission: ['Manual', 'Automatic', 'Automated manual', 'CVT'],
};

const formatEnum = (value: unknown, labels: string[]) => {
  if (value == null) return '';
  if (typeof value === 'number') return labels[value] ?? '';
  if (typeof value === 'string' && value.trim()) {
    const num = Number(value);
    if (!Number.isNaN(num) && labels[num]) return labels[num];
    return value;
  }
  return '';
};

const getAuctionImage = (auction: AuctionListItem): string => {
  const list = auction.car?.images ?? auction.images ?? [];
  if (!Array.isArray(list) || list.length === 0) return '';
  const main: any = list.find((img: any) => img && typeof img === 'object' && (img.isMain || img.IsMain)) ?? list[0];
  if (typeof main === 'string') return main;
  return main?.imageUrl || main?.ImageUrl || main?.url || '';
};

const getAuctionId = (auction: AuctionListItem) => auction.id || auction.auctionId || '';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const { isAuthenticated, roles } = useAuth();
  const isAuthorized = roles.includes('Admin') || roles.includes('Moderator');

  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'progress'>('new');

  const [activeAuctions, setActiveAuctions] = useState<AuctionListItem[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeMessage, setActiveMessage] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [activeLoaded, setActiveLoaded] = useState(false);
  const [newPage, setNewPage] = useState(1);
  const [progressPage, setProgressPage] = useState(1);

  const loadAuctions = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiCall('/AuctionModeration/pending');
      if (response.status === 401 || response.status === 403) throw new Error('You do not have permission to view this page.');
      if (!response.ok) {
        let errDetail = 'Unable to load pending auctions.';
        try {
          const body = await response.json();
          errDetail = body?.message || body?.title || errDetail;
        } catch {
          // ignore
        }
        throw new Error(errDetail);
      }
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
      if (response.status === 401 || response.status === 403) throw new Error('You do not have permission to view this page.');
      if (!response.ok) {
        let errDetail = 'Unable to load active auctions.';
        try {
          const body = await response.json();
          errDetail = body?.message || body?.title || errDetail;
        } catch {
          // ignore
        }
        throw new Error(errDetail);
      }
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
    if (isAuthenticated && isAuthorized) void loadAuctions();
    else setLoading(false);
  }, [isAuthenticated, isAuthorized, loadAuctions]);

  // Lazy-load active auctions the first time the "In Progress" tab is opened.
  useEffect(() => {
    if (isAuthenticated && isAuthorized && activeTab === 'progress' && !activeLoaded) {
      void loadActiveAuctions();
    }
  }, [isAuthenticated, isAuthorized, activeTab, activeLoaded, loadActiveAuctions]);

  const refresh = () => {
    if (activeTab === 'progress') void loadActiveAuctions();
    else void loadAuctions();
  };

  const handleApprove = async (auctionId: string) => {
    setApprovingId(auctionId);
    setMessage('');
    try {
      const response = await apiCall(`/AuctionModeration/${auctionId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('The auction could not be approved.');
      await loadAuctions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The auction could not be approved.');
    } finally {
      setApprovingId(null);
    }
  };

  if (!isAuthenticated || !isAuthorized) {
    return (
      <section className="manager-dashboard-container">
        <h1 className="manager-page-title">Dashboard</h1>
        <div className="manager-empty-state">
          {isAuthenticated ? 'You do not have permission to view this page.' : 'Sign in with a manager or admin account to view this page.'}
        </div>
      </section>
    );
  }

  return (
    <section className="manager-dashboard-container">
      <h1 className="manager-page-title">Dashboard</h1>

      {/* Tabs Header */}
      <div className="manager-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'new'}
          className={`manager-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <svg className="manager-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="11" rx="3" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
            <path d="M5 7l2-4h10l2 4" />
          </svg>
          <span>New commission</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'progress'}
          className={`manager-tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <svg className="manager-tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>In Progress</span>
        </button>
      </div>

      {activeTab === 'new' && message && <p className="manager-alert-msg">{message}</p>}
      {activeTab === 'progress' && activeMessage && <p className="manager-alert-msg">{activeMessage}</p>}

      {/* Tab 1: New Commission (Pending Submissions) - 2x2 Grid Layout */}
      {activeTab === 'new' && (
        loading ? (
          <div className="manager-empty-state">Loading submissions...</div>
        ) : auctions.length === 0 ? (
          <div className="manager-empty-state">No auctions are waiting for review.</div>
        ) : (
          <div className="manager-new-commissions-grid">
            {auctions.slice((newPage - 1) * 8, newPage * 8).map((auction) => {
              const imageUrl = getAuctionImage(auction);
              const auctionId = getAuctionId(auction);
              const make = auction.brandName || auction.car?.model?.brand?.name || '';
              const model = auction.modelName || auction.car?.model?.name || '';
              const year = auction.year || auction.car?.year || '';
              const displayTitle = `${year ? `${year} ` : ''}${make} ${model}`.trim() || auction.title;

              return (
                <article className="manager-commission-card" key={auction.id}>
                  <div className="manager-card-thumb-wrapper">
                    {imageUrl ? (
                      <img src={imageUrl} alt={displayTitle} className="manager-card-thumb" />
                    ) : (
                      <div className="manager-card-thumb-empty">No photo</div>
                    )}
                  </div>

                  <div className="manager-card-body">
                    <div>
                      <h2 className="manager-card-title">{displayTitle}</h2>
                      <p className="manager-card-desc">{auction.description}</p>
                    </div>

                    <div className="manager-card-actions">
                      <button
                        type="button"
                        className="manager-btn-view-detail"
                        onClick={() => onNavigate('car', { carId: auction.car?.id ?? auction.carId })}
                      >
                        View Detail information
                      </button>
                      <button type="button" className="manager-btn-chat" disabled={!auctionId} onClick={() => onNavigate('chats', { auctionId })}>
                        Request information
                      </button>
                      <button type="button" className="manager-btn-edit" disabled={!auctionId} onClick={() => onNavigate('manager-edit-listing', { listingId: auctionId })}>
                        Edit listing
                      </button>
                      <button
                        type="button"
                        className="manager-btn-approve"
                        disabled={!auctionId || approvingId === auctionId}
                        onClick={() => auctionId && void handleApprove(auctionId)}
                      >
                        {approvingId === auctionId ? 'Approving…' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            <Pagination page={newPage} pageCount={Math.ceil(auctions.length / 8)} onPageChange={setNewPage} />
          </div>
        )
      )}

      {/* Tab 2: In Progress (Active Auctions) - Horizontal Rows Layout */}
      {activeTab === 'progress' && (
        activeLoading ? (
          <div className="manager-empty-state">Loading active auctions...</div>
        ) : activeAuctions.length === 0 ? (
          <div className="manager-empty-state">No auctions are currently running.</div>
        ) : (
          <div className="manager-progress-list">
            {activeAuctions.slice((progressPage - 1) * 8, progressPage * 8).map((auction) => {
              const imageUrl = getAuctionImage(auction);
              const make = auction.brandName || auction.car?.model?.brand?.name || '';
              const model = auction.modelName || auction.car?.model?.name || '';
              const year = auction.year || auction.car?.year || '';
              const displayTitle = `${year ? `${year} ` : ''}${make} ${model}`.trim() || auction.title;
              const mileage = auction.mileage ?? auction.car?.mileage;
              const rawFuel = auction.fuelType ?? auction.car?.fuelType;
              const rawTrans = auction.transmission ?? auction.car?.transmission;
              const fuel = formatEnum(rawFuel, enumLabels.fuelType) || 'Gasoline';
              const trans = formatEnum(rawTrans, enumLabels.transmission) || 'Automatic';
              const targetCarId = auction.car?.id ?? auction.carId;

              return (
                <article className="manager-progress-row" key={auction.id}>
                  <div className="manager-progress-thumb-wrapper">
                    {imageUrl ? (
                      <img src={imageUrl} alt={displayTitle} className="manager-progress-thumb" />
                    ) : (
                      <div className="manager-progress-thumb-empty">No photo</div>
                    )}
                  </div>

                  <div className="manager-progress-info">
                    <h2 className="manager-progress-title">{displayTitle}</h2>
                    <p className="manager-progress-desc">{auction.description}</p>
                  </div>

                  <div className="manager-progress-badges">
                    {fuel && <span className="manager-pill-badge">{fuel}</span>}
                    {trans && <span className="manager-pill-badge">{trans}</span>}
                    {typeof mileage === 'number' && (
                      <span className="manager-pill-badge">{mileage.toLocaleString()} km</span>
                    )}
                  </div>

                  <div className="manager-progress-actions">
                    <button
                      type="button"
                      className="manager-constructor-btn"
                      onClick={() => targetCarId && onNavigate('car', { carId: targetCarId })}
                    >
                      Car page <span className="manager-action-arrow">›</span>
                    </button>
                  </div>
                </article>
              );
            })}
            <Pagination page={progressPage} pageCount={Math.ceil(activeAuctions.length / 8)} onPageChange={setProgressPage} />
          </div>
        )
      )}

      <div className="manager-footer-refresh">
        <button className="manager-refresh-action-btn" type="button" onClick={refresh}>
          Refresh submissions
        </button>
      </div>
    </section>
  );
};

export default ManagerDashboard;
