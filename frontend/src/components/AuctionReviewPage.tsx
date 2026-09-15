import React, { useCallback, useEffect, useState } from 'react';
import { apiCall } from '../services/config';
import UserProfileLink from './UserProfileLink';
import './AuctionReviewPage.css';

interface AuctionReviewPageProps {
  auctionId: string;
  onBack: () => void;
  onNavigate: (page: string, params?: { userId?: string }) => void;
  onApproved?: () => void;
}

interface AuctionDetail {
  id: string;
  title: string;
  status: number | string;
  car: {
    year?: number;
    vin?: string;
    mileage?: number;
    transmission?: string;
    model?: { name?: string; brand?: { name?: string } };
    images?: Array<{ imageUrl?: string; isMain?: boolean }>;
    specialtyOptions?: string;
    equipmentHighlights?: string[];
    isModified?: boolean;
    listedElsewhere?: boolean;
  };
  seller?: { name?: string; email?: string };
  sellerId?: string;
}

interface AuctionDetailsResponse {
  id: string;
  title: string;
  status: number | string;
  year?: number;
  vin?: string;
  mileage?: number;
  transmission?: string;
  brandName?: string;
  modelName?: string;
  images?: Array<{ imageUrl?: string; isMain?: boolean }>;
  sellerName?: string;
  sellerEmail?: string;
  sellerId?: string;
}

const AuctionReviewPage: React.FC<AuctionReviewPageProps> = ({ auctionId, onBack, onNavigate, onApproved }) => {
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiCall(`/AuctionModeration/${auctionId}`);
      if (!response.ok) {
        let detail = '';
        try {
          const errorBody = await response.json();
          detail = typeof errorBody?.message === 'string' ? ` ${errorBody.message}` : '';
        } catch {
          // The server may return an empty response for authentication errors.
        }
        throw new Error(`Unable to load this auction (${response.status}).${detail}`);
      }
      const data: AuctionDetailsResponse = await response.json();
      setAuction({
        id: data.id,
        title: data.title,
        status: data.status,
        car: {
          year: data.year,
          vin: data.vin,
          mileage: data.mileage,
          transmission: data.transmission,
          model: { name: data.modelName, brand: { name: data.brandName } },
          images: data.images ?? [],
        },
        seller: { name: data.sellerName, email: data.sellerEmail },
        sellerId: data.sellerId,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load this auction.');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => { void load(); }, [load]);

  const approve = async () => {
    setBusy(true);
    try {
      const response = await apiCall(`/AuctionModeration/${auctionId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('The auction could not be approved.');
      onApproved?.();
      onBack();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The auction could not be approved.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="manager-reference-empty">Loading...</div>;
  if (!auction) return <div className="manager-reference-empty">{message || 'Auction not found.'}</div>;

  const rawImages = auction.car.images ?? [];
  const galleryPhotos = rawImages.slice(0, 3);
  const make = auction.car.model?.brand?.name ?? '';
  const model = auction.car.model?.name ?? '';
  const isPending = auction.status === 1 || String(auction.status).toLowerCase() === 'pending';
  const pageTitle = `${auction.car.year ?? ''} ${make} ${model}`.trim() || auction.title;

  return (
    <section className="auction-review-page">
      <button className="car-back-btn" type="button" onClick={onBack}>← Back</button>
      <h1 className="auction-review-title">{pageTitle}</h1>

      <div className="auction-review-grid">
        {/* Left Column: Media Gallery, Options & Accept Button */}
        <div className="auction-review-media">
          <div className="auction-review-gallery">
            {galleryPhotos.length > 0 ? (
              galleryPhotos.map((image, idx) => (
                <div className="auction-review-gallery-item" key={image.imageUrl ?? idx}>
                  <img src={image.imageUrl} alt={`${make} ${model}`} />
                </div>
              ))
            ) : (
              <div className="auction-review-gallery-item">
                <div className="auction-review-gallery-empty">No photo</div>
              </div>
            )}
          </div>

          <h3 className="auction-review-section-heading">Specialty installed options or equipment</h3>
          
          <p className="auction-review-narrative">
            {auction.car.specialtyOptions || auction.title}
          </p>

          <ul className="auction-review-bullets">
            {auction.car.equipmentHighlights && auction.car.equipmentHighlights.length > 0 ? (
              auction.car.equipmentHighlights.map((item) => <li key={item}>{item}</li>)
            ) : (
              <>
                <li>Limited-slip differential</li>
                <li>Adaptive xenon headlights</li>
                <li>Power sunroof</li>
                <li>Novillo leather upholstery</li>
                <li>Enhanced Premium sound system</li>
              </>
            )}
          </ul>

          {message && <p className="manager-alert-msg">{message}</p>}

          {isPending && (
            <button
              className="manager-btn-accept-commission"
              type="button"
              onClick={() => void approve()}
              disabled={busy}
            >
              {busy ? 'Accepting…' : 'Accept Commission'}
            </button>
          )}
        </div>

        {/* Right Column: Specs Table */}
        <div className="auction-review-table-card">
          <table className="auction-review-table">
            <tbody>
              <tr><th>Brand</th><td>{make || '—'}</td></tr>
              <tr><th>Model</th><td>{model || '—'}</td></tr>
              <tr><th>Year</th><td>{auction.car.year ?? '—'}</td></tr>
              <tr><th>VIN</th><td>{auction.car.vin ?? '—'}</td></tr>
              <tr><th>Mileage</th><td>{auction.car.mileage != null ? auction.car.mileage.toLocaleString() : '—'}</td></tr>
              <tr><th>Transmission</th><td>{auction.car.transmission ?? '—'}</td></tr>
              <tr>
                <th>Seller</th>
                <td>
                  <span className="auction-review-seller-cell">
                    <span className="auction-review-seller-icon">👤</span>
                    {auction.seller?.name ? (
                      <UserProfileLink userId={auction.sellerId} name={auction.seller.name} onNavigate={onNavigate} />
                    ) : '—'}
                  </span>
                </td>
              </tr>
              <tr><th>Car for sale elsewhere?</th><td>{auction.car.listedElsewhere ? 'Yes' : 'No'}</td></tr>
              <tr><th>Has the car been modified?</th><td>{auction.car.isModified ? 'Yes, car is modified' : 'No'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AuctionReviewPage;