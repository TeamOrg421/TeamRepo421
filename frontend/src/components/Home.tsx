import React, { useEffect, useState } from 'react';

interface HomeProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface AuctionCar {
  id: number;
  title: string;
  time: string;
  bid: string;
  description: string;
  location: string;
  featured?: boolean;
  noReserve?: boolean;
}

const FEATURED = {
  title: '2026 Porsche 911 Carrera GTS Coupe',
  time: '5 Days',
  bid: '$200,000',
};

const SORT_OPTIONS = ['Ending soon', 'Newly listed', 'No reserve', 'Lowest mileage', 'Closest to me'];

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedBodyStyle, setSelectedBodyStyle] = useState('');
  const [activeSort, setActiveSort] = useState('Ending soon');
  const [auctionCars, setAuctionCars] = useState<AuctionCar[]>([]);
  const featuredCarId = auctionCars[0]?.id;

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
          throw new Error('Failed to load cars');
        }

        const data = await response.json();
        const mappedCars: AuctionCar[] = data.map((car: any) => ({
          id: car.id,
          title: car.title,
          time: 'Live',
          bid: car.currentBid ? `$${car.currentBid.toLocaleString()}` : '$0',
          description: `${car.brand} ${car.model}, ${car.year}`,
          location: car.location,
          featured: false,
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
      <section className="featured-hero" onClick={() => featuredCarId !== undefined && onNavigate('car', { carId: featuredCarId })}>
        <div className="featured-main featured-main-empty">
          <span className="badge badge-featured">FEATURED</span>
          <h2 className="featured-title">{FEATURED.title}</h2>
          <div className="featured-meta">
            <span className="featured-time">{FEATURED.time}</span>
            <span className="featured-bid">Bid {FEATURED.bid}</span>
          </div>
        </div>
        <div className="featured-thumbs">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="featured-thumb featured-thumb-empty" />
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
              key={car.id}
              className="auction-card"
              onClick={() => onNavigate('car', { carId: car.id })}
            >
              <div className="auction-card-image auction-card-image-empty">
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
