import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBooking, deleteBooking, getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, formatDateTime } from '../utils/format';

// One label + value pair in the details list
const Detail = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children || '—'}</dd>
  </div>
);

// "14:30" → 870 (minutes after midnight)
const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 150 → "2 hr 30 min"
const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(' ');
};

const formatPeso = (amount) =>
  amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getBooking(id)
      .then((data) => setBooking(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBooking(id);
      navigate('/bookings', {
        state: { message: `Booking ${booking.bookingCode} was deleted.` },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <p>Loading booking...</p>;

  if (!booking) {
    return (
      <div className="form-page">
        <div className="alert alert-error">{error}</div>
        <Link to="/bookings" className="back-link">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const durationMinutes = toMinutes(booking.endTime) - toMinutes(booking.startTime);
  const hourlyRate = booking.facility?.hourlyRate ?? 0;
  const estimatedCost = (hourlyRate * durationMinutes) / 60;

  return (
    <div className="form-page">
      <Link to="/bookings" className="back-link">
        ← Back to bookings
      </Link>

      <div className="page-header">
        <div className="title-row">
          <h1>{booking.bookingCode}</h1>
          <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
        </div>
        <div className="actions">
          <Link to={`/bookings/${booking._id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h3 className="form-section">Customer</h3>
        <dl className="details-grid">
          <Detail label="Name">{booking.customerName}</Detail>
          <Detail label="Contact number">
            <a href={`tel:${booking.contactNumber}`}>{booking.contactNumber}</a>
          </Detail>
          <Detail label="Email">
            {booking.email && <a href={`mailto:${booking.email}`}>{booking.email}</a>}
          </Detail>
        </dl>

        <h3 className="form-section">Schedule</h3>
        <dl className="details-grid">
          <Detail label="Facility">
            {booking.facility
              ? `${booking.facility.name} (${booking.facility.type})`
              : 'Deleted facility'}
          </Detail>
          <Detail label="Date">{formatDate(booking.bookingDate)}</Detail>
          <Detail label="Time">
            {booking.startTime} – {booking.endTime}
          </Detail>
          <Detail label="Duration">{formatDuration(durationMinutes)}</Detail>
          <Detail label="People">
            {booking.numberOfPeople}
            {booking.facility && ` of ${booking.facility.capacity} max`}
          </Detail>
          <Detail label="Purpose">{booking.purpose}</Detail>
          <Detail label="Estimated cost">
            {hourlyRate > 0 ? `${formatPeso(estimatedCost)} (${formatPeso(hourlyRate)}/hour)` : 'Free'}
          </Detail>
        </dl>

        <h3 className="form-section">Notes</h3>
        <p className="notes">{booking.notes || 'No notes.'}</p>

        <h3 className="form-section">Record</h3>
        <dl className="details-grid">
          <Detail label="Created">{formatDateTime(booking.createdAt)}</Detail>
          <Detail label="Last updated">{formatDateTime(booking.updatedAt)}</Detail>
        </dl>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete booking?"
          message={`Delete booking ${booking.bookingCode} for ${booking.customerName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          busy={deleting}
        />
      )}
    </div>
  );
}

export default BookingDetails;