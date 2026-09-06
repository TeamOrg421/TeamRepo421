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

  const images = auction.car.images ?? [];
  const make = auction.car.model?.brand?.name ?? '';
  const model = auction.car.model?.name ?? '';
  const isPending = auction.status === 1 || String(auction.status).toLowerCase() === 'pending';

  return (
    <section className="auction-review-page">
      <button className="car-back-btn" type="button" onClick={onBack}>← Back</button>
      <h1>{auction.car.year ?? ''} {make} {model}</h1>

      <div className="auction-review-grid">
        <div className="auction-review-media">
          <div className="auction-review-photos">
            {images.length === 0 && <div className="manager-reference-image-placeholder auction-review-photo">No photo</div>}
            {images.map((image, index) => (
              <img key={image.imageUrl ?? index} src={image.imageUrl} alt={`${make} ${model}`} className="auction-review-photo" />
            ))}
          </div>

          {auction.car.specialtyOptions && (
            <>
              <h4>Specialty installed options or equipment</h4>
              <p className="narrative-description">{auction.car.specialtyOptions}</p>
            </>
          )}

          {!!auction.car.equipmentHighlights?.length && (
            <ul className="bulleted-highlights">
              {auction.car.equipmentHighlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}

          {message && <p className="manager-message">{message}</p>}
          {isPending && (
            <button className="btn btn-primary" type="button" onClick={() => void approve()} disabled={busy}>
              Accept Commission
            </button>
          )}
        </div>

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
                {auction.seller?.name ? (
                  <UserProfileLink userId={auction.sellerId} name={auction.seller.name} onNavigate={onNavigate} />
                ) : '—'}
              </td>
            </tr>
            <tr><th>Car for sale elsewhere?</th><td>{auction.car.listedElsewhere ? 'Yes' : 'No'}</td></tr>
            <tr><th>Has the car been modified?</th><td>{auction.car.isModified ? 'Yes, car is modified' : 'No'}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AuctionReviewPage;