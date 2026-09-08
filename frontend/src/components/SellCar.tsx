import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import './SellCar.css';

interface SellCarProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface CatalogItem {
  id: string;
  name: string;
}

interface RecentAuction {
  id: string;
  title: string;
  details: string;
  price: number;
  imageUrl: string;
}

type Stage = 'overview' | 'form' | 'success';

interface ListingForm {
  make: string;
  model: string;
  year: string;
  vin: string;
  mileage: string;
  horsePower: string;
  engineVolume: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  bodyType: string;
  doors: string;
  seats: string;
  exteriorColor: string;
  interiorColor: string;
  ownersCount: string;
  isAccidentFree: boolean;
  title: string;
  description: string;
  location: string;
  startingPrice: string;
  auctionStart: string;
  auctionEnd: string;
}

const enumOptions = {
  fuel: [
    ['0', 'Petrol'],
    ['1', 'Diesel'],
    ['2', 'Electric'],
    ['3', 'Hybrid'],
    ['4', 'Gas'],
  ],
  transmission: [
    ['0', 'Manual'],
    ['1', 'Automatic'],
    ['2', 'Automated manual'],
    ['3', 'CVT'],
  ],
  driveType: [
    ['0', 'All-wheel drive'],
    ['1', 'Front-wheel drive'],
    ['2', 'Rear-wheel drive'],
  ],
  bodyType: [
    ['0', 'Sedan'],
    ['1', 'Coupe'],
    ['2', 'Hatchback'],
    ['3', 'SUV'],
    ['4', 'Wagon'],
    ['5', 'Convertible'],
    ['6', 'Minivan'],
    ['7', 'Pickup'],
  ],
} as const;

const localDateValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const initialForm = (): ListingForm => {
  const start = new Date(Date.now() + 10 * 60_000);
  return {
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    vin: '',
    mileage: '',
    horsePower: '',
    engineVolume: '',
    fuelType: '0',
    transmission: '1',
    driveType: '2',
    bodyType: '1',
    doors: '2',
    seats: '4',
    exteriorColor: '',
    interiorColor: '',
    ownersCount: '1',
    isAccidentFree: true,
    title: '',
    description: '',
    location: '',
    startingPrice: '',
    auctionStart: localDateValue(start),
    auctionEnd: localDateValue(new Date(start.getTime() + 7 * 86400000)),
  };
};

const responseError = async (response: Response) => {
  const body = await response.text();
  if (!body) return response.statusText || 'Unable to submit your car.';
  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.title || 'Unable to submit your car.';
  } catch {
    return body;
  }
};

const defaultSales: RecentAuction[] = [
  {
    id: 'sample-1',
    title: '2021 Porsche 911 Turbo S Coupe',
    details: '3.7L Twin-Turbo Flat-6, Bordeaux Leather, Unmodified',
    price: 195000,
    imageUrl: '/hero-car.jpg',
  },
  {
    id: 'sample-2',
    title: '2022 Rivian R1T Launch Edition',
    details: 'Quad-Motor AWD, Large Battery Pack, Off-Road Upgrade',
    price: 70000,
    imageUrl: '/hero-porsche.png',
  },
  {
    id: 'sample-3',
    title: '1999 BMW Z3 M Roadster',
    details: '23,700 Miles, 5-Speed Manual, Evergreen, Unmodified',
    price: 30000,
    imageUrl: '/hero-datsun.png',
  },
  {
    id: 'sample-4',
    title: '2021 Porsche 718 Boxster',
    details: '6,400 Miles, 6-Speed Manual, 300-hp Turbo Flat-4, Unmodified',
    price: 35000,
    imageUrl: '/ferrari-car.png',
  },
  {
    id: 'sample-5',
    title: '2020 Porsche 718 Boxster Spyder',
    details: '~6,100 Miles, 6-Speed Manual, Ceramic Composite Brakes, Unmodified',
    price: 120000,
    imageUrl: '/hero-ferrari.png',
  },
];

const sellerTestimonials = [
  {
    name: 'Smith Jhon',
    date: 'Sept 2024',
    quote: 'Some of the most helpful and kind people to work with! Will for sure sell with them again.',
    avatar: 'SJ',
  },
  {
    name: 'Jay C.',
    date: 'July 2024',
    quote: 'The team made my sale simple, clear and surprisingly fast. I would absolutely use VEYO again.',
    avatar: 'JC',
  },
  {
    name: 'Andrew D.',
    date: 'June 2024',
    quote: 'This is by far the greatest place to sell your car online. The process was transparent from start to finish.',
    avatar: 'AD',
  },
  {
    name: 'Lovedons Auto',
    date: 'Oct 2024',
    quote: 'Professional service and serious buyers. Our listing received excellent attention from day one.',
    avatar: 'LA',
  },
];

const SellCar: React.FC<SellCarProps> = ({ onNavigate }) => {
  const { isAuthenticated, user } = useAuth();
  const [stage, setStage] = useState<Stage>('overview');
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [models, setModels] = useState<CatalogItem[]>([]);
  const [recentAuctions, setRecentAuctions] = useState<RecentAuction[]>(defaultSales);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoWarning, setPhotoWarning] = useState('');
  const [createdCarId, setCreatedCarId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.allSettled([apiCall('/catalog/brands'), apiCall('/catalog/models')]).then(
      async ([brandResult, modelResult]) => {
        if (brandResult.status === 'fulfilled' && brandResult.value.ok) {
          setBrands(await brandResult.value.json());
        }
        if (modelResult.status === 'fulfilled' && modelResult.value.ok) {
          setModels(await modelResult.value.json());
        }
      }
    );
  }, []);

  useEffect(() => {
    apiCall('/cars?size=8')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return;
        const items = data.slice(0, 6).map((car: any) => {
          const images = Array.isArray(car.images) ? car.images : [];
          const mainImage = images.find((image: any) => image?.isMain) ?? images[0];
          const imageUrl = typeof mainImage === 'string' ? mainImage : mainImage?.imageUrl;
          const make = car.brandName || car.make || 'Vehicle';
          const model = car.modelName || car.model || '';
          return {
            id: String(car.id),
            title: car.title || `${car.year || ''} ${make} ${model}`.trim(),
            details: `${
              car.specification?.mileage != null
                ? Number(car.specification.mileage).toLocaleString() + ' miles · '
                : ''
            }${car.specification?.transmission ?? 'Auction listing'}`,
            price: Number(car.currentBid ?? car.startingPrice ?? 0),
            imageUrl: imageUrl || '/hero-car.jpg',
          };
        });
        if (items.length > 0) {
          setRecentAuctions(items);
        }
      })
      .catch(() => {});
  }, []);

  const update = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const begin = () => (isAuthenticated ? setStage('form') : onNavigate('login'));

  const scrollTrack = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const uploadPhoto = async (carId: string, photo: File, isMain: boolean) => {
    const data = new FormData();
    data.append('file', photo);
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/cars/${carId}/images?isMain=${isMain}`, {
      method: 'POST',
      body: data,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.ok;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const startingPrice = Number(form.startingPrice);
    const auctionStart = new Date(form.auctionStart);
    const auctionEnd = new Date(form.auctionEnd);

    if (!Number.isFinite(startingPrice) || startingPrice < 0) {
      return setError('Enter a valid starting price of 0 or more.');
    }
    if (
      Number.isNaN(auctionStart.getTime()) ||
      Number.isNaN(auctionEnd.getTime()) ||
      auctionEnd <= auctionStart
    ) {
      return setError('The auction end date must be later than the start date.');
    }

    setIsSubmitting(true);
    try {
      const response = await apiCall('/cars', {
        method: 'POST',
        body: JSON.stringify({
          car: {
            make: form.make.trim(),
            model: form.model.trim(),
            year: Number(form.year),
            vin: form.vin.trim().toUpperCase(),
            specification: {
              mileage: Number(form.mileage),
              horsePower: Number(form.horsePower),
              engineVolume: Number(form.engineVolume),
              fuelType: Number(form.fuelType),
              transmission: Number(form.transmission),
              driveType: Number(form.driveType),
              bodyType: Number(form.bodyType),
              doors: Number(form.doors),
              seats: Number(form.seats),
              exteriorColor: form.exteriorColor.trim(),
              interiorColor: form.interiorColor.trim() || null,
              isAccidentFree: form.isAccidentFree,
              ownersCount: Number(form.ownersCount),
            },
          },
          auction: {
            title: form.title.trim(),
            description: form.description.trim(),
            location: form.location.trim(),
            startingPrice,
            auctionStart: auctionStart.toISOString(),
            auctionEnd: auctionEnd.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        return setError(await responseError(response));
      }
      const created = (await response.json()) as { carId?: string };
      if (!created.carId) {
        return setError('Your listing was created, but its ID is missing.');
      }

      const failed = (
        await Promise.all(
          photos.map(async (photo, index) => {
            try {
              return (await uploadPhoto(created.carId!, photo, index === 0)) ? null : photo.name;
            } catch {
              return photo.name;
            }
          })
        )
      ).filter(Boolean);

      setPhotoWarning(
        failed.length ? `Your listing was created, but ${failed.length} photo(s) could not be uploaded.` : ''
      );
      setCreatedCarId(created.carId);
      setStage('success');
    } catch {
      setError('Unable to contact the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === 'success') {
    return (
      <section className="sell-page-wrapper">
        <div className="sell-success-container">
          <div className="sell-success-badge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="sell-kicker">Submission received</p>
          <h1>Thank you for your submission!</h1>
          <p>
            We have successfully received your information and it is now being processed. Please allow us a little time to review everything.
          </p>
          <p>The next steps will be communicated to you directly through a chat with our manager.</p>
          {photoWarning && (
            <p className="sell-form-error" role="alert">
              {photoWarning}
            </p>
          )}
          <div className="sell-success-actions">
            <button className="sell-primary-btn" type="button" onClick={() => onNavigate('seller')}>
              Check progress details in dashboard
            </button>
            {createdCarId && (
              <button
                className="sell-cancel-btn"
                type="button"
                onClick={() => onNavigate('car', { carId: createdCarId })}
              >
                View your listing
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'overview') {
    return (
      <section className="sell-page-wrapper">
        {/* HERO SECTION */}
        <div className="sell-hero">
          <div className="sell-hero-copy">
            <h1>Your Car Deserves the Spotlight.</h1>
            <p className="sell-hero-lead">
              <span className="highlight-blue">More</span> views.{' '}
              <span className="highlight-blue">More</span> bids.{' '}
              <span className="highlight-blue">More</span> money.
            </p>
            <ul className="sell-hero-features">
              <li>
                <span className="sell-feature-icon icon-green">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </span>
                <span>
                  <strong>List for free</strong> — you keep 100% of the sale price
                </span>
              </li>
              <li>
                <span className="sell-feature-icon icon-blue">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span>
                  <strong>Quick start</strong> — we get your car live in just a few days
                </span>
              </li>
              <li>
                <span className="sell-feature-icon icon-blue">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </span>
                <span>
                  <strong>Targeted buyers</strong> — real enthusiasts looking for their next ride
                </span>
              </li>
            </ul>
            <button className="sell-primary-btn" type="button" onClick={begin}>
              Sell now — it’s free
            </button>
          </div>

          <div className="sell-hero-art">
            <div className="sell-hero-backdrop">
              <img src="/hero-blob.png" alt="" className="sell-hero-blob-img" />
            </div>
            <div className="sell-hero-cars-layer">
              <img src="/hero-datsun.png" alt="Classic White Datsun 240Z" className="car-datsun" />
              <img src="/hero-ferrari.png" alt="Blue Ferrari 488" className="car-ferrari" />
              <img src="/hero-porsche.png" alt="Silver Porsche 911 Turbo S" className="car-porsche" />
            </div>
          </div>
        </div>

        {/* WHY SELL WITH VEYO */}
        <section className="sell-section">
          <h2 className="sell-section-title">Why sell with VEYO?</h2>
          <div className="sell-benefits-container">
            <div className="sell-benefits-grid">
              <div className="sell-benefit-card">
                <div className="sell-benefit-icon-wrap">
                  <img
                    src="/icon-benefit-shield.png"
                    alt="Expert moderation & listing support"
                    className="sell-benefit-badge-img"
                  />
                </div>
                <h3>Expert moderation &amp;<br />listing support</h3>
              </div>

              <div className="sell-benefit-card">
                <div className="sell-benefit-icon-wrap">
                  <img
                    src="/icon-benefit-globe.png"
                    alt="Thousands of active, daily car shoppers"
                    className="sell-benefit-badge-img"
                  />
                </div>
                <h3>Thousands of active,<br />daily car shoppers</h3>
              </div>

              <div className="sell-benefit-card">
                <div className="sell-benefit-icon-wrap">
                  <img
                    src="/icon-benefit-dollar.png"
                    alt="No seller fees — you keep every dollar"
                    className="sell-benefit-badge-img"
                  />
                </div>
                <h3>No seller fees — you<br />keep every dollar</h3>
              </div>

              <div className="sell-benefit-card">
                <div className="sell-benefit-icon-wrap">
                  <img
                    src="/icon-benefit-handshake.png"
                    alt="Trusted by sellers: 4.9/5 average rating"
                    className="sell-benefit-badge-img"
                  />
                </div>
                <h3>Trusted by sellers:<br />4.9/5 average rating</h3>
              </div>
            </div>
          </div>
        </section>

        {/* OUR RECENT SALES */}
        <section className="sell-section">
          <div className="sell-recent-header">
            <h2>Our recent sales</h2>
            <div className="sell-carousel-controls">
              <button
                className="sell-carousel-btn"
                type="button"
                onClick={() => scrollTrack('left')}
                aria-label="Previous cars"
              >
                ‹
              </button>
              <button
                className="sell-carousel-btn"
                type="button"
                onClick={() => scrollTrack('right')}
                aria-label="Next cars"
              >
                ›
              </button>
            </div>
          </div>

          <div className="sell-recent-track" ref={trackRef}>
            {recentAuctions.map((auction) => (
              <div
                className="sell-sale-card"
                key={auction.id}
                onClick={() =>
                  auction.id.startsWith('sample') ? begin() : onNavigate('car', { carId: auction.id })
                }
              >
                <div className="sell-sale-image-wrap">
                  <img src={auction.imageUrl} alt={auction.title} />
                  <div className="sell-sold-badge">
                    <span>Sold for</span> ${auction.price.toLocaleString()}
                  </div>
                </div>
                <div className="sell-sale-info">
                  <h4 className="sell-sale-title">{auction.title}</h4>
                  <p className="sell-sale-details">{auction.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHAT SELLERS ARE SAYING */}
        <section className="sell-section">
          <h2 className="sell-section-title">What sellers are saying</h2>
          <div className="sell-testimonials-grid">
            {sellerTestimonials.map((testimonial) => (
              <div className="sell-testimonial-card" key={testimonial.name}>
                <div>
                  <p className="sell-testimonial-quote">“{testimonial.quote}”</p>
                  <div className="sell-testimonial-rating">
                    ★★★★★ <small>5.0</small>
                  </div>
                </div>
                <div className="sell-testimonial-author">
                  <div className="sell-avatar-circle">{testimonial.avatar}</div>
                  <div className="sell-author-meta">
                    <strong>{testimonial.name}</strong>
                    <small>{testimonial.date}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO SELL */}
        <section className="sell-section sell-process-section">
          <h2 className="sell-section-title">How to sell your car</h2>
          <div className="sell-process-grid">
            <div className="sell-process-card">
              <div className="sell-step-number">1</div>
              <h3>Submit your car</h3>
              <p>Fill out a quick form and upload a few photos — we’ll get back to you fast.</p>
            </div>
            <div className="sell-process-card">
              <div className="sell-step-number">2</div>
              <h3>We create your listing</h3>
              <p>Our team builds a high-quality, eye-catching listing with professional copy.</p>
            </div>
            <div className="sell-process-card">
              <div className="sell-step-number">3</div>
              <h3>Auction goes live</h3>
              <p>Your car gets in front of thousands of active buyers with live bids.</p>
            </div>
            <div className="sell-process-card">
              <div className="sell-step-number">4</div>
              <h3>You get paid</h3>
              <p>Once sold, we help close the deal smoothly — no hidden fees, no stress.</p>
            </div>
          </div>
          <button className="sell-primary-btn" type="button" onClick={begin}>
            Get started now
          </button>
        </section>

        {/* FAQ */}
        <section className="sell-faq-section">
          <h2 className="sell-section-title" style={{ textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <div className="sell-faq-list">
            {[
              {
                q: 'How much does it cost to sell a car?',
                a: 'Listing on VEYO is 100% free for sellers. You keep the full final hammer price without deductions or listing fees.',
              },
              {
                q: 'How do I submit my car for sale?',
                a: 'Click the "Sell now" button, fill in your car’s VIN, mileage, specifications, and upload a few photos. Our moderation team will review and contact you promptly.',
              },
              {
                q: 'What is a Reserve Auction vs. a No Reserve Auction?',
                a: 'A Reserve auction has a confidential minimum price. If bidding does not reach the reserve, you are not obligated to sell. A No Reserve auction sells to the highest bidder regardless of amount.',
              },
              {
                q: 'What information do I need to provide?',
                a: 'Basic vehicle info (VIN, mileage, condition details, options) and clear photos of the exterior, interior, engine bay, and documentation.',
              },
            ].map((faq) => (
              <details className="sell-faq-item" key={faq.q}>
                <summary className="sell-faq-summary">
                  <span>{faq.q}</span>
                  <span className="sell-faq-arrow">▼</span>
                </summary>
                <div className="sell-faq-content">{faq.a}</div>
              </details>
            ))}
          </div>
        </section>
      </section>
    );
  }

  // FORM STAGE
  return (
    <section className="sell-page-wrapper">
      <div className="sell-form-wrapper">
        <div className="sell-form-header-layout">
          <div className="sell-form-intro">
            <p className="sell-kicker">Sell your car</p>
            <h1>Tell us about your car</h1>
            <p>
              Please give us the key details about the vehicle you’d like to sell. We’ll review the details and help you create a polished auction listing.
            </p>
            <p>Once accepted, we’ll coordinate with you to launch your live auction.</p>
          </div>

          <aside className="sell-client-card">
            <h3>Client info</h3>
            <label className="sell-input-group">
              <span>Full name</span>
              <input autoComplete="name" defaultValue={user?.name || ''} placeholder="Enter your full name" />
            </label>
            <label className="sell-input-group">
              <span>Contact phone number</span>
              <input autoComplete="tel" inputMode="tel" placeholder="+380981239572" />
            </label>
            <small style={{ color: '#9ca3af', fontSize: '12px' }}>
              Your account is linked to this submission automatically.
            </small>
          </aside>
        </div>

        <form onSubmit={submit} className="sell-form-main">
          <h2 className="sell-form-section-title">Vehicle Information</h2>

          <div className="sell-form-grid-3">
            <label className="sell-input-group sell-col-span-full">
              <span>Car VIN Number</span>
              <input
                required
                minLength={3}
                maxLength={17}
                placeholder="17-character VIN"
                autoCapitalize="characters"
                value={form.vin}
                onChange={(e) => update('vin', e.target.value.toUpperCase())}
              />
            </label>

            <label className="sell-input-group">
              <span>Brand</span>
              <input
                required
                list="car-brands"
                maxLength={100}
                placeholder="e.g. BMW, Porsche"
                value={form.make}
                onChange={(e) => update('make', e.target.value)}
              />
              <datalist id="car-brands">
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name} />
                ))}
              </datalist>
            </label>

            <label className="sell-input-group">
              <span>Model</span>
              <input
                required
                list="car-models"
                maxLength={100}
                placeholder="e.g. M3, 911"
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
              />
              <datalist id="car-models">
                {models.map((model) => (
                  <option key={model.id} value={model.name} />
                ))}
              </datalist>
            </label>

            <label className="sell-input-group">
              <span>Year</span>
              <input
                required
                type="number"
                min="1886"
                max="2100"
                placeholder="e.g. 2021"
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Transmission</span>
              <select value={form.transmission} onChange={(e) => update('transmission', e.target.value)}>
                {enumOptions.transmission.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label className="sell-input-group">
              <span>Mileage</span>
              <input
                required
                type="number"
                min="0"
                placeholder="Miles"
                value={form.mileage}
                onChange={(e) => update('mileage', e.target.value)}
              />
            </label>

            <label className="sell-input-group sell-photo-dropzone">
              <span>Attach photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
              />
              <div className="sell-photo-placeholder">
                {photos.length ? `${photos.length} photo(s) selected` : '📁 Select or drag photos'}
              </div>
            </label>
          </div>

          <hr className="sell-divider" />
          <h2 className="sell-form-section-title">Technical Specifications</h2>

          <div className="sell-form-grid-3">
            <label className="sell-input-group">
              <span>Horsepower</span>
              <input
                required
                type="number"
                min="0"
                placeholder="HP"
                value={form.horsePower}
                onChange={(e) => update('horsePower', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Engine Volume (L)</span>
              <input
                required
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 3.0"
                value={form.engineVolume}
                onChange={(e) => update('engineVolume', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Fuel Type</span>
              <select value={form.fuelType} onChange={(e) => update('fuelType', e.target.value)}>
                {enumOptions.fuel.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label className="sell-input-group">
              <span>Drivetrain</span>
              <select value={form.driveType} onChange={(e) => update('driveType', e.target.value)}>
                {enumOptions.driveType.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label className="sell-input-group">
              <span>Body Type</span>
              <select value={form.bodyType} onChange={(e) => update('bodyType', e.target.value)}>
                {enumOptions.bodyType.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>

            <label className="sell-input-group">
              <span>Exterior Color</span>
              <input
                required
                maxLength={100}
                placeholder="e.g. GT Silver Metallic"
                value={form.exteriorColor}
                onChange={(e) => update('exteriorColor', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Interior Color</span>
              <input
                maxLength={100}
                placeholder="e.g. Black Leather"
                value={form.interiorColor}
                onChange={(e) => update('interiorColor', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Doors</span>
              <input
                required
                type="number"
                min="1"
                max="8"
                value={form.doors}
                onChange={(e) => update('doors', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Seats</span>
              <input
                required
                type="number"
                min="1"
                max="12"
                value={form.seats}
                onChange={(e) => update('seats', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Previous Owners</span>
              <input
                required
                type="number"
                min="0"
                value={form.ownersCount}
                onChange={(e) => update('ownersCount', e.target.value)}
              />
            </label>
          </div>

          <div className="sell-accident-choice">
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Accident History:</span>
            <button
              type="button"
              className={`sell-choice-btn ${form.isAccidentFree ? 'active' : ''}`}
              onClick={() => update('isAccidentFree', true)}
            >
              ✓ No accident history
            </button>
            <button
              type="button"
              className={`sell-choice-btn ${!form.isAccidentFree ? 'active' : ''}`}
              onClick={() => update('isAccidentFree', false)}
            >
              ⚠ Has accident history
            </button>
          </div>

          <hr className="sell-divider" />
          <h2 className="sell-form-section-title">Auction Details</h2>

          <div className="sell-form-grid-3">
            <label className="sell-input-group sell-col-span-full">
              <span>Listing Title</span>
              <input
                required
                maxLength={180}
                placeholder="e.g. 2021 Porsche 911 Turbo S Coupe"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </label>

            <label className="sell-input-group sell-col-span-full">
              <span>Description &amp; Highlights</span>
              <textarea
                required
                rows={5}
                maxLength={5000}
                placeholder="Describe key options, service history, condition, modifications and features..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Location</span>
              <input
                required
                maxLength={200}
                placeholder="City, Country"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Starting Price ($ USD)</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50000"
                value={form.startingPrice}
                onChange={(e) => update('startingPrice', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Auction Starts</span>
              <input
                required
                type="datetime-local"
                value={form.auctionStart}
                onChange={(e) => update('auctionStart', e.target.value)}
              />
            </label>

            <label className="sell-input-group">
              <span>Auction Ends</span>
              <input
                required
                type="datetime-local"
                value={form.auctionEnd}
                onChange={(e) => update('auctionEnd', e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="sell-form-error" role="alert" style={{ marginTop: '24px' }}>
              {error}
            </p>
          )}

          <div className="sell-form-bottom-actions">
            <button className="sell-cancel-btn" type="button" onClick={() => setStage('overview')}>
              Cancel
            </button>
            <button className="sell-primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Car for Review'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SellCar;
