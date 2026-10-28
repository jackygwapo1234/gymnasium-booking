import { useEffect, useState } from 'react';
import { getFacilities } from '../api/client';
import { todayInputValue } from '../utils/format';

const PURPOSES = ['Training', 'Game', 'Event', 'Class', 'Other'];
const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

function BookingForm({ initialData, onSubmit, onCancel, saving, error, submitLabel = 'Save' }) {
  const isEdit = Boolean(initialData._id);
  const originalFacilityId = initialData.facility?._id ?? initialData.facility ?? '';

  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState({
    customerName: initialData.customerName ?? '',
    contactNumber: initialData.contactNumber ?? '',
    email: initialData.email ?? '',
    facility: originalFacilityId,
    bookingDate: initialData.bookingDate ? initialData.bookingDate.slice(0, 10) : '',
    startTime: initialData.startTime ?? '',
    endTime: initialData.endTime ?? '',
    numberOfPeople: initialData.numberOfPeople ?? '',
    purpose: initialData.purpose ?? '',
    status: initialData.status ?? 'Pending',
    notes: initialData.notes ?? '',
  });

  // Load the facilities for the dropdown
  useEffect(() => {
    getFacilities()
      .then((data) => setFacilities(data))
      .catch(() => setFacilities([]));
  }, []);

  // Only available facilities, plus the booking's own facility when editing
  const bookableFacilities = facilities.filter(
    (facility) => facility.isAvailable || facility._id === originalFacilityId
  );
  const selectedFacility = facilities.find((facility) => facility._id === form.facility);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, numberOfPeople: Number(form.numberOfPeople) };
    if (!data.purpose) delete data.purpose; // "none" chosen
    if (!isEdit) delete data.status; // new bookings always start as Pending
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="form-section">Customer</h3>

      <div className="form-field">
        <label htmlFor="customerName">Full name *</label>
        <input
          id="customerName"
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          minLength={2}
          maxLength={100}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="contactNumber">Contact number *</label>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            placeholder="09171234567"
            pattern="09[0-9]{9}"
            title="11 digits starting with 09, for example 09171234567"
            value={form.contactNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <h3 className="form-section">Booking</h3>

      <div className="form-field">
        <label htmlFor="facility">Facility *</label>
        <select
          id="facility"
          name="facility"
          value={form.facility}
          onChange={handleChange}
          required
        >
          <option value="">Select a facility</option>
          {bookableFacilities.map((facility) => (
            <option key={facility._id} value={facility._id}>
              {facility.name} ({facility.type}, up to {facility.capacity} people)
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="bookingDate">Date *</label>
        <input
          id="bookingDate"
          name="bookingDate"
          type="date"
          min={isEdit ? undefined : todayInputValue()}
          value={form.bookingDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="startTime">Start time *</label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="endTime">End time *</label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="numberOfPeople">Number of people *</label>
          <input
            id="numberOfPeople"
            name="numberOfPeople"
            type="number"
            min="1"
            max={selectedFacility?.capacity}
            value={form.numberOfPeople}
            onChange={handleChange}
            required
          />
          {selectedFacility && (
            <span className="hint">Maximum {selectedFacility.capacity} for {selectedFacility.name}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="purpose">Purpose</label>
          <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange}>
            <option value="">None</option>
            {PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEdit && (
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows="3"
          maxLength={500}
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default BookingForm;