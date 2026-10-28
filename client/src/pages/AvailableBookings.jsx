import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacilities, getAvailability, getErrorMessage } from '../api/client';
import SlotGrid from '../components/SlotGrid';
import { formatDate, todayInputValue } from '../utils/format';

function AvailableBookings() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load the bookable facilities once, and select the first one
  useEffect(() => {
    getFacilities()
      .then((data) => {
        const bookable = data.filter((facility) => facility.isAvailable);
        setFacilities(bookable);
        if (bookable.length > 0) setFacilityId(bookable[0]._id);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Load the time slots whenever the facility or date changes
  useEffect(() => {
    if (!facilityId || !date) return undefined;

    let ignore = false;
    setLoading(true);
    setError('');

    getAvailability(facilityId, date)
      .then((data) => {
        if (!ignore) setAvailability(data);
      })
      .catch((err) => {
        if (!ignore) {
          setAvailability(null);
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [facilityId, date]);

  // Clicking a free slot opens New Booking with it already filled in
  const handlePick = (slot) => {
    navigate('/bookings/new', {
      state: {
        prefill: {
          facility: facilityId,
          bookingDate: date,
          startTime: slot.start,
          endTime: slot.end,
        },
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Available Bookings</h1>
          <p className="subtitle">Pick a facility and a date, then click a free time slot to book it.</p>
        </div>
      </div>

      <div className="toolbar">
        <select
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          aria-label="Facility"
        >
          {facilities.length === 0 && <option value="">No facilities available</option>}
          {facilities.map((facility) => (
            <option key={facility._id} value={facility._id}>
              {facility.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          min={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && !availability && <p>Loading time slots...</p>}

      {availability && (
        <div className="card">
          <div className="availability-summary">
            <div>
              <h2>
                {availability.facility.name} · {formatDate(availability.date)}
              </h2>
              <p>
                {availability.freeCount} of {availability.slots.length} hours available · Open{' '}
                {availability.openTime}–{availability.closeTime} · Up to {availability.facility.capacity}{' '}
                people
              </p>
            </div>
            <div className="legend">
              <span className="legend-free">Available</span>
              <span className="legend-booked">Booked</span>
              <span className="legend-past">Past</span>
            </div>
          </div>
          <SlotGrid slots={availability.slots} onPick={handlePick} />
        </div>
      )}
    </div>
  );
}

export default AvailableBookings;