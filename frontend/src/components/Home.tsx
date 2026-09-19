import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import Pagination from './Pagination';
import { showToast } from '../services/toast';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
  searchQuery: string;
}

interface AuctionCar {
  id: string | number;
  listingId?: string;
  title: string;
  bid: number;
  description: string;
  location: string;
  imageUrl: string;
  year?: number;
  make: string;
  model: string;
  transmission: string;
  fuelType: string;
  bodyStyle: string;
  mileage?: number;
  auctionStart?: string;
  auctionEnd?: string;
  listingStatus?: string | number;
}

const SORT_OPTIONS = ['Ending soon', 'Newly listed', 'Lowest mileage', 'Highest bid'];
const AUCTIONS_PER_PAGE = 12;

const enumLabel = (value: unknown, labels: string[]) => {
  if (typeof value === 'number') return labels[value] ?? labels[0];
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && labels[parsed]) return labels[parsed];
    return value;
  }
  return labels[0];
};

const getCarImageUrl = (car: any): string => {
  const images: any[] = Array.isArray(car?.images) ? car.images : [];
  return (
    images
      .map((image) => (typeof image === 'string' ? image : image?.imageUrl ?? image?.url))
      .find((image) => typeof image === 'string' && image.trim()) ??
    (typeof car?.imageUrl === 'string' ? car.imageUrl : '')
  );
};

const formatTimer = (auctionEnd?: string) => {
  if (!auctionEnd) return '03:48:12';
  const hasTimeZone = auctionEnd.includes('Z') || /[+-]\d{2}:\d{2}$/.test(auctionEnd);
  const parsed = new Date(hasTimeZone ? auctionEnd : `${auctionEnd}Z`);
  const end = parsed.getTime();
  if (Number.isNaN(end)) return '03:48:12';
  const diff = end - Date.now();
  if (diff <= 0) return 'Ended';
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const isActiveAuction = (car: AuctionCar) => {
  const status = String(car.listingStatus ?? '').toLowerCase();
  const hasActiveStatus = status === 'active' || status === '2';
  const hasNotEnded = !car.auctionEnd || new Date(car.auctionEnd).getTime() > Date.now();
  return hasActiveStatus && hasNotEnded;
};

const Home: React.FC<HomeProps> = ({ onNavigate, searchQuery }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedBodyStyle, setSelectedBodyStyle] = useState('');
  const [activeSort, setActiveSort] = useState('Ending soon');
  const [auctionCars, setAuctionCars] = useState<AuctionCar[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [carToListingMap, setCarToListingMap] = useState<Record<string, string>>({});
  const [auctionPage, setAuctionPage] = useState(1);
  const [, setTimerTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real watchlist items for authenticated user
  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites({});
      setCarToListingMap({});
      return;
    }

    const loadWatchlist = async () => {
      try {
        const response = await apiCall('/users/me/watchlist');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const favMap: Record<string, boolean> = {};
            const carToListing: Record<string, string> = {};
            data.forEach((item: any) => {
              const lId = item.listingId ? String(item.listingId) : '';
              const cId = item.carId ? String(item.carId) : '';
              if (lId) favMap[lId] = true;
              if (cId) {
                favMap[cId] = true;
                if (lId) carToListing[cId] = lId;
              }
            });
            setFavorites(favMap);
            setCarToListingMap(carToListing);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    void loadWatchlist();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to load cars');
        const data = await response.json();
        setAuctionCars(
          (Array.isArray(data) ? data : []).map((car: any) => {
            const specification = car.specification ?? {};
            const make = car.brandName || car.make || 'Unknown';
            const model = car.modelName || car.model || 'model';
            const year = Number(car.year) || undefined;
            const title = car.title || `${year ? `${year} ` : ''}${make} ${model}`.trim();
            const location = car.location || car.city || 'Munich, DE 80809';

            return {
              id: car.id,
              listingId: car.listingId ? String(car.listingId) : undefined,
              title,
              bid: Number(car.currentBid ?? car.currentPrice ?? car.startingPrice ?? 0),
              description: car.description || title,
              location,
              imageUrl: getCarImageUrl(car),
              year,
              make,
              model,
              transmission: enumLabel(specification.transmission ?? car.transmission, [
                'Manual',
                'Automatic',
                'Automated manual',
                'CVT',
              ]),
              fuelType: enumLabel(specification.fuelType ?? car.fuelType, [
                'Gasoline',
                'Diesel',
                'Electric',
                'Hybrid',
                'Gas',
              ]),
              bodyStyle: enumLabel(specification.bodyType ?? car.bodyType, [
                'Sedan',
                'Coupe',
                'Hatchback',
                'SUV',
                'Wagon',
                'Convertible',
                'Minivan',
                'Pickup',
              ]),
              mileage: Number(specification.mileage ?? car.mileage) || undefined,
              auctionStart: car.auctionStart,
              auctionEnd: car.auctionEnd,
              listingStatus: car.listingStatus ?? car.auctionStatus,
            };
          }).filter(isActiveAuction)
        );
      } catch {
        setAuctionCars([]);
      }
    };
    void loadCars();
  }, []);

  const toggleFavorite = async (car: AuctionCar, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Please sign in to save this auction to your watchlist.', 'info');
      onNavigate('login');
      return;
    }

    const carIdStr = String(car.id);
    const targetListingId = car.listingId || carToListingMap[carIdStr] || carIdStr;
    const isCurrentlyFav = Boolean(favorites[carIdStr] || (car.listingId && favorites[String(car.listingId)]));

    // Optimistic UI update
    setFavorites((prev) => ({
      ...prev,
      [carIdStr]: !isCurrentlyFav,
      ...(car.listingId ? { [String(car.listingId)]: !isCurrentlyFav } : {}),
      [targetListingId]: !isCurrentlyFav,
    }));

    try {
      if (isCurrentlyFav) {
        await apiCall(`/users/me/watchlist/${targetListingId}`, { method: 'DELETE' });
      } else {
        const response = await apiCall('/users/me/watchlist', {
          method: 'POST',
          body: JSON.stringify({ listingId: targetListingId }),
        });
        if (response.ok) {
          setCarToListingMap((prev) => ({ ...prev, [carIdStr]: targetListingId }));
        }
      }
    } catch (err) {
      console.error('Failed to update watchlist on server', err);
      // Revert on error
      setFavorites((prev) => ({
        ...prev,
        [carIdStr]: isCurrentlyFav,
        ...(car.listingId ? { [String(car.listingId)]: isCurrentlyFav } : {}),
        [targetListingId]: isCurrentlyFav,
      }));
    }
  };

  const filteredCars = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const result = auctionCars.filter(
      (car) =>
        (!query ||
          [car.title, car.description, car.make, car.model, car.location].some((value) =>
            value.toLocaleLowerCase().includes(query)
          )) &&
        (!selectedYear || String(car.year) === selectedYear) &&
        (!selectedTransmission || car.transmission === selectedTransmission) &&
        (!selectedBodyStyle || car.bodyStyle === selectedBodyStyle) &&
        isActiveAuction(car)
    );
    return result.sort((left, right) => {
      if (activeSort === 'Newly listed') {
        return new Date(right.auctionStart ?? 0).getTime() - new Date(left.auctionStart ?? 0).getTime();
      }
      if (activeSort === 'Lowest mileage') {
        return (left.mileage ?? Number.MAX_SAFE_INTEGER) - (right.mileage ?? Number.MAX_SAFE_INTEGER);
      }
      if (activeSort === 'Highest bid') {
        return right.bid - left.bid;
      }
      return new Date(left.auctionEnd ?? '9999-12-31').getTime() - new Date(right.auctionEnd ?? '9999-12-31').getTime();
    });
  }, [activeSort, auctionCars, searchQuery, selectedBodyStyle, selectedTransmission, selectedYear]);

  const featuredCar = filteredCars[0];
  const auctionPageCount = Math.ceil(filteredCars.length / AUCTIONS_PER_PAGE);
  const visibleCars = filteredCars.slice((auctionPage - 1) * AUCTIONS_PER_PAGE, auctionPage * AUCTIONS_PER_PAGE);
  const years = Array.from(new Set(auctionCars.map((car) => car.year).filter(Boolean))).sort(
    (a, b) => Number(b) - Number(a)
  );
  const bodyStyles = Array.from(
    new Set(auctionCars.map((car) => car.bodyStyle).filter((value) => value !== 'Unknown'))
  ).sort();
  const resetFilters = () => {
    setSelectedYear('');
    setSelectedTransmission('');
    setSelectedBodyStyle('');
  };

  useEffect(() => {
    setAuctionPage(1);
  }, [activeSort, searchQuery, selectedBodyStyle, selectedTransmission, selectedYear]);

  return (
    <div className="home catalog-home">
      <section
        className="featured-hero catalog-featured"
        onClick={() => featuredCar && onNavigate('car', { carId: featuredCar.id })}
      >
        <div
          className="featured-main featured-main-empty"
          style={
            featuredCar?.imageUrl
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.08)), url(${featuredCar.imageUrl})`,
                }
              : undefined
          }
        >
          <span className="catalog-featured-label">{t('featuredAuction')}</span>
          <div className="catalog-featured-copy">
            <h1>{featuredCar?.title || t('discoverCar')}</h1>
            <p>{featuredCar?.description || t('browseLive')}</p>
          </div>
        </div>
      </section>

      <section className="auctions-section">
        <div className="auctions-header">
          <div>
            <h2 className="auctions-title">{t('auctionsTitle')}</h2>
            {searchQuery && <p className="catalog-result-copy">{t('resultsFor')} “{searchQuery}”</p>}
          </div>
          <div className="sort-links">
            {SORT_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`sort-link ${activeSort === item ? 'sort-link-active' : ''}`}
                onClick={() => setActiveSort(item)}
              >
                {item === 'Ending soon' ? t('endingSoon') : item === 'Newly listed' ? t('newlyListed') : item === 'Lowest mileage' ? t('lowestMileage') : t('highestBid')}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-bar" aria-label="Catalog filters">
          <select
            className="filter-select"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="">{t('year')}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={selectedTransmission}
            onChange={(event) => setSelectedTransmission(event.target.value)}
          >
            <option value="">{t('transmission')}</option>
            <option>Manual</option>
            <option>Automatic</option>
            <option>Automated manual</option>
            <option>CVT</option>
          </select>
          <select
            className="filter-select"
            value={selectedBodyStyle}
            onChange={(event) => setSelectedBodyStyle(event.target.value)}
          >
            <option value="">{t('bodyType')}</option>
            {bodyStyles.map((bodyStyle) => (
              <option key={bodyStyle}>{bodyStyle}</option>
            ))}
          </select>
          {(selectedYear || selectedTransmission || selectedBodyStyle) && (
            <button type="button" className="clear-filters" onClick={resetFilters}>
              {t('clearFilters')}
            </button>
          )}
        </div>

        {filteredCars.length ? (
          <div className="auction-grid">
            {visibleCars.map((car) => {
              const isFav = Boolean(
                favorites[String(car.id)] || (car.listingId && favorites[String(car.listingId)])
              );
              return (
                <article
                  key={String(car.id)}
                  className="auction-card"
                  onClick={() => onNavigate('car', { carId: car.id })}
                >
                  <div
                    className="auction-card-image"
                    style={car.imageUrl ? { backgroundImage: `url(${car.imageUrl})` } : undefined}
                  >
                    {/* Favorite Star Button */}
                    <button
                      type="button"
                      className={`auction-card-favorite-btn ${isFav ? 'active' : ''}`}
                      aria-label="Add to favorites"
                      onClick={(e) => void toggleFavorite(car, e)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill={isFav ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>

                    {/* Featured Badge */}
                    <span className="auction-card-featured-badge">Featured</span>

                    {/* Overlay Badges at Bottom */}
                    <div className="auction-card-img-bottom">
                      <div className="auction-card-timer-badge">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{formatTimer(car.auctionEnd)}</span>
                      </div>

                      <div className="auction-card-price-badge">
                        <span className="auction-card-dollar-circle">$</span>
                        <span>${car.bid.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="auction-card-body">
                    <h3 className="auction-card-title">{car.title}</h3>
                    <p className="auction-card-desc">{car.description}</p>
                    <p className="auction-card-location">{car.location}</p>

                    <div className="auction-card-specs">
                      <span className="auction-spec-pill">{car.fuelType || 'Gasoline'}</span>
                      <span className="auction-spec-pill">{car.transmission || 'Automatic'}</span>
                      {car.mileage !== undefined && (
                        <span className="auction-spec-pill">{car.mileage.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty">
            <h3>{t('noAuctions')}</h3>
            <p>{t('tryAnother')}</p>
          </div>
        )}
        <Pagination page={auctionPage} pageCount={auctionPageCount} onPageChange={setAuctionPage} />
      </section>
    </div>
  );
};

export default Home;
