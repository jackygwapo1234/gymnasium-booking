import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBookings, getFacilities, deleteBooking, getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/format';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
const EMPTY_FILTERS = { q: '', facility: '', date: '', status: '' };

function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
 const location = useLocation();
 const [success, setSuccess] = useState(location.state?.message || '');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load the facilities once, for the facility filter dropdown
  useEffect(() => {
    getFacilities()
      .then((data) => setFacilities(data))
      .catch(() => setFacilities([]));
  }, []);

  // Load the bookings whenever a filter changes, or after a delete
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBookings(filters);
        setBookings(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, refreshKey]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await deleteBooking(deleting._id);
      setSuccess(`Booking ${deleting.bookingCode} was deleted.`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const hasFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div>
      <div className="page-header">
        <h1>Bookings</h1>
        <Link to="/bookings/new" className="btn btn-primary">
          + New Booking
        </Link>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="text"
          name="q"
          placeholder="Search by code, name or contact number..."
          value={filters.q}
          onChange={handleFilterChange}
        />

        <select name="facility" value={filters.facility} onChange={handleFilterChange}>
          <option value="">All facilities</option>
          {facilities.map((facility) => (
            <option key={facility._id} value={facility._id}>
              {facility.name}
            </option>
          ))}
        </select>

        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />

        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button type="button" className="btn btn-secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear
          </button>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="empty">
          {hasFilters ? 'No bookings match your search.' : 'No bookings yet.'}
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Facility</th>
              <th>Date</th>
              <th>Time</th>
              <th>People</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking.bookingCode}</td>
                <td>
                  {booking.customerName}
                  <br />
                  <small>{booking.contactNumber}</small>
                </td>
                <td>{booking.facility?.name || 'Deleted facility'}</td>
                <td>{formatDate(booking.bookingDate)}</td>
                <td>
                  {booking.startTime} – {booking.endTime}
                </td>
                <td>{booking.numberOfPeople}</td>
                <td>
                  <span className={`badge badge-${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Link to={`/bookings/${booking._id}`} className="btn btn-secondary btn-small">
                      View
                    </Link>
                    <Link to={`/bookings/${booking._id}/edit`} className="btn btn-secondary btn-small">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => setDeleting(booking)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete booking?"
          message={`Delete booking ${deleting.bookingCode} for ${deleting.customerName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={saving}
        />
      )}
    </div>
  );
}

export default BookingsList;