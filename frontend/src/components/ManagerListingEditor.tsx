import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/config';
import './ManagerListingEditor.css';

type Image = { id: string; imageUrl: string; isMain: boolean; carId: string };
type Form = Record<'make' | 'model' | 'year' | 'vin' | 'mileage' | 'horsePower' | 'engineVolume' | 'fuelType' | 'transmission' | 'driveType' | 'bodyType' | 'doors' | 'seats' | 'exteriorColor' | 'interiorColor' | 'ownersCount' | 'title' | 'description' | 'location' | 'startingPrice' | 'duration' | 'customEndDate', string> & { isAccidentFree: boolean };

const emptyForm: Form = { make: '', model: '', year: '', vin: '', mileage: '', horsePower: '', engineVolume: '', fuelType: '0', transmission: '1', driveType: '2', bodyType: '1', doors: '2', seats: '4', exteriorColor: '', interiorColor: '', ownersCount: '0', isAccidentFree: true, title: '', description: '', location: '', startingPrice: '', duration: '1', customEndDate: '' };
const options = {
  fuelType: [['0', 'Petrol'], ['1', 'Diesel'], ['2', 'Electric'], ['3', 'Hybrid'], ['4', 'Gas']],
  transmission: [['0', 'Manual'], ['1', 'Automatic'], ['2', 'Automated manual'], ['3', 'CVT']],
  driveType: [['0', 'All-wheel drive'], ['1', 'Front-wheel drive'], ['2', 'Rear-wheel drive']],
  bodyType: [['0', 'Sedan'], ['1', 'Coupe'], ['2', 'Hatchback'], ['3', 'SUV'], ['4', 'Wagon'], ['5', 'Convertible'], ['6', 'Minivan'], ['7', 'Pickup']],
  duration: [['0', 'A day'], ['1', 'A week'], ['2', 'A month'], ['3', 'Forever'], ['4', '1 hour'], ['5', '12 hours'], ['6', 'Custom date']],
} as const;

const messageFrom = async (response: Response, fallback: string) => {
  const text = await response.text();
  if (!text) return fallback;
  try { return JSON.parse(text).message || fallback; } catch { return text; }
};

const ManagerListingEditor: React.FC<{ listingId: string | null; onBack: () => void }> = ({ listingId, onBack }) => {
  const { isAuthenticated, roles } = useAuth();
  const [form, setForm] = useState<Form>(emptyForm);
  const [images, setImages] = useState<Image[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [carId, setCarId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isManager = roles.includes('Admin') || roles.includes('Moderator');

  const update = (key: keyof Form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true); setError('');
    try {
      const response = await apiCall(`/AuctionModeration/${listingId}`);
      if (!response.ok) throw new Error(await messageFrom(response, 'Unable to load listing details.'));
      const data = await response.json();
      setCarId(data.carId || '');
      setImages(Array.isArray(data.images) ? data.images : []);
      const end = data.auctionEnd ? new Date(data.auctionEnd) : null;
      setForm({
        make: data.brandName || '', model: data.modelName || '', year: String(data.year ?? ''), vin: data.vin || '',
        mileage: String(data.mileage ?? 0), horsePower: String(data.horsePower ?? 0), engineVolume: String(data.engineVolume ?? 0),
        fuelType: String(data.fuelType ?? 0), transmission: String(data.transmission ?? 1), driveType: String(data.driveType ?? 2), bodyType: String(data.bodyType ?? 1),
        doors: String(data.doors ?? 2), seats: String(data.seats ?? 4), exteriorColor: data.color || '', interiorColor: data.interiorColor || '', ownersCount: String(data.ownersCount ?? 0),
        isAccidentFree: Boolean(data.isAccidentFree), title: data.title || '', description: data.description || '', location: data.location || '', startingPrice: String(data.startingPrice ?? 0),
        duration: String(data.duration ?? 1), customEndDate: end && !Number.isNaN(end.getTime()) ? end.toISOString().slice(0, 16) : '',
      });
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load listing details.'); }
    finally { setLoading(false); }
  }, [listingId]);

  useEffect(() => { void load(); }, [load]);

  const deleteImage = async (image: Image) => {
    if (!window.confirm('Delete this photo permanently?')) return;
    setError('');
    const response = await apiCall(`/cars/images/${image.id}`, { method: 'DELETE' });
    if (!response.ok) { setError(await messageFrom(response, 'Unable to delete this photo.')); return; }
    setImages(current => current.filter(item => item.id !== image.id));
  };

  const setMainImage = async (image: Image) => {
    setError('');
    const response = await apiCall(`/cars/images/${image.id}/main`, { method: 'PUT' });
    if (!response.ok) { setError(await messageFrom(response, 'Unable to set the main photo.')); return; }
    setImages(current => current.map(item => ({ ...item, isMain: item.id === image.id })));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listingId || !carId) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const customEndDate = form.duration === '6' && form.customEndDate ? new Date(form.customEndDate).toISOString() : null;
      const response = await apiCall(`/AuctionModeration/${listingId}/listing`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, year: Number(form.year), mileage: Number(form.mileage), horsePower: Number(form.horsePower), engineVolume: Number(form.engineVolume), fuelType: Number(form.fuelType), transmission: Number(form.transmission), driveType: Number(form.driveType), bodyType: Number(form.bodyType), doors: Number(form.doors), seats: Number(form.seats), ownersCount: Number(form.ownersCount), startingPrice: Number(form.startingPrice), duration: Number(form.duration), customEndDate }),
      });
      if (!response.ok) throw new Error(await messageFrom(response, 'Unable to save the listing.'));

      for (const [index, photo] of newPhotos.entries()) {
        const data = new FormData(); data.append('file', photo);
        const upload = await apiCall(`/cars/${carId}/images?isMain=${images.length === 0 && index === 0}`, { method: 'POST', body: data });
        if (!upload.ok) throw new Error(await messageFrom(upload, 'The listing was saved, but a photo could not be uploaded.'));
      }
      setNewPhotos([]);
      setSuccess('Listing updated successfully.');
      await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Unable to save the listing.'); }
    finally { setSaving(false); }
  };

  if (!isAuthenticated || !isManager) return <section className="manager-listing-editor"><p>You do not have permission to edit listings.</p></section>;
  if (!listingId) return <section className="manager-listing-editor"><p>Listing was not selected.</p><button onClick={onBack}>Back to dashboard</button></section>;
  if (loading) return <section className="manager-listing-editor"><p>Loading listing editor…</p></section>;

  return <section className="manager-listing-editor">
    <div className="manager-listing-editor-head"><div><p>Manager tools</p><h1>Edit pending listing</h1><span>Changes are saved before approval and remain visible to the seller.</span></div><button type="button" onClick={onBack}>← Back to dashboard</button></div>
    <form onSubmit={save} className="manager-listing-editor-form">
      <h2>Vehicle information</h2><div className="manager-listing-fields">
        <Field label="Brand"><input required value={form.make} onChange={e => update('make', e.target.value)} /></Field>
        <Field label="Model"><input required value={form.model} onChange={e => update('model', e.target.value)} /></Field>
        <Field label="Year"><input required type="number" min="1886" max="2100" value={form.year} onChange={e => update('year', e.target.value)} /></Field>
        <Field label="VIN"><input required maxLength={17} value={form.vin} onChange={e => update('vin', e.target.value.toUpperCase())} /></Field>
        <Field label="Mileage"><input required type="number" min="0" value={form.mileage} onChange={e => update('mileage', e.target.value)} /></Field>
      </div>
      <h2>Photos</h2><div className="manager-listing-images">{images.map(image => <article key={image.id}><img src={image.imageUrl} alt="Listing" /><div>{image.isMain && <b>Main photo</b>}<button type="button" onClick={() => void setMainImage(image)} disabled={image.isMain}>Make main</button><button type="button" className="danger" onClick={() => void deleteImage(image)}>Delete</button></div></article>)}</div>
      <label className="manager-photo-upload"><span>Add photos</span><input type="file" accept="image/*" multiple onChange={e => setNewPhotos(Array.from(e.target.files ?? []))} />{newPhotos.length > 0 && <small>{newPhotos.length} new photo(s) will be uploaded when saved.</small>}</label>
      <h2>Technical specifications</h2><div className="manager-listing-fields">
        <Field label="Horsepower"><input required type="number" min="0" value={form.horsePower} onChange={e => update('horsePower', e.target.value)} /></Field>
        <Field label="Engine volume (L)"><input required type="number" min="0" step="0.1" value={form.engineVolume} onChange={e => update('engineVolume', e.target.value)} /></Field>
        <Select label="Fuel type" value={form.fuelType} onChange={value => update('fuelType', value)} options={options.fuelType} />
        <Select label="Transmission" value={form.transmission} onChange={value => update('transmission', value)} options={options.transmission} />
        <Select label="Drivetrain" value={form.driveType} onChange={value => update('driveType', value)} options={options.driveType} />
        <Select label="Body type" value={form.bodyType} onChange={value => update('bodyType', value)} options={options.bodyType} />
        <Field label="Exterior color"><input required value={form.exteriorColor} onChange={e => update('exteriorColor', e.target.value)} /></Field>
        <Field label="Interior color"><input value={form.interiorColor} onChange={e => update('interiorColor', e.target.value)} /></Field>
        <Field label="Doors"><input required type="number" min="1" max="8" value={form.doors} onChange={e => update('doors', e.target.value)} /></Field>
        <Field label="Seats"><input required type="number" min="1" max="12" value={form.seats} onChange={e => update('seats', e.target.value)} /></Field>
        <Field label="Previous owners"><input required type="number" min="0" value={form.ownersCount} onChange={e => update('ownersCount', e.target.value)} /></Field>
      </div>
      <div className="manager-accident"><span>Accident history</span><label><input type="radio" checked={form.isAccidentFree} onChange={() => update('isAccidentFree', true)} /> No accidents</label><label><input type="radio" checked={!form.isAccidentFree} onChange={() => update('isAccidentFree', false)} /> Has accident history</label></div>
      <h2>Listing details</h2><div className="manager-listing-fields">
        <Field label="Listing title" full><input required maxLength={180} value={form.title} onChange={e => update('title', e.target.value)} /></Field>
        <Field label="Description" full><textarea required rows={6} maxLength={5000} value={form.description} onChange={e => update('description', e.target.value)} /></Field>
        <Field label="Location"><input required maxLength={200} value={form.location} onChange={e => update('location', e.target.value)} /></Field>
        <Field label="Starting price ($)"><input required type="number" min="0" step="0.01" value={form.startingPrice} onChange={e => update('startingPrice', e.target.value)} /></Field>
        <Select label="Auction length" value={form.duration} onChange={value => update('duration', value)} options={options.duration} />
        {form.duration === '6' && <Field label="Custom end date"><input required type="datetime-local" value={form.customEndDate} onChange={e => update('customEndDate', e.target.value)} /></Field>}
      </div>
      {error && <p className="manager-listing-message error">{error}</p>}{success && <p className="manager-listing-message success">{success}</p>}
      <div className="manager-listing-actions"><button type="button" onClick={onBack}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save listing'}</button></div>
    </form>
  </section>;
};

const Field: React.FC<{ label: string; full?: boolean; children: React.ReactNode }> = ({ label, full, children }) => <label className={full ? 'full' : ''}><span>{label}</span>{children}</label>;
const Select: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[] }> = ({ label, value, onChange, options: items }) => <Field label={label}><select value={value} onChange={e => onChange(e.target.value)}>{items.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></Field>;

export default ManagerListingEditor;
