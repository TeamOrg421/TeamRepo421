import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';

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
  likes: number;
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
  currentBid: number;
  bidCount: number;
  timeRemaining: string;
  endsAt: string;
  images: string[];
  highlights: string[];
  equipment: string[];
  modifications: string[];
  flaws: string[];
  description: string;
  bids: Bid[];
  comments: Comment[];
}

const Car: React.FC<CarProps> = ({ onNavigate, carId }) => {
  const { isAuthenticated, user } = useAuth();
  
  const activeId = carId ?? '';
  const [carData, setCarData] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Component States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'bids'>('overview');
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  
  // Watchlist state
  const [isWatched, setIsWatched] = useState(false);
  const [watchAnimation, setWatchAnimation] = useState(false);

  // Local state for comments & bids to make page interactive
  const [localBids, setLocalBids] = useState<Bid[]>([]);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [currentBidPrice, setCurrentBidPrice] = useState(0);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');

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
        const mappedCar: CarDetail = {
              id: data.id,
              listingId: data.listingId ?? data.listingId ?? undefined,
          title: data.title,
          year: data.year,
          make: data.make,
          model: data.model,
          mileage: data.mileage,
          engine: data.engine,
          transmission: data.transmission,
          drivetrain: data.drivetrain,
          bodyStyle: data.bodyStyle,
          exteriorColor: data.exteriorColor,
          interiorColor: data.interiorColor,
          vin: data.vin,
          location: data.location,
          seller: data.seller,
          currentBid: data.currentBid,
          bidCount: data.bidCount,
          timeRemaining: data.timeRemaining,
          endsAt: data.endsAt,
          images: data.images ?? [],
          highlights: data.highlights ?? [],
          equipment: data.equipment ?? [],
          modifications: data.modifications ?? [],
          flaws: data.flaws ?? [],
          description: data.description,
          bids: data.bids ?? [],
          comments: data.comments ?? []
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
      } catch (error) {
        setCarData(null);
        setLoadError('The requested car could not be loaded from the server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCar();
  }, [activeId]);

  if (isLoading) {
    return (
      <div className="car-error-page glass-panel">
        <h2>Loading vehicle...</h2>
        <p>Please wait while we load the auction details.</p>
      </div>
    );
  }

  if (!carData) {
    return (
      <div className="car-error-page glass-panel">
        <h2>Vehicle Not Found</h2>
        <p>{loadError || 'The requested car could not be located in our auctions database.'}</p>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('home')}>
          Back to Home
        </button>
      </div>
    );
  }

  // Toggle watchlist
  const handleWatchToggle = () => {
    setWatchAnimation(true);
    setIsWatched(!isWatched);
    setTimeout(() => setWatchAnimation(false), 600);
  };

  // Placing a Bid
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

    // Send bid to backend
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

        const result = await resp.json();

        const newBid: Bid = {
          bidder: user?.name || user?.email || 'You',
          amount: numericalBid,
          time: 'Just now'
        };

        setLocalBids([newBid, ...localBids]);
        setCurrentBidPrice(numericalBid);
        setBidSuccess(`Success! You are currently the highest bidder at $${numericalBid.toLocaleString()}.`);
        setBidAmount('');
      } catch (ex) {
        setBidError('Failed to place bid.');
      }
    })();
  };

  // Liking a Comment
  const handleLikeComment = async (id: string) => {
    if (likedCommentIds.includes(id)) {
      return;
    }

    try {
      const response = await apiCall(`/cars/comments/${id}/like`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const data = await response.json();
      setLikedCommentIds([...likedCommentIds, id]);
      setLocalComments(localComments.map(c => c.id === id ? { ...c, likes: data.likes ?? c.likes + 1 } : c));
    } catch (error) {
      console.error(error);
    }
  };

  // Posting a Comment
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
        body: JSON.stringify({ text: commentInput.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const data = await response.json();
      const newComment: Comment = {
        id: data.id,
        user: data.user,
        text: data.text,
        time: data.time,
        isSeller: data.isSeller,
        likes: data.likes
      };

      setLocalComments([newComment, ...localComments]);
      setCommentInput('');
    } catch (error) {
      console.error(error);
      alert('Unable to post comment. Please try again.');
    }
  };

  return (
    <div className="car-detail-page">
      {/* Top Navigation & Breadcrumbs */}
      <div className="detail-navigation">
        <button type="button" className="car-back-btn" onClick={() => onNavigate('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="nav-arrow">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Auctions
        </button>
        <div className="breadcrumbs">
          <span>Auctions</span> / <span>{carData.make}</span> / <span>{carData.model}</span> / <span className="active">{carData.year}</span>
        </div>
      </div>

      {/* Main Vehicle Header Banner */}
      <header className="vehicle-header-banner glass-panel">
        <div className="header-info">
          <span className="location-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {carData.location}
          </span>
          <h1 className="vehicle-detail-title">{carData.title}</h1>
          <p className="seller-attribution">
            Listed by: <span className="seller-username">@{carData.seller}</span>
          </p>
        </div>

        <button 
          type="button" 
          onClick={handleWatchToggle} 
          className={`btn-watch-item ${isWatched ? 'active' : ''} ${watchAnimation ? 'animate-heart' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill={isWatched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {isWatched ? 'Watching' : 'Watch Auction'}
        </button>
      </header>

      {/* Media Gallery & Bid Board Grid */}
      <section className="media-and-auction-grid">
        {/* Gallery */}
        <div className="gallery-card glass-panel">
          <div className="main-display-container">
            <img 
              src={carData.images[selectedImageIndex]} 
              alt={`${carData.title} view`} 
              className="gallery-main-image"
            />
            <div className="gallery-nav-buttons">
              <button 
                type="button" 
                className="gallery-nav-btn prev"
                onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : carData.images.length - 1)}
              >
                ‹
              </button>
              <button 
                type="button" 
                className="gallery-nav-btn next"
                onClick={() => setSelectedImageIndex(prev => prev < carData.images.length - 1 ? prev + 1 : 0)}
              >
                ›
              </button>
            </div>
            <div className="photo-counter">
              {selectedImageIndex + 1} / {carData.images.length} Photos
            </div>
          </div>
          <div className="thumbnails-strip">
            {carData.images.map((imgUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`thumbnail-btn ${selectedImageIndex === index ? 'active-thumbnail' : ''}`}
              >
                <img src={imgUrl} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Bid Console */}
        <div className="bid-console-card glass-panel">
          <div className="bid-console-header">
            <h3>Live Auction</h3>
            <span className="live-pulse">
              <span className="pulse-dot"></span>
              Live
            </span>
          </div>

          <div className="pricing-stats-block">
            <div className="stat-box">
              <span className="stat-label">Current Bid</span>
              <span className="stat-value text-gradient-indigo">${currentBidPrice.toLocaleString()}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Bids</span>
              <span className="stat-value">{localBids.length}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Time Left</span>
              <span className="stat-value text-gradient-purple">{carData.timeRemaining}</span>
            </div>
          </div>

          <div className="bid-console-body">
            <p className="auction-deadline-notice">Ends on <strong>{carData.endsAt}</strong></p>
            
            <form className="place-bid-form" onSubmit={handlePlaceBid}>
              <div className="input-group">
                <span className="currency-symbol">$</span>
                <input 
                  type="text" 
                  placeholder={`Min bid: $${(currentBidPrice + 500).toLocaleString()}`} 
                  value={bidAmount} 
                  onChange={(e) => setBidAmount(e.target.value)} 
                  className="bid-input-field"
                />
                <button type="submit" className="btn btn-primary submit-bid-btn">
                  Place Bid
                </button>
              </div>

              {bidError && <div className="bid-message error-msg">{bidError}</div>}
              {bidSuccess && <div className="bid-message success-msg">{bidSuccess}</div>}
            </form>

            <div className="security-badges">
              <div className="sec-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Secure Bidding
              </div>
              <div className="sec-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Verified Listing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications / Facts Table Section */}
      <section className="specifications-section glass-panel">
        <h3 className="section-subtitle">Quick Facts</h3>
        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-name">Make</span>
            <span className="spec-value">{carData.make}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Model</span>
            <span className="spec-value">{carData.model}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Year</span>
            <span className="spec-value">{carData.year}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Mileage</span>
            <span className="spec-value">{carData.mileage}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Engine</span>
            <span className="spec-value">{carData.engine}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Transmission</span>
            <span className="spec-value">{carData.transmission}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Drivetrain</span>
            <span className="spec-value">{carData.drivetrain}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Body Style</span>
            <span className="spec-value">{carData.bodyStyle}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Exterior Color</span>
            <span className="spec-value">{carData.exteriorColor}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Interior Color</span>
            <span className="spec-value">{carData.interiorColor}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">VIN</span>
            <span className="spec-value code-font">{carData.vin}</span>
          </div>
          <div className="spec-item">
            <span className="spec-name">Seller Type</span>
            <span className="spec-value">Private Party</span>
          </div>
        </div>
      </section>

      {/* Tabbed Content Navigation */}
      <section className="tabbed-details-section">
        <div className="tabs-header-container glass-panel">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Highlights
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Modifications & Flaws
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'bids' ? 'active' : ''}`}
            onClick={() => setActiveTab('bids')}
          >
            Bids History ({localBids.length})
          </button>
        </div>

        <div className="tabs-content-body glass-panel">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="tab-pane-content">
              <h4>Seller's Description</h4>
              <p className="narrative-description">{carData.description}</p>
              
              <hr className="divider" />
              
              <h4>Auction Highlights</h4>
              <ul className="bulleted-highlights">
                {carData.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>

              <hr className="divider" />

              <h4>Factory Equipment</h4>
              <ul className="bulleted-highlights">
                {carData.equipment.map((equip, index) => (
                  <li key={index}>{equip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 2: History & Flaws */}
          {activeTab === 'history' && (
            <div className="tab-pane-content">
              <h4>Known Modifications</h4>
              {carData.modifications.length > 0 ? (
                <ul className="bulleted-highlights mod-list">
                  {carData.modifications.map((mod, index) => (
                    <li key={index}>{mod}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-items-text">The seller reports no modifications from standard specifications.</p>
              )}

              <hr className="divider" />

              <h4>Known Flaws & Defects</h4>
              {carData.flaws.length > 0 ? (
                <ul className="bulleted-highlights flaws-list">
                  {carData.flaws.map((flaw, index) => (
                    <li key={index} className="flaw-item-bullet">{flaw}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-items-text text-green">The seller reports no cosmetic or mechanical flaws.</p>
              )}
            </div>
          )}

          {/* Tab 3: Bids Log */}
          {activeTab === 'bids' && (
            <div className="tab-pane-content">
              <div className="bids-history-log">
                {localBids.length > 0 ? (
                  localBids.map((bid, index) => (
                    <div key={index} className="bid-log-row">
                      <div className="bidder-meta">
                        <span className="bid-avatar">
                          {bid.bidder.charAt(0).toUpperCase()}
                        </span>
                        <div className="bidder-info">
                          <span className="bidder-name">@{bid.bidder}</span>
                          <span className="bid-timestamp">{bid.time}</span>
                        </div>
                      </div>
                      <div className="bid-amount-log">
                        <span className={`bid-badge-status ${index === 0 ? 'highest-bid' : ''}`}>
                          {index === 0 ? 'High Bid' : 'Outbid'}
                        </span>
                        <span className="bid-logged-price">${bid.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-items-text">No bids have been placed yet. Be the first!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Comments & Q&A Discussion Thread */}
      <section className="comments-discussion-section glass-panel">
        <h3 className="section-subtitle">Discussion & Questions ({localComments.length})</h3>

        {/* Comment Entry Form */}
        <form className="comment-post-form" onSubmit={handlePostComment}>
          <textarea
            placeholder={isAuthenticated ? "Ask a question about this vehicle..." : "Please Sign In to participate in the conversation."}
            disabled={!isAuthenticated}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="comment-textarea"
            rows={3}
          ></textarea>
          <div className="comment-form-actions">
            {!isAuthenticated && (
              <span className="auth-helper-text">You must sign in to write comments.</span>
            )}
            <button 
              type="submit" 
              className="btn btn-primary submit-comment-btn" 
              disabled={!commentInput.trim() || !isAuthenticated}
            >
              Post Comment
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        <div className="comments-feed-thread">
          {localComments.map((comment) => (
            <article key={comment.id} className={`comment-card-box ${comment.isSeller ? 'seller-comment' : ''}`}>
              <div className="comment-header-row">
                <div className="commenter-profile">
                  <div className={`avatar ${comment.isSeller ? 'seller-avatar' : ''}`}>
                    {comment.user.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="comment-username">@{comment.user}</span>
                    {comment.isSeller && <span className="seller-badge">Seller</span>}
                    <span className="comment-time-ago">{comment.time}</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleLikeComment(comment.id)}
                  className={`comment-like-action-btn ${likedCommentIds.includes(comment.id) ? 'liked' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill={likedCommentIds.includes(comment.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="like-icon-svg">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  <span>{comment.likes}</span>
                </button>
              </div>
              <div className="comment-body-text">
                <p>{comment.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Car;
