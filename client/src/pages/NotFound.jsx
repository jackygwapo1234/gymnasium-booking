import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>That address doesn't exist.</p>
      <Link to="/">Go back home</Link>
    </div>
  );
}

export default NotFound;