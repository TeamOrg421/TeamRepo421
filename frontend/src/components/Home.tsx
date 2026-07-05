import React, { useState } from 'react';

interface HomeProps {
  onNavigate: (page: string) => void;
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

  const auctionCars: AuctionCar[] = [
    {
      id: 1,
      title: '2023 Porsche 911 GT3 Manthey Racing Package',
      time: '1 Day',
      bid: '$267,000',
      description: '6-Speed Manual, 6k Miles',
      location: 'Portland, OR 97220',
      featured: true,
    },
    {
      id: 2,
      title: '2009 Lotus Exige S 260 Sport',
      time: '1 Day',
      bid: '$75,500',
      description: '6-Speed Manual, Supercharged, Ardent Red',
      location: 'Boston, MA 02061',
      noReserve: true,
    },
    {
      id: 3,
      title: '2016 BMW M4 GTS',
      time: '1 Day',
      bid: '$61,000',
      description: '1 of 828 M4 GTS Models, 8k Miles',
      location: 'Milford, MA 01757',
      featured: true,
    },
    {
      id: 4,
      title: '2001 Panoz Esperante',
      time: '1 Day',
      bid: '$17,500',
      description: '9k Miles, V8 Power, Hand-Built Exotic',
      location: 'Auburn, GA 30011',
    },
    {
      id: 5,
      title: '2019 Mercedes-AMG GT R',
      time: '2 Days',
      bid: '$142,000',
      description: 'AMG Performance Exhaust, 4k Miles',
      location: 'Los Angeles, CA 90001',
    },
    {
      id: 6,
      title: '2020 Audi R8 V10 Performance',
      time: '3 Days',
      bid: '$189,500',
      description: 'Carbon Fiber Package, 7-Speed S-Tronic',
      location: 'Miami, FL 33101',
      noReserve: true,
    },
    {
      id: 7,
      title: '2018 Ford GT',
      time: '4 Days',
      bid: '$1,050,000',
      description: 'Liquid Carbon Edition, 1.2k Miles',
      location: 'Chicago, IL 60601',
      featured: true,
    },
    {
      id: 8,
      title: '1969 Chevrolet Camaro Z/28',
      time: '2 Days',
      bid: '$92,000',
      description: 'Numbers Matching, 4-Speed Manual',
      location: 'Detroit, MI 48201',
    },
  ];

  return (
    <div className="home">
      <section className="featured-hero" onClick={() => onNavigate('car')}>
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
              onClick={() => onNavigate('car')}
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
