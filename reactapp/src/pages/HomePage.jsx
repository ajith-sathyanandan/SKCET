import { Link } from "react-router";

import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="hero-section">
      <span className="hero-badge">Secure reservations</span>

      <h2>Reserve your restaurant table without the waiting.</h2>

      <p>
        Create an account, log in securely, search restaurants and
        manage bookings through one responsive application.
      </p>

      <div className="hero-actions">
        {isAuthenticated ? (
          <Link to="/dashboard" className="primary-button">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link to="/register" className="primary-button">
              Create account
            </Link>
            <Link to="/login" className="secondary-button">
              Log in
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default HomePage;
