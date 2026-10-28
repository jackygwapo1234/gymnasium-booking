import { useEffect, useState } from 'react';
import {
  getFacilities,
  createFacility, // NEW
  updateFacility, // NEW
  deleteFacility, // NEW
  getErrorMessage,
} from '../api/client';
import Modal from '../components/Modal'; // NEW
import ConfirmDialog from '../components/ConfirmDialog'; // NEW
import FacilityForm from '../components/FacilityForm'; // NEW

function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // NEW

  const [editing, setEditing] = useState(null); // NEW: null = closed, {} = adding, a facility = editing
  const [deleting, setDeleting] = useState(null); // NEW: the facility waiting for confirmation
  const [saving, setSaving] = useState(false); // NEW
  const [formError, setFormError] = useState(''); // NEW
  const [success, setSuccess] = useState(''); // NEW

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getFacilities(search);
        setFacilities(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, refreshKey]); // NEW: refreshKey added

  // NEW: open the form empty, for adding
  const openAdd = () => {
    setFormError('');
    setSuccess('');
    setEditing({});
  };

  // NEW: open the form filled in, for editing
  const openEdit = (facility) => {
    setFormError('');
    setSuccess('');
    setEditing(facility);
  };

  // NEW: save the form (add or update)
  const handleSave = async (data) => {
    setSaving(true);
    setFormError('');
    try {
      if (editing._id) {
        await updateFacility(editing._id, data);
        setSuccess(`${data.name} was updated.`);
      } else {
        await createFacility(data);
        setSuccess(`${data.name} was added.`);
      }
      setEditing(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // NEW: delete after the user confirms
  const handleDelete = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await deleteFacility(deleting._id);
      setSuccess(`${deleting.name} was deleted.`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Facilities</h1>
        {/* NEW */}
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          + Add Facility
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="Search by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {success && <div className="alert alert-success">{success}</div>} {/* NEW */}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : facilities.length === 0 ? (
        <p className="empty">No facilities found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Rate / hour</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility._id}>
                <td>{facility.name}</td>
                <td>{facility.type}</td>
                <td>{facility.capacity}</td>
                <td>₱{facility.hourlyRate}</td>
                <td>
                  <span className={`badge ${facility.isAvailable ? 'badge-yes' : 'badge-no'}`}>
                    {facility.isAvailable ? 'Yes' : 'No'}
                  </span>
                </td>
                {/* NEW */}
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => openEdit(facility)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => setDeleting(facility)}
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

      {/* NEW: the add/edit form */}
      {editing && (
        <Modal
          title={editing._id ? 'Edit Facility' : 'Add Facility'}
          onClose={() => setEditing(null)}
        >
          <FacilityForm
            initialData={editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
            error={formError}
          />
        </Modal>
      )}

      {/* NEW: the delete confirmation */}
      {deleting && (
        <ConfirmDialog
          title="Delete facility?"
          message={`Are you sure you want to delete ${deleting.name}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={saving}
        />
      )}
    </div>
  );
}

export default Facilities;