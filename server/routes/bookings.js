const express = require('express');
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const { getAvailability, OPEN_TIME, CLOSE_TIME } = require('../utils/availability');

const router = express.Router();

// ==================== Helpers ====================

// Makes user search text safe to use in a MongoDB search pattern
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Turns database errors into clear messages with the right status code
const handleError = (res, err) => {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID or value format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate booking code, please try again' });
  }
  res.status(500).json({ message: 'Server error', error: err.message });
};

// Turns a Date or a "2026-10-30..." string into "2026-10-30"
const toDateString = (value) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

// Today's date on this computer as "2026-10-26"
const todayString = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

// Returns null if everything is OK, or { status, message } describing the problem
const checkBookingRules = async (data, excludeId = null, checkPastDate = true) => {
  const { facility, bookingDate, startTime, endTime, numberOfPeople, status } = data;

  // If required fields are missing, let the schema report them instead
  if (!facility || !bookingDate || !startTime || !endTime) return null;

  // Rule 1: end time after start time
  if (endTime <= startTime) {
    return { status: 400, message: 'End time must be after start time' };
  }

  // Rule 1b: within opening hours
  if (startTime < OPEN_TIME || endTime > CLOSE_TIME) {
    return {
      status: 400,
      message: `Bookings must be between ${OPEN_TIME} and ${CLOSE_TIME}`,
    };
  }

  // Rule 2: no past dates
  const dateStr = toDateString(bookingDate);
  if (checkPastDate && dateStr < todayString()) {
    return { status: 400, message: 'Booking date cannot be in the past' };
  }

  // Rule 3: the facility exists, is available, and fits everyone
  const facilityDoc = await Facility.findById(facility);
  if (!facilityDoc) {
    return { status: 400, message: 'Selected facility does not exist' };
  }
  if (!facilityDoc.isAvailable) {
    return { status: 400, message: `${facilityDoc.name} is not available for booking` };
  }
  if (numberOfPeople > facilityDoc.capacity) {
    return {
      status: 400,
      message: `${facilityDoc.name} holds at most ${facilityDoc.capacity} people`,
    };
  }

  // A cancelled booking can't clash with anything
  if (status === 'Cancelled') return null;

  // Rule 4: no overlapping booking on the same facility and date
  const clash = await Booking.findOne({
    _id: { $ne: excludeId },
    facility,
    bookingDate: new Date(dateStr),
    status: { $ne: 'Cancelled' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });
  if (clash) {
    return {
      status: 409,
      message: `Time conflict with booking ${clash.bookingCode} (${clash.startTime}-${clash.endTime})`,
    };
  }

  return null;
};

// ==================== Routes ====================
// Order matters: fixed paths like /availability must come BEFORE /:id

// 1. GET /api/bookings?q=juan&facility=<id>&date=2026-10-30&status=Pending
router.get('/', async (req, res) => {
  try {
    const { q, facility, date, status } = req.query;
    const filter = {};

    if (q) {
      const pattern = new RegExp(escapeRegex(q), 'i');
      filter.$or = [
        { bookingCode: pattern },
        { customerName: pattern },
        { contactNumber: pattern },
      ];
    }
    if (facility) filter.facility = facility;
    if (date) filter.bookingDate = new Date(toDateString(date));
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('facility', 'name type capacity')
      .sort({ bookingDate: 1, startTime: 1 });

    res.json(bookings);
  } catch (err) {
    handleError(res, err);
  }
});

// 2. GET /api/bookings/availability?facility=<id>&date=2026-10-30
router.get('/availability', async (req, res) => {
  try {
    const { facility, date } = req.query;
    if (!facility || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return res.status(400).json({ message: 'Please choose a facility and a date.' });
    }

    const facilityDoc = await Facility.findById(facility);
    if (!facilityDoc) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    if (!facilityDoc.isAvailable) {
      return res.status(400).json({ message: `${facilityDoc.name} is not available for booking` });
    }

    res.json(await getAvailability(facilityDoc, date));
  } catch (err) {
    handleError(res, err);
  }
});

// 3. GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'facility',
      'name type capacity hourlyRate'
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    handleError(res, err);
  }
});

// 4. POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    delete data.bookingCode; // always generated by the server
    if (data.bookingDate) data.bookingDate = toDateString(data.bookingDate);

    const problem = await checkBookingRules(data);
    if (problem) {
      return res.status(problem.status).json({ message: problem.message });
    }

    const booking = await Booking.create(data);
    await booking.populate('facility', 'name type capacity');
    res.status(201).json(booking);
  } catch (err) {
    handleError(res, err);
  }
});

// 5. PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const changes = { ...req.body };
    delete changes.bookingCode;
    delete changes._id;
    if (changes.bookingDate) changes.bookingDate = toDateString(changes.bookingDate);

    // The booking as it WOULD look after the edit
    const merged = { ...booking.toObject(), ...changes };

    // Only block past dates if the date is being changed
    const dateChanged = Boolean(
      changes.bookingDate && changes.bookingDate !== toDateString(booking.bookingDate)
    );

    const problem = await checkBookingRules(merged, booking._id, dateChanged);
    if (problem) {
      return res.status(problem.status).json({ message: problem.message });
    }

    booking.set(changes);
    await booking.save();
    await booking.populate('facility', 'name type capacity');
    res.json(booking);
  } catch (err) {
    handleError(res, err);
  }
});

// 6. DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted', id: booking._id });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;