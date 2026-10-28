import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getBooking, updateBooking, getErrorMessage } from '../api/client';
import BookingForm from '../components/BookingForm';

function EditBooking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the booking to fill in the form
  useEffect(() => {
    getBooking(id)
      .then((data) => setBooking(data))
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateBooking(id, data);
      navigate('/bookings', {
        state: { message: `Booking ${updated.bookingCode} was updated.` },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (loading) return <p>Loading booking...</p>;

  if (loadError) {
    return (
      <div className="form-page">
        <div className="alert alert-error">{loadError}</div>
        <Link to="/bookings" className="back-link">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="form-page">
      <Link to="/bookings" className="back-link">
        ← Back to bookings
      </Link>
      <h1>Edit Booking {booking.bookingCode}</h1>
      <div className="card">
        <BookingForm
          initialData={booking}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/bookings')}
          saving={saving}
          error={error}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}

export default EditBooking;