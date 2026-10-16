
require("dotenv").config();

const mongoose = require("mongoose");
const Booking = require("./models/Booking");

const testBookings = [
  {
    customerName: "Juan Dela Cruz",
    contactNumber: "09171234567",
    eventName: "Basketball Practice",
    bookingDate: new Date("2026-10-20T00:00:00.000Z"),
    startTime: "09:00",
    endTime: "11:00",
    participants: 20,
    purpose: "Team training",
    status: "Confirmed",
  },
  {
    customerName: "Maria Santos",
    contactNumber: "09981234567",
    eventName: "Volleyball Tournament",
    bookingDate: new Date("2026-10-21T00:00:00.000Z"),
    startTime: "13:00",
    endTime: "16:00",
    participants: 30,
    purpose: "School sports event",
    status: "Pending",
  },
  {
    customerName: "Pedro Reyes",
    contactNumber: "09182345678",
    eventName: "Badminton Practice",
    bookingDate: new Date("2026-10-22T00:00:00.000Z"),
    startTime: "08:00",
    endTime: "10:00",
    participants: 12,
    purpose: "Club practice",
    status: "Confirmed",
  },
  {
    customerName: "Ana Garcia",
    contactNumber: "09273456789",
    eventName: "School Foundation Day",
    bookingDate: new Date("2026-10-23T00:00:00.000Z"),
    startTime: "08:00",
    endTime: "17:00",
    participants: 150,
    purpose: "Annual school celebration",
    status: "Pending",
  },
  {
    customerName: "Mark Lopez",
    contactNumber: "09384567890",
    eventName: "Futsal Training",
    bookingDate: new Date("2026-10-24T00:00:00.000Z"),
    startTime: "15:00",
    endTime: "17:00",
    participants: 18,
    purpose: "Sports team training",
    status: "Cancelled",
  },
];

async function seedBookings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const inserted = await Booking.insertMany(testBookings);

    console.log(`Successfully inserted ${inserted.length} test bookings.`);
  } catch (error) {
    console.error("Error inserting bookings:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedBookings();
