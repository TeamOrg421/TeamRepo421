import React, { useEffect, useState } from 'react';

interface HomeProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface AuctionCar {
  id: string | number;
  title: string;
  time: string;
  bid: string;
  description: string;
  location: string;
  featured?: boolean;
  noReserve?: boolean;
  imageUrl: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';

const FEATURED = {
  title: 'Featured auction',
  time: 'Live',
  bid: '$0',
};

const SORT_OPTIONS = ['Ending soon', 'Newly listed', 'No reserve', 'Lowest mileage', 'Closest to me'];

const getCarImageUrl = (car: any): string => {
  const images: any[] = Array.isArray(car?.images) ? car.images : [];
  const direct = images
    .map((img) => (typeof img === 'string' ? img : img?.imageUrl ?? img?.url))
    .find((img) => typeof img === 'string' && img.trim().length > 0);

  if (direct) return direct;
  if (typeof car?.imageUrl === 'string' && car.imageUrl.trim()) return car.imageUrl;
  return FALLBACK_IMAGE;
};

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedBodyStyle, setSelectedBodyStyle] = useState('');
  const [activeSort, setActiveSort] = useState('Ending soon');
  const [auctionCars, setAuctionCars] = useState<AuctionCar[]>([]);
  const featuredCar = auctionCars[0];
  const featuredCarId = featuredCar?.id;

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
          throw new Error('Failed to load cars');
        }

        const data = await response.json();
        const mappedCars: AuctionCar[] = (Array.isArray(data) ? data : []).map((car: any) => ({
          id: car.id,
          title: `${car.brandName || car.make || 'Unknown'} ${car.modelName || car.model || 'model'}`.trim(),
          time: 'Live',
          bid: `$${Number(car.currentBid ?? car.currentPrice ?? 0).toLocaleString()}`,
          description: `${car.year ? `${car.year} ` : ''}${car.brandName || car.make || 'Unknown'} ${car.modelName || car.model || 'model'}`.trim(),
          location: car.location || 'Kyiv, Ukraine',
          featured: false,
          imageUrl: getCarImageUrl(car),
        }));

        setAuctionCars(mappedCars);
      } catch {
        setAuctionCars([]);
      }
    };

    loadCars();
  }, []);

  return (
    <div className="home">
      <section
        className="featured-hero"
        onClick={() => featuredCarId !== undefined && onNavigate('car', { carId: featuredCarId })}
        style={featuredCar ? { backgroundImage: `linear-gradient(135deg, rgba(10,10,15,0.78), rgba(54,52,79,0.5)), url(${featuredCar.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="featured-main featured-main-empty">
          <span className="badge badge-featured">FEATURED</span>
          <h2 className="featured-title">{featuredCar?.title || FEATURED.title}</h2>
          <div className="featured-meta">
            <span className="featured-time">{featuredCar?.time || FEATURED.time}</span>
            <span className="featured-bid">Bid {featuredCar?.bid || FEATURED.bid}</span>
          </div>
        </div>
        <div className="featured-thumbs">
          {(featuredCar ? [featuredCar.imageUrl, FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE] : [FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE]).map((img, i) => (
            <div key={i} className="featured-thumb featured-thumb-empty" style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ))}
        </div>
      </section>

      <section className="auctions-section">
        <div className="auctions-header">
          <h3 className="auctions-title">Auctions</h3>
          <div className="sort-links">
            {SORT_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`sort-link ${activeSort === item ? 'sort-link-active' : ''}`}
                onClick={() => setActiveSort(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-bar">
          <select
            className="filter-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Years</option>
            <option value="2020+">2020+</option>
            <option value="2010-2019">2010–2019</option>
            <option value="2000-2009">2000–2009</option>
            <option value="classic">Classic</option>
          </select>

          <select
            className="filter-select"
            value={selectedTransmission}
            onChange={(e) => setSelectedTransmission(e.target.value)}
          >
            <option value="">Transmission</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>

          <select
            className="filter-select"
            value={selectedBodyStyle}
            onChange={(e) => setSelectedBodyStyle(e.target.value)}
          >
            <option value="">Body Style</option>
            <option value="coupe">Coupe</option>
            <option value="sedan">Sedan</option>
            <option value="convertible">Convertible</option>
            <option value="suv">SUV</option>
          </select>
        </div>

        <div className="auction-grid">
          {auctionCars.map((car) => (
            <article
              key={String(car.id)}
              className="auction-card"
              onClick={() => onNavigate('car', { carId: car.id })}
            >
              <div className="auction-card-image auction-card-image-empty" style={{ backgroundImage: `url(${car.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {car.featured && <span className="badge badge-featured">FEATURED</span>}
                {car.noReserve && <span className="badge badge-no-reserve">NO RESERVE</span>}
                <div className="auction-card-overlay">
                  <span>{car.time}</span>
                  <span>Bid {car.bid}</span>
                </div>
              </div>
              <div className="auction-card-body">
                <h4 className="auction-card-title">{car.title}</h4>
                <p className="auction-card-desc">{car.description}</p>
                <p className="auction-card-location">{car.location}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
