import { useState } from 'react';

const FACILITY_TYPES = ['Court', 'Field', 'Pool', 'Studio', 'Room'];

function FacilityForm({ initialData, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState({
    name: initialData.name ?? '',
    type: initialData.type ?? 'Court',
    capacity: initialData.capacity ?? '',
    hourlyRate: initialData.hourlyRate ?? '',
    description: initialData.description ?? '',
    isAvailable: initialData.isAvailable ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      capacity: Number(form.capacity),
      hourlyRate: form.hourlyRate === '' ? 0 : Number(form.hourlyRate),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="name">Name *</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="type">Type *</label>
          <select id="type" name="type" value={form.type} onChange={handleChange}>
            {FACILITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="capacity">Capacity *</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={form.capacity}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="hourlyRate">Hourly rate (₱)</label>
        <input
          id="hourlyRate"
          name="hourlyRate"
          type="number"
          min="0"
          value={form.hourlyRate}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows="3"
          maxLength={500}
          value={form.description}
          onChange={handleChange}
        />
      </div>

      <label className="checkbox-field">
        <input
          name="isAvailable"
          type="checkbox"
          checked={form.isAvailable}
          onChange={handleChange}
        />
        Available for booking
      </label>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default FacilityForm;