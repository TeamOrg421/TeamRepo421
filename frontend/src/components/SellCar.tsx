import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/config';

interface SellCarProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface CatalogBrand {
  id: string;
  name: string;
}

interface CatalogModel {
  id: string;
  name: string;
}

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
  auctionDuration: string;
  customEndDate: string;
}

const enumOptions = {
  fuel: [['0', 'Petrol'], ['1', 'Diesel'], ['2', 'Electric'], ['3', 'Hybrid'], ['4', 'Gas']],
  transmission: [['0', 'Manual'], ['1', 'Automatic'], ['2', 'Automated manual'], ['3', 'CVT']],
  driveType: [['0', 'All-wheel drive'], ['1', 'Front-wheel drive'], ['2', 'Rear-wheel drive']],
  bodyType: [['0', 'Sedan'], ['1', 'Coupe'], ['2', 'Hatchback'], ['3', 'SUV'], ['4', 'Wagon'], ['5', 'Convertible'], ['6', 'Minivan'], ['7', 'Pickup']],
  // Values must match the backend AuctionDuration enum:
  // OneDay=0, OneWeek=1, OneMonth=2, Forever=3, OneHour=4, TwelveHours=5, Custom=6.
  auctionDuration: [['0', 'A day'], ['1', 'A week'], ['2', 'A month'], ['3', 'Forever'], ['4', '1 hour'], ['5', '12 hours'], ['6', 'Custom date']],
} as const;

const createInitialForm = (): ListingForm => ({
  make: '', model: '', year: String(new Date().getFullYear()), vin: '',
  mileage: '', horsePower: '', engineVolume: '', fuelType: '0', transmission: '1',
  driveType: '2', bodyType: '1', doors: '2', seats: '4', exteriorColor: '',
  interiorColor: '', ownersCount: '1', isAccidentFree: true, title: '', description: '',
  location: '', startingPrice: '', auctionDuration: '1', customEndDate: '',
});

const parseLocalDateTime = (value: string) => {
  if (!value) return null;

  const match = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  if (!match) return null;

  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  if ([year, month, day, hours, minutes].some((item) => Number.isNaN(item))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const getErrorMessage = async (response: Response) => {
  const body = await response.text();
  if (!body) return response.statusText || 'Unable to create the auction.';

  try {
    const parsed = JSON.parse(body);
    return parsed.message || parsed.title || 'Unable to create the auction.';
  } catch {
    return body;
  }
};

const SellCar: React.FC<SellCarProps> = ({ onNavigate }) => {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [form, setForm] = useState<ListingForm>(createInitialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCarId, setCreatedCarId] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState('');

  useEffect(() => {
    const loadCatalogSuggestions = async () => {
      const [brandsResult, modelsResult] = await Promise.allSettled([
        apiCall('/catalog/brands'),
        apiCall('/catalog/models'),
      ]);

      if (brandsResult.status === 'fulfilled' && brandsResult.value.ok) {
        const data = await brandsResult.value.json();
        setBrands(Array.isArray(data) ? data : []);
      }

      if (modelsResult.status === 'fulfilled' && modelsResult.value.ok) {
        const data = await modelsResult.value.json();
        setModels(Array.isArray(data) ? data : []);
      }
    };

    loadCatalogSuggestions();
  }, []);

  const updateForm = <K extends keyof ListingForm>(field: K, value: ListingForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadPhoto = async (carId: string, photo: File, isMain: boolean) => {
    const fileForm = new FormData();
    fileForm.append('file', photo);
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/cars/${carId}/images?isMain=${isMain}`, {
      method: 'POST',
      body: fileForm,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return response.ok;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const startingPrice = Number(form.startingPrice);
    const normalizedDuration = String(form.auctionDuration ?? '').trim();
    const durationValue = Number(normalizedDuration);

    if (!enumOptions.auctionDuration.some(([value]) => String(value) === normalizedDuration)) {
      setError('Choose a valid auction duration.');
      return;
    }

    if (!Number.isFinite(startingPrice) || startingPrice < 0) {
      setError('Enter a valid starting price of 0 or more.');
      return;
    }

    if (normalizedDuration === '6') {
      const customEndDate = parseLocalDateTime(form.customEndDate);
      if (!customEndDate || Number.isNaN(customEndDate.getTime())) {
        setError('Choose a custom end date for the auction.');
        return;
      }

      const minimumAllowed = new Date(Date.now() + 5 * 60 * 1000);
      if (customEndDate <= minimumAllowed) {
        setError('The custom auction end date must be at least 5 minutes in the future.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const customEndDate = normalizedDuration === '6' ? parseLocalDateTime(form.customEndDate) : null;

      const response = await apiCall('/cars', {
        method: 'POST',
        body: JSON.stringify({
          car: {
            make: form.make.trim(),
            model: form.model.trim(),
            year: Number(form.year),
            vin: form.vin.trim().toUpperCase(),
            specification: {
              mileage: Number(form.mileage), horsePower: Number(form.horsePower), engineVolume: Number(form.engineVolume),
              fuelType: Number(form.fuelType), transmission: Number(form.transmission), driveType: Number(form.driveType),
              bodyType: Number(form.bodyType), doors: Number(form.doors), seats: Number(form.seats),
              exteriorColor: form.exteriorColor.trim(), interiorColor: form.interiorColor.trim() || null,
              isAccidentFree: form.isAccidentFree, ownersCount: Number(form.ownersCount),
            },
          },
          auction: {
            title: form.title.trim(), description: form.description.trim(), location: form.location.trim(), startingPrice,
            duration: durationValue,
            customEndDate: customEndDate && !Number.isNaN(customEndDate.getTime()) ? new Date(customEndDate.getTime() - customEndDate.getTimezoneOffset() * 60000).toISOString() : null,
          },
        }),
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return;
      }

      const created = await response.json() as { carId?: string };
      if (!created.carId) {
        setError('The auction was created, but the returned car ID is missing.');
        return;
      }

      const failedUploads: string[] = [];
      for (const [index, photo] of photos.entries()) {
        try {
          if (!await uploadPhoto(created.carId, photo, index === 0)) failedUploads.push(photo.name);
        } catch {
          failedUploads.push(photo.name);
        }
      }

      setPhotoWarning(failedUploads.length ? `The auction was created, but ${failedUploads.length} photo(s) could not be uploaded.` : '');
      setCreatedCarId(created.carId);
    } catch {
      setError('Unable to contact the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdCarId) {
    return (
      <section className="sell-car-page">
        <div className="sell-car-success glass-panel">
          <p className="sell-car-eyebrow">Listing created</p>
          <h1>Your auction is live</h1>
          <p>Your car, specification and auction details were saved successfully. It will go live once a moderator approves it.</p>
          {photoWarning && <p className="sell-car-error" role="alert">{photoWarning}</p>}
          <div className="sell-car-actions">
            <button className="btn btn-secondary" type="button" onClick={() => onNavigate('home')}>All auctions</button>
            <button className="btn btn-primary" type="button" onClick={() => onNavigate('car', { carId: createdCarId })}>View your listing</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sell-car-page">
      <div className="sell-car-intro">
        <p className="sell-car-eyebrow">Create a listing</p>
        <h1>Sell your car at auction</h1>
        <p>Enter the actual details of your vehicle. You can use an existing make and model or enter a new one.</p>
      </div>

      <form className="sell-car-form glass-panel" onSubmit={handleSubmit}>
        <fieldset className="sell-car-fieldset">
          <legend>Vehicle</legend>
          <div className="sell-car-grid">
            <label className="sell-car-field"><span>Make</span><input required list="car-brands" maxLength={100} placeholder="For example: BMW" value={form.make} onChange={(event) => updateForm('make', event.target.value)} /><datalist id="car-brands">{brands.map((brand) => <option key={brand.id} value={brand.name} />)}</datalist></label>
            <label className="sell-car-field"><span>Model</span><input required list="car-models" maxLength={100} placeholder="For example: M3 Competition" value={form.model} onChange={(event) => updateForm('model', event.target.value)} /><datalist id="car-models">{models.map((model) => <option key={model.id} value={model.name} />)}</datalist></label>
            <label className="sell-car-field"><span>Year</span><input required type="number" min="1886" max="2100" value={form.year} onChange={(event) => updateForm('year', event.target.value)} /></label>
            <label className="sell-car-field"><span>VIN</span><input required type="text" minLength={3} maxLength={17} autoCapitalize="characters" placeholder="17-character VIN" value={form.vin} onChange={(event) => updateForm('vin', event.target.value.toUpperCase())} /></label>
          </div>
        </fieldset>

        <fieldset className="sell-car-fieldset">
          <legend>Specifications</legend>
          <div className="sell-car-grid">
            <label className="sell-car-field"><span>Mileage</span><input required type="number" min="0" placeholder="Miles" value={form.mileage} onChange={(event) => updateForm('mileage', event.target.value)} /></label>
            <label className="sell-car-field"><span>Horsepower</span><input required type="number" min="0" placeholder="HP" value={form.horsePower} onChange={(event) => updateForm('horsePower', event.target.value)} /></label>
            <label className="sell-car-field"><span>Engine volume, L</span><input required type="number" min="0" step="0.1" placeholder="e.g. 3.0" value={form.engineVolume} onChange={(event) => updateForm('engineVolume', event.target.value)} /></label>
            <label className="sell-car-field"><span>Fuel</span><select value={form.fuelType} onChange={(event) => updateForm('fuelType', event.target.value)}>{enumOptions.fuel.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="sell-car-field"><span>Transmission</span><select value={form.transmission} onChange={(event) => updateForm('transmission', event.target.value)}>{enumOptions.transmission.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="sell-car-field"><span>Drivetrain</span><select value={form.driveType} onChange={(event) => updateForm('driveType', event.target.value)}>{enumOptions.driveType.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="sell-car-field"><span>Body style</span><select value={form.bodyType} onChange={(event) => updateForm('bodyType', event.target.value)}>{enumOptions.bodyType.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="sell-car-field"><span>Doors</span><input required type="number" min="1" max="8" value={form.doors} onChange={(event) => updateForm('doors', event.target.value)} /></label>
            <label className="sell-car-field"><span>Seats</span><input required type="number" min="1" max="12" value={form.seats} onChange={(event) => updateForm('seats', event.target.value)} /></label>
            <label className="sell-car-field"><span>Exterior color</span><input required maxLength={100} placeholder="For example: Alpine White" value={form.exteriorColor} onChange={(event) => updateForm('exteriorColor', event.target.value)} /></label>
            <label className="sell-car-field"><span>Interior color</span><input maxLength={100} placeholder="Optional" value={form.interiorColor} onChange={(event) => updateForm('interiorColor', event.target.value)} /></label>
            <label className="sell-car-field"><span>Previous owners</span><input required type="number" min="0" value={form.ownersCount} onChange={(event) => updateForm('ownersCount', event.target.value)} /></label>
            <label className="sell-car-checkbox"><input type="checkbox" checked={form.isAccidentFree} onChange={(event) => updateForm('isAccidentFree', event.target.checked)} /><span>No accident history</span></label>
          </div>
        </fieldset>

        <fieldset className="sell-car-fieldset">
          <legend>Auction</legend>
          <div className="sell-car-grid">
            <label className="sell-car-field sell-car-field-wide"><span>Listing title</span><input required maxLength={180} placeholder="For example: One-owner 2021 BMW M3 Competition" value={form.title} onChange={(event) => updateForm('title', event.target.value)} /></label>
            <label className="sell-car-field sell-car-field-wide"><span>Description</span><textarea required rows={6} maxLength={5000} placeholder="Tell bidders about the car's history, condition, options and flaws." value={form.description} onChange={(event) => updateForm('description', event.target.value)} /></label>
            <label className="sell-car-field"><span>Location</span><input required maxLength={200} placeholder="City, country" value={form.location} onChange={(event) => updateForm('location', event.target.value)} /></label>
            <label className="sell-car-field"><span>Starting price, USD</span><input required type="number" min="0" step="0.01" placeholder="0.00" value={form.startingPrice} onChange={(event) => updateForm('startingPrice', event.target.value)} /></label>
            <label className="sell-car-field"><span>Auction length</span><select value={form.auctionDuration} onChange={(event) => updateForm('auctionDuration', event.target.value)}>{enumOptions.auctionDuration.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>The auction starts as soon as a moderator approves this listing.</small></label>
            {form.auctionDuration === '6' && (
              <label className="sell-car-field">
                <span>Custom end date</span>
                <input
                  type="datetime-local"
                  value={form.customEndDate}
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(event) => updateForm('customEndDate', event.target.value)}
                />
                <small>Choose the exact end time of the auction.</small>
              </label>
            )}
            <label className="sell-car-field sell-car-field-wide"><span>Photos</span><input type="file" accept="image/*" multiple onChange={(event) => setPhotos(Array.from(event.target.files ?? []))} /><small>You can add a cover image and additional photos. The first photo becomes the cover.</small></label>
          </div>
        </fieldset>

        {error && <p className="sell-car-error" role="alert">{error}</p>}
        <div className="sell-car-actions">
          <button className="btn btn-secondary" type="button" onClick={() => onNavigate('home')}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating auction…' : 'Create auction'}</button>
        </div>
      </form>
    </section>
  );
};

export default SellCar;
