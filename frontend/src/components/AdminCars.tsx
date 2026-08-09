import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/config';

interface AdminCarsProps {
  onNavigate: (page: string, params?: { carId?: number | string }) => void;
}

interface CarSpecificationDto {
  id?: string;
  carId?: string;
  mileage?: number;
  horsePower?: number;
  engineVolume?: number;
  fuelType?: number;
  transmission?: number;
  driveType?: number;
  bodyType?: number;
  doors?: number;
  seats?: number;
  color?: string;
  isAccidentFree?: boolean;
  ownersCount?: number;
}

interface CarDto {
  id: string;
  year: number;
  isAvailable: boolean;
  vin: string;
  modelId: string;
  modelName: string;
  brandName: string;
  imageUrl?: string;
  images?: Array<{ imageUrl?: string } | string>;
  specification?: CarSpecificationDto;
}

interface CarModelDto {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
}

interface CarFormData {
  id?: string;
  year: number;
  vin: string;
  modelId: string;
  isAvailable: boolean;
  mileage: number;
  horsePower: number;
  engineVolume: number;
  color: string;
  imageUrl: string;
  imageFile?: File | null;
}

const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';

const DEFAULT_FORM: CarFormData = {
  year: new Date().getFullYear(),
  vin: '',
  modelId: '',
  isAvailable: true,
  mileage: 5000,
  horsePower: 400,
  engineVolume: 3.0,
  color: 'Black',
  imageUrl: '',
  imageFile: null,
};

const AdminCars: React.FC<AdminCarsProps> = ({ onNavigate }) => {
  const [cars, setCars] = useState<CarDto[]>([]);
  const [models, setModels] = useState<CarModelDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCar, setEditingCar] = useState<CarDto | null>(null);
  const [formData, setFormData] = useState<CarFormData>(DEFAULT_FORM);

  // Delete modal state
  const [deletingCar, setDeletingCar] = useState<CarDto | null>(null);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch cars and models from backend API
  const fetchCarsAndModels = async () => {
    setLoading(true);
    try {
      const carsRes = await apiCall('/cars');
      if (carsRes.ok) {
        const carsData = await carsRes.json();
        setCars(Array.isArray(carsData) ? carsData : []);
      }

      const modelsRes = await apiCall('/catalog/models');
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(Array.isArray(modelsData) ? modelsData : []);
      }
    } catch (error) {
      console.error('Database loading error:', error);
      showToast('❌ Error connecting to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarsAndModels();
  }, []);

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingCar(null);
    const randomVin = `WPO${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
    const defaultModelId = models.length > 0 ? models[0].id : '';

    setFormData({
      ...DEFAULT_FORM,
      vin: randomVin,
      modelId: defaultModelId,
      imageUrl: '',
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  const getMainImageUrl = (car: CarDto | null | undefined): string => {
    if (!car) return '';
    const images = car.images ?? [];
    const firstImage = images.find((img) => typeof img === 'string' ? Boolean(img) : Boolean(img?.imageUrl));
    if (typeof firstImage === 'string') return firstImage;
    return firstImage && typeof firstImage === 'object' ? (firstImage.imageUrl ?? '') : (car.imageUrl ?? '');
  };

  const uploadCarImage = async (carId: string) => {
    if (!formData.imageFile) return;

    const fileForm = new FormData();
    fileForm.append('file', formData.imageFile);

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/cars/${carId}/images?isMain=true`, {
      method: 'POST',
      body: fileForm,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Image upload failed');
    }
  };

  // Open edit modal
  const handleOpenEditModal = (car: CarDto) => {
    setEditingCar(car);
    setFormData({
      id: car.id,
      year: car.year,
      vin: car.vin,
      modelId: car.modelId,
      isAvailable: car.isAvailable,
      mileage: car.specification?.mileage || 5000,
      horsePower: car.specification?.horsePower || 400,
      engineVolume: car.specification?.engineVolume || 3.0,
      color: car.specification?.color || 'White',
      imageUrl: getMainImageUrl(car),
      imageFile: null,
    });
    setIsModalOpen(true);
  };

  // Save Car (POST or PUT to /api/cars)
  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vin.trim()) {
      showToast('⚠️ Please enter the VIN code of the car.');
      return;
    }

    if (!formData.modelId) {
      showToast('⚠️ Choose a model from the catalog');
      return;
    }

    try {
      if (editingCar) {
        const res = await apiCall(`/cars/${editingCar.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            id: editingCar.id,
            year: Number(formData.year),
            isAvailable: formData.isAvailable,
            vin: formData.vin,
            modelId: formData.modelId,
          }),
        });

        if (res.ok) {
          if (formData.imageFile) {
            await uploadCarImage(editingCar.id);
          }

          setCars(prev =>
            prev.map(c =>
              c.id === editingCar.id
                ? {
                  ...c,
                  year: Number(formData.year),
                  vin: formData.vin,
                  modelId: formData.modelId,
                  isAvailable: formData.isAvailable,
                  imageUrl: formData.imageFile ? formData.imageUrl : c.imageUrl,
                }
                : c
            )
          );
          showToast(`✅ Data of car VIN: ${formData.vin} successfully updated!`);
          setIsModalOpen(false);
          await fetchCarsAndModels();
        } else {
          const errText = await res.text();
          showToast(`❌ Update error: ${errText || res.statusText}`);
        }
      } else {
        const selectedModel = models.find((m) => m.id === formData.modelId);
        const createPayload = {
          createCarDto: {
            year: Number(formData.year),
            isAvailable: formData.isAvailable,
            vin: formData.vin,
            modelId: formData.modelId,
          },
          actionLotDto: {
            title: `${selectedModel?.brandName || 'Car'} ${selectedModel?.name || 'Model'} ${formData.year}`,
            description: `Auction listing for ${selectedModel?.brandName || 'Car'} ${selectedModel?.name || 'Model'} (${formData.year}).`,
            startingPrice: 0,
            auctionStart: new Date().toISOString(),
            auctionEnd: new Date(Date.now() + 86400000).toISOString(),
            type: 'Auction',
          }
        };

        const res = await apiCall('/cars', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        });

        if (res.ok) {
          const location = res.headers.get('location') || '';
          const idFromLocation = location.split('/').filter(Boolean).pop();
          const text = await res.text();
          let createdCarId = idFromLocation || '';

          if (!createdCarId && text) {
            try {
              const parsed = JSON.parse(text);
              createdCarId = parsed.id ?? parsed.carId ?? '';
            } catch {
              createdCarId = text;
            }
          }

          if (createdCarId && formData.imageFile) {
            await uploadCarImage(createdCarId);
          }

          showToast(`🎉 New car added to the database!`);
          setIsModalOpen(false);
          await fetchCarsAndModels();
        } else {
          const errText = await res.text();
          showToast(`❌ Creation error: ${errText || res.statusText}`);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      showToast(err instanceof Error ? `❌ ${err.message}` : '❌ Failed to save car to database.');
    }
  };

  // Delete Car (DELETE /api/cars/{id})
  const handleConfirmDelete = async () => {
    if (!deletingCar) return;

    try {
      const res = await apiCall(`/cars/${deletingCar.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(`🗑️ Car (VIN: ${deletingCar.vin}) has been deleted from the database!`);
        setDeletingCar(null);
        await fetchCarsAndModels();
      } else {
        const errText = await res.text();
        showToast(`❌ Deletion error: ${errText || res.statusText}`);
      }
    } catch (err) {
      console.error('Deletion error:', err);
      showToast('❌ Error performing deletion request.');
    }
  };

  // Filter cars
  const filteredCars = cars.filter(car => {
    const title = `${car.brandName || ''} ${car.modelName || ''}`.toLowerCase();
    const searchLower = search.toLowerCase();
    const matchesSearch =
      title.includes(searchLower) ||
      car.vin.toLowerCase().includes(searchLower) ||
      String(car.year).includes(searchLower) ||
      (car.brandName && car.brandName.toLowerCase().includes(searchLower)) ||
      (car.modelName && car.modelName.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'available' && car.isAvailable) ||
      (statusFilter === 'unavailable' && !car.isAvailable);

    return matchesSearch && matchesStatus;
  });

  const availableCount = cars.filter(c => c.isAvailable).length;
  const unavailableCount = cars.filter(c => !c.isAvailable).length;

  return (
    <div className="admin-cars-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">
            Database of <span className="gradient-text-accent">Cars</span>
          </h1>
        </div>

        <button className="btn btn-primary btn-add-car" onClick={handleOpenCreateModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add car to database
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="glass-panel admin-stat-card">
          <div className="stat-card-icon stat-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div>
            <span className="stat-card-label">Cars in total database</span>
            <h3 className="stat-card-value">{loading ? '...' : cars.length}</h3>
          </div>
        </div>

        <div className="glass-panel admin-stat-card">
          <div className="stat-card-icon stat-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <span className="stat-card-label">Available cars</span>
            <h3 className="stat-card-value text-emerald">{loading ? '...' : availableCount}</h3>
          </div>
        </div>

        <div className="glass-panel admin-stat-card">
          <div className="stat-card-icon stat-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <span className="stat-card-label">Booked / Unavailable</span>
            <h3 className="stat-card-value text-amber">{loading ? '...' : unavailableCount}</h3>
          </div>
        </div>

        <div className="glass-panel admin-stat-card">
          <div className="stat-card-icon stat-icon-indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <span className="stat-card-label">Models in database</span>
            <h3 className="stat-card-value text-indigo">{models.length}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel admin-toolbar">
        <div className="admin-search-wrapper">
          <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search in DB by brand, model, VIN or year..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="admin-filter-tabs">
          <button
            className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({cars.length})
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'available' ? 'active' : ''}`}
            onClick={() => setStatusFilter('available')}
          >
            Available ({availableCount})
          </button>
          <button
            className={`admin-filter-btn ${statusFilter === 'unavailable' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unavailable')}
          >
            Booked / Unavailable ({unavailableCount})
          </button>
        </div>
      </div>

      {/* Cars Data Table */}
      <div className="glass-panel admin-table-container">
        {loading ? (
          <div className="admin-empty-state">
            <p>⏳ Loading data from the database server...</p>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="admin-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h3>No cars found for the specified filters</h3>
            <p>Click "Add Car to Database" to create a new record.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Year</th>
                <th>VIN code</th>
                <th>Specifications</th>
                <th>Status in database</th>
                <th className="text-right">Actions in the database</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map(car => {
                const matchedModel = models.find(m => m.id === car.modelId);
                const brand = car.brandName || matchedModel?.brandName || '—';
                const model = car.modelName || matchedModel?.name || '—';
                const photoUrl = getMainImageUrl(car) || FALLBACK_CAR_IMAGE;

                return (
                  <tr key={car.id} className="admin-table-row">
                    {/* Brand column */}
                    <td>
                      <div className="admin-car-cell">
                        <img
                          src={photoUrl}
                          alt={`${brand} ${model}`}
                          className="admin-car-thumb"
                          onError={e => {
                            (e.target as HTMLImageElement).src = FALLBACK_CAR_IMAGE;
                          }}
                        />
                        <div>
                          <div className="admin-car-title">
                            {brand}
                          </div>
                          <div className="admin-car-meta">
                            ID: <span style={{ fontFamily: 'monospace' }}>{car.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Model column */}
                    <td>
                      <span className="admin-model-name"
                        onClick={() => onNavigate('car', { carId: car.id })}
                        title="View car">
                        {model}
                      </span>
                    </td>

                    <td>
                      <span className="admin-year-badge">{car.year}</span>
                    </td>

                    <td>
                      <div className="admin-vin-badge">{car.vin}</div>
                    </td>

                    <td>
                      <div className="admin-subtext">
                        {car.specification?.engineVolume ? `${car.specification.engineVolume}L` : 'Engine'}{' '}
                        {car.specification?.horsePower ? `(${car.specification.horsePower} hp)` : ''}
                      </div>
                      <div className="admin-subtext">
                        {car.specification?.color || 'Color not specified'} | {car.specification?.mileage ? `${car.specification.mileage.toLocaleString()} miles` : 'Mileage 0'}
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill ${car.isAvailable ? 'status-available' : 'status-sold'}`}>
                        {car.isAvailable ? '● Available' : '● Booked / Unavailable'}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions-cell">
                        <button
                          className="btn-action btn-action-view"
                          title="View in application"
                          onClick={() => onNavigate('car', { carId: car.id })}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        <button
                          className="btn-action btn-action-edit"
                          title="Edit record and photo"
                          onClick={() => handleOpenEditModal(car)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        <button
                          className="btn-action btn-action-delete"
                          title="Delete from database"
                          onClick={() => setDeletingCar(car)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Create / Edit Car */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingCar ? 'Edit car and photo' : 'Create new car in the database'}</h2>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="admin-modal-form">
              <div className="admin-form-grid">
                <div className="form-group span-2">
                  <label className="form-label">Main photo for blob storage *</label>
                  <div className="admin-photo-edit-box">
                    <img
                      src={formData.imageUrl || FALLBACK_CAR_IMAGE}
                      alt="Car preview"
                      className="admin-photo-preview"
                      onError={e => {
                        (e.target as HTMLImageElement).src = FALLBACK_CAR_IMAGE;
                      }}
                    />
                    <div className="admin-photo-controls">
                      <input
                        type="file"
                        accept="image/*"
                        className="form-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setFormData({
                            ...formData,
                            imageFile: file,
                            imageUrl: file ? URL.createObjectURL(file) : '',
                          });
                        }}
                      />
                      <small className="form-hint">Uploaded image is sent to Azure Blob Storage automatically.</small>
                    </div>
                  </div>
                </div>

                <div className="form-group span-2">
                  <label className="form-label">Model from the database *</label>
                  {models.length > 0 ? (
                    <select
                      required
                      className="form-input"
                      value={formData.modelId}
                      onChange={e => setFormData({ ...formData, modelId: e.target.value })}
                    >
                      <option value="">-- Select a model from the database --</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.brandName} - {m.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Enter Model ID (Guid)"
                      value={formData.modelId}
                      onChange={e => setFormData({ ...formData, modelId: e.target.value })}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Year of manufacture *</label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2027}
                    className="form-input"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">VIN Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Unique VIN code"
                    value={formData.vin}
                    onChange={e => setFormData({ ...formData, vin: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Availability in the database</label>
                  <select
                    className="form-input"
                    value={formData.isAvailable ? 'true' : 'false'}
                    onChange={e => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                  >
                    <option value="true">Available</option>
                    <option value="false">Reserved</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mileage (miles)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={formData.mileage}
                    onChange={e => setFormData({ ...formData, mileage: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horsepower (hp)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={formData.horsePower}
                    onChange={e => setFormData({ ...formData, horsePower: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Engine volume (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    className="form-input"
                    value={formData.engineVolume}
                    onChange={e => setFormData({ ...formData, engineVolume: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCar ? 'Update in database' : 'Save to database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deletingCar !== null && (
        <div className="admin-modal-overlay" onClick={() => setDeletingCar(null)}>
          <div className="glass-panel admin-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3>Delete from database?</h3>
            <p>
              Are you sure you want to delete the car with VIN <strong>{deletingCar.vin}</strong> directly from the database table?
            </p>
            <div className="confirm-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeletingCar(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Yes, delete from database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCars;
