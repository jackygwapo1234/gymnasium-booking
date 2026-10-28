const Booking = require('../models/Booking');

const TIMEZONE = 'Asia/Manila';
const OPEN_TIME = process.env.OPEN_TIME || '06:00';
const CLOSE_TIME = process.env.CLOSE_TIME || '22:00';
const SLOT_MINUTES = 60;

// "14:30" → 870 minutes after midnight
const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 870 → "14:30"
const toTime = (totalMinutes) =>
  `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;

// The current date and time in the Philippines
const nowInManila = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-CA', { timeZone: TIMEZONE }), // "2026-10-26"
    time: now.toLocaleTimeString('en-GB', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }), // "14:05"
  };
};

// Builds the hourly time slots for one facility on one date
const getAvailability = async (facility, date) => {
  const bookings = await Booking.find({
    facility: facility._id,
    bookingDate: new Date(date),
    status: { $ne: 'Cancelled' },
  });

  // Slots that already started are "past"
  const now = nowInManila();
  let pastUntil = -1;
  if (date < now.date) pastUntil = Infinity;
  else if (date === now.date) pastUntil = toMinutes(now.time);

  const slots = [];
  for (
    let start = toMinutes(OPEN_TIME);
    start + SLOT_MINUTES <= toMinutes(CLOSE_TIME);
    start += SLOT_MINUTES
  ) {
    const end = start + SLOT_MINUTES;
    const isBooked = bookings.some(
      (booking) => toMinutes(booking.startTime) < end && toMinutes(booking.endTime) > start
    );

    let status = 'free';
    if (start < pastUntil) status = 'past';
    else if (isBooked) status = 'booked';

    slots.push({ start: toTime(start), end: toTime(end), status });
  }

  // Join free slots that touch: 06:00–07:00 + 07:00–08:00 → 06:00–08:00
  const freeRanges = [];
  for (const slot of slots) {
    if (slot.status !== 'free') continue;
    const last = freeRanges[freeRanges.length - 1];
    if (last && last.end === slot.start) last.end = slot.end;
    else freeRanges.push({ start: slot.start, end: slot.end });
  }

  return {
    facility: {
      _id: facility._id,
      name: facility.name,
      type: facility.type,
      capacity: facility.capacity,
    },
    date,
    openTime: OPEN_TIME,
    closeTime: CLOSE_TIME,
    slots,
    freeRanges,
    freeCount: slots.filter((slot) => slot.status === 'free').length,
  };
};

module.exports = { OPEN_TIME, CLOSE_TIME, toMinutes, toTime, nowInManila, getAvailability };