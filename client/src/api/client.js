import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Pulls the server's error message out of a failed request
   export const getErrorMessage = (err) => {
     const data = err.response?.data;
     if (data?.message) {
       return data.error ? `${data.message}: ${data.error}` : data.message;
     }
     return 'Could not reach the server. Is it running?';
   };

// ---------- Facilities ----------
export const getFacilities = (q = '') =>
  api.get('/facilities', { params: { q } }).then((res) => res.data);

export const createFacility = (data) =>
  api.post('/facilities', data).then((res) => res.data);

export const updateFacility = (id, data) =>
  api.put(`/facilities/${id}`, data).then((res) => res.data);

export const deleteFacility = (id) =>
  api.delete(`/facilities/${id}`).then((res) => res.data);

// ---------- Bookings ----------
export const getBookings = (filters = {}) =>
  api.get('/bookings', { params: filters }).then((res) => res.data);

export const getBooking = (id) =>
  api.get(`/bookings/${id}`).then((res) => res.data);

export const createBooking = (data) =>
  api.post('/bookings', data).then((res) => res.data);

export const updateBooking = (id, data) =>
  api.put(`/bookings/${id}`, data).then((res) => res.data);

export const deleteBooking = (id) =>
  api.delete(`/bookings/${id}`).then((res) => res.data);


export const getAvailability = (facility, date) =>
  api.get('/bookings/availability', { params: { facility, date } }).then((res) => res.data);

// ---------- AI ----------
export const askAssistant = (text) =>
  api.post('/ai/assistant', { text }).then((res) => res.data);