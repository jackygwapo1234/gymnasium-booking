import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookingsList from './pages/BookingsList';
import AddBooking from './pages/AddBooking';
import BookingDetails from './pages/BookingDetails';
import EditBooking from './pages/EditBooking';
import Facilities from './pages/Facilities';
import NotFound from './pages/NotFound';
import AvailableBookings from './pages/AvailableBookings';

function App() {
   return (
    <div className="app-layout">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/bookings/new" element={<AddBooking />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/bookings/:id/edit" element={<EditBooking />} />
          <Route path="/facilities" element={<Facilities />} />
           <Route path="/availability" element={<AvailableBookings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;