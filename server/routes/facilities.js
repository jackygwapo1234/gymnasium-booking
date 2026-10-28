const express = require('express');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');

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
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A facility with that name already exists' });
  }
  res.status(500).json({ message: 'Server error', error: err.message });
};

// ==================== Routes ====================

// 1. GET /api/facilities?q=court
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.query.q) {
      const pattern = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ name: pattern }, { type: pattern }];
    }

    const facilities = await Facility.find(filter).sort({ name: 1 });
    res.json(facilities);
  } catch (err) {
    handleError(res, err);
  }
});

// 2. GET /api/facilities/:id
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (err) {
    handleError(res, err);
  }
});

// 3. POST /api/facilities
router.post('/', async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (err) {
    handleError(res, err);
  }
});

// 4. PUT /api/facilities/:id
router.put('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json(facility);
  } catch (err) {
    handleError(res, err);
  }
});

// 5. DELETE /api/facilities/:id
router.delete('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Today in the Philippines, as midnight
    const today = new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }));

    // Don't delete a facility that still has upcoming bookings
    const upcomingCount = await Booking.countDocuments({
      facility: facility._id,
      bookingDate: { $gte: today },
      status: { $ne: 'Cancelled' },
    });

    if (upcomingCount > 0) {
      return res.status(409).json({
        message: `Cannot delete ${facility.name}: it has ${upcomingCount} upcoming booking(s). Cancel or delete them first, or mark the facility as unavailable.`,
      });
    }

    await facility.deleteOne();
    res.json({ message: 'Facility deleted', id: facility._id });
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;