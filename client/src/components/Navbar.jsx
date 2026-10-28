import { Link, NavLink } from 'react-router-dom';

// A small line icon; the shapes are passed in as children
const Icon = ({ children }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

function Navbar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="brand-mark">GB</span>
        <span className="brand-text">
          Gym Booking
          <small>Gymnasium scheduler</small>
        </span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end>
          <Icon>
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </Icon>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/bookings" end>
          <Icon>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </Icon>
          <span>Bookings</span>
        </NavLink>

        <NavLink to="/availability">
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </Icon>
          <span>Availability</span>
        </NavLink>

        <NavLink to="/facilities">
          <Icon>
            <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
          </Icon>
          <span>Facilities</span>
        </NavLink>
      </nav>

      <NavLink to="/bookings/new" className="btn btn-primary nav-cta">
        <Icon>
          <path d="M12 5v14M5 12h14" />
        </Icon>
        <span>New Booking</span>
      </NavLink>
    </aside>
  );
}

export default Navbar;