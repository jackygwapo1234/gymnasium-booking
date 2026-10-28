import { useState } from 'react';
import { createBooking, getErrorMessage } from '../api/client';
import BookingForm from '../components/BookingForm';
import AiAssistant from '../components/AiAssistant';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function AddBooking() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const [formData, setFormData] = useState(location.state?.prefill || {});
  const [formKey, setFormKey] = useState(0);

  // The AI found booking details: refill the form with them
  const handleAiFill = (booking) => {
    setFormData(booking);
    setFormKey((key) => key + 1);
    setError('');
  };

    // A time slot was picked from the AI's availability answer
  const handlePickSlot = (slot) => {
    setFormData((current) => ({ ...current, ...slot }));
    setFormKey((key) => key + 1);
    setError('');
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const booking = await createBooking(data);
      navigate('/bookings', {
        state: { message: `Booking ${booking.bookingCode} was created.` },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="form-page">
      <Link to="/bookings" className="back-link">
        ← Back to bookings
      </Link>
      <h1>New Booking</h1>

      <AiAssistant onFill={handleAiFill} />

      <div className="card">
        <BookingForm
          key={formKey}
          initialData={formData}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/bookings')}
          saving={saving}
          error={error}
          submitLabel="Create Booking"
        />
      </div>
    </div>
  );
}

export default AddBooking;