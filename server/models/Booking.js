const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [/^09\d{9}$/, 'Contact number must be 11 digits starting with 09'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
      required: [true, 'Facility is required'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'],
    },
    numberOfPeople: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [1, 'Number of people must be at least 1'],
    },
    purpose: {
      type: String,
      enum: ['Training', 'Game', 'Event', 'Class', 'Other'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

bookingSchema.pre('validate', async function () {
  if (this.bookingCode) return;

    // Today's date in the Philippines, like "20261028"
  const datePart = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
    .replaceAll('-', '');
  const prefix = `GB-${datePart}-`;

  // Today's date in the Philippines as "2026-10-28"
const todayString = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  // Take its last 3 digits as a number, or 0 if there's none yet today
  const lastNumber = lastBooking ? Number(lastBooking.bookingCode.slice(-3)) : 0;

  this.bookingCode = prefix + String(lastNumber + 1).padStart(3, '0');
});

bookingSchema.index({ facility: 1, bookingDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);