import React, { useEffect, useMemo, useState } from 'react';

interface HomeProps { onNavigate: (page: string, params?: { carId?: number | string }) => void; searchQuery: string; }
interface AuctionCar {
  id: string | number; title: string; time: string; bid: number; description: string; location: string; imageUrl: string;
  year?: number; make: string; model: string; transmission: string; bodyStyle: string; mileage?: number; auctionStart?: string; auctionEnd?: string;
}

const SORT_OPTIONS = ['Ending soon', 'Newly listed', 'Lowest mileage', 'Highest bid'];
const enumLabel = (value: unknown, labels: string[]) => typeof value === 'number' ? labels[value] ?? 'Unknown' : String(value ?? 'Unknown');
const getCarImageUrl = (car: any): string => {
  const images: any[] = Array.isArray(car?.images) ? car.images : [];
  return images.map((image) => typeof image === 'string' ? image : image?.imageUrl ?? image?.url)
    .find((image) => typeof image === 'string' && image.trim()) ?? (typeof car?.imageUrl === 'string' ? car.imageUrl : '');
};
const getAuctionStatus = (auctionStart?: string, auctionEnd?: string) => {
  const now = Date.now(), start = auctionStart ? new Date(auctionStart).getTime() : NaN, end = auctionEnd ? new Date(auctionEnd).getTime() : NaN;
  if (Number.isFinite(end) && end <= now) return 'Ended';
  return Number.isFinite(start) && start > now ? 'Starts soon' : 'Live';
};

const Home: React.FC<HomeProps> = ({ onNavigate, searchQuery }) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedBodyStyle, setSelectedBodyStyle] = useState('');
  const [activeSort, setActiveSort] = useState('Ending soon');
  const [auctionCars, setAuctionCars] = useState<AuctionCar[]>([]);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) throw new Error('Failed to load cars');
        const data = await response.json();
        setAuctionCars((Array.isArray(data) ? data : []).map((car: any) => {
          const specification = car.specification ?? {}, make = car.brandName || car.make || 'Unknown', model = car.modelName || car.model || 'model';
          return { id: car.id, title: car.title || `${car.year ? `${car.year} ` : ''}${make} ${model}`.trim(), time: getAuctionStatus(car.auctionStart, car.auctionEnd), bid: Number(car.currentBid ?? car.currentPrice ?? car.startingPrice ?? 0), description: car.description || `${car.year ? `${car.year} ` : ''}${make} ${model}`.trim(), location: car.location || 'Location not specified', imageUrl: getCarImageUrl(car), year: Number(car.year) || undefined, make, model, transmission: enumLabel(specification.transmission, ['Manual', 'Automatic', 'Automated manual', 'CVT']), bodyStyle: enumLabel(specification.bodyType, ['Sedan', 'Coupe', 'Hatchback', 'SUV', 'Wagon', 'Convertible', 'Minivan', 'Pickup']), mileage: Number(specification.mileage) || undefined, auctionStart: car.auctionStart, auctionEnd: car.auctionEnd };
        }));
      } catch { setAuctionCars([]); }
    };
    loadCars();
  }, []);

  const filteredCars = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const result = auctionCars.filter((car) => (!query || [car.title, car.description, car.make, car.model, car.location].some((value) => value.toLocaleLowerCase().includes(query)))
      && (!selectedYear || String(car.year) === selectedYear) && (!selectedTransmission || car.transmission === selectedTransmission) && (!selectedBodyStyle || car.bodyStyle === selectedBodyStyle));
    return result.sort((left, right) => {
      if (activeSort === 'Newly listed') return new Date(right.auctionStart ?? 0).getTime() - new Date(left.auctionStart ?? 0).getTime();
      if (activeSort === 'Lowest mileage') return (left.mileage ?? Number.MAX_SAFE_INTEGER) - (right.mileage ?? Number.MAX_SAFE_INTEGER);
      if (activeSort === 'Highest bid') return right.bid - left.bid;
      return new Date(left.auctionEnd ?? '9999-12-31').getTime() - new Date(right.auctionEnd ?? '9999-12-31').getTime();
    });
  }, [activeSort, auctionCars, searchQuery, selectedBodyStyle, selectedTransmission, selectedYear]);

  const featuredCar = filteredCars[0] ?? auctionCars[0];
  const years = Array.from(new Set(auctionCars.map((car) => car.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
  const bodyStyles = Array.from(new Set(auctionCars.map((car) => car.bodyStyle).filter((value) => value !== 'Unknown'))).sort();
  const resetFilters = () => { setSelectedYear(''); setSelectedTransmission(''); setSelectedBodyStyle(''); };

  return <div className="home catalog-home">
    <section className="featured-hero catalog-featured" onClick={() => featuredCar && onNavigate('car', { carId: featuredCar.id })}>
      <div className="featured-main featured-main-empty" style={featuredCar?.imageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.62), rgba(0,0,0,.08)), url(${featuredCar.imageUrl})` } : undefined}>
        <span className="catalog-featured-label">FEATURED AUCTION</span><div className="catalog-featured-copy"><h1>{featuredCar?.title || 'Discover your next car'}</h1><p>{featuredCar?.description || 'Browse live vehicle auctions from verified sellers.'}</p></div>
      </div>
    </section>
    <section className="auctions-section">
      <div className="auctions-header"><div><h2 className="auctions-title">Auctions</h2>{searchQuery && <p className="catalog-result-copy">Results for “{searchQuery}”</p>}</div><div className="sort-links">{SORT_OPTIONS.map((item) => <button key={item} type="button" className={`sort-link ${activeSort === item ? 'sort-link-active' : ''}`} onClick={() => setActiveSort(item)}>{item}</button>)}</div></div>
      <div className="filter-bar" aria-label="Catalog filters">
        <select className="filter-select" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}><option value="">Year</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
        <select className="filter-select" value={selectedTransmission} onChange={(event) => setSelectedTransmission(event.target.value)}><option value="">Transmission</option><option>Manual</option><option>Automatic</option><option>Automated manual</option><option>CVT</option></select>
        <select className="filter-select" value={selectedBodyStyle} onChange={(event) => setSelectedBodyStyle(event.target.value)}><option value="">Body type</option>{bodyStyles.map((bodyStyle) => <option key={bodyStyle}>{bodyStyle}</option>)}</select>
        {(selectedYear || selectedTransmission || selectedBodyStyle) && <button type="button" className="clear-filters" onClick={resetFilters}>Clear filters</button>}
      </div>
      {filteredCars.length ? <div className="auction-grid">{filteredCars.map((car) => <article key={String(car.id)} className="auction-card" onClick={() => onNavigate('car', { carId: car.id })}>
        <div className="auction-card-image auction-card-image-empty" style={car.imageUrl ? { backgroundImage: `url(${car.imageUrl})` } : undefined}><div className="auction-card-overlay"><span>{car.time}</span><span>${car.bid.toLocaleString()}</span></div></div>
        <div className="auction-card-body"><h3 className="auction-card-title">{car.title}</h3><p className="auction-card-desc">{car.description}</p><p className="auction-card-location">{car.location}</p><div className="auction-card-tags"><span>{car.transmission}</span>{car.bodyStyle !== 'Unknown' && <span>{car.bodyStyle}</span>}{car.mileage !== undefined && <span>{car.mileage.toLocaleString()} mi</span>}</div></div>
      </article>)}</div> : <div className="catalog-empty"><h3>No auctions found</h3><p>Try another search or clear the selected filters.</p></div>}
    </section>
  </div>;
};

export default Home;
