import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookings, getFacilities, getErrorMessage } from '../api/client';
import { formatDate, todayInputValue } from '../utils/format';

// One number card at the top
const StatCard = ({ label, value, note }) => (
  <div className="stat-card">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
    <span className="stat-note">{note}</span>
  </div>
);

// One booking in a list, linking to its details
const BookingItem = ({ booking, showDate = false }) => (
  <li>
    <Link to={`/bookings/${booking._id}`} className="booking-item">
      <div className="booking-when">
        {showDate && <span className="booking-date">{formatDate(booking.bookingDate)}</span>}
        <span>
          {booking.startTime} – {booking.endTime}
        </span>
      </div>
      <div className="booking-who">
        <strong>{booking.customerName}</strong>
        <span>
          {booking.facility?.name || 'Deleted facility'} · {booking.numberOfPeople} people
        </span>
      </div>
      <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
    </Link>
  </li>
);

function Home() {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Load bookings and facilities at the same time
  useEffect(() => {
    Promise.all([getBookings(), getFacilities()])
      .then(([bookingData, facilityData]) => {
        setBookings(bookingData);
        setFacilities(facilityData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;

  // Sort the bookings into groups
  const today = todayInputValue();
  const dayOf = (booking) => booking.bookingDate.slice(0, 10);
  const active = bookings.filter((booking) => booking.status !== 'Cancelled');

  const todaysBookings = active.filter((booking) => dayOf(booking) === today);
  const upcomingBookings = active.filter((booking) => dayOf(booking) > today);
  const pendingBookings = active.filter(
    (booking) => booking.status === 'Pending' && dayOf(booking) >= today
  );
  const availableFacilities = facilities.filter((facility) => facility.isAvailable);

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">{todayLabel}</p>
        </div>
        <Link to="/bookings/new" className="btn btn-primary">
          + New Booking
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats">
        <StatCard label="Today" value={todaysBookings.length} note="bookings today" />
        <StatCard label="Upcoming" value={upcomingBookings.length} note="after today" />
        <StatCard label="Pending" value={pendingBookings.length} note="waiting for confirmation" />
        <StatCard
          label="Facilities"
          value={`${availableFacilities.length} / ${facilities.length}`}
          note="available for booking"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-header">
            <h2>Today's schedule</h2>
          </div>
          {todaysBookings.length === 0 ? (
            <p className="muted">No bookings today.</p>
          ) : (
            <ul className="booking-list">
              {todaysBookings.map((booking) => (
                <BookingItem key={booking._id} booking={booking} />
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Coming up</h2>
            <Link to="/bookings">View all</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="muted">No upcoming bookings.</p>
          ) : (
            <ul className="booking-list">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <BookingItem key={booking._id} booking={booking} showDate />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;