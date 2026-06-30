import { NavLink, Outlet, useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";

function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const canAccessOwner =
    user?.role === "OWNER" || user?.role === "ADMIN";

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand-link">
          <span className="brand-mark">R</span>
          <span>
            <strong>Restaurant Reservation</strong>
            <small>Book tables without waiting</small>
          </span>
        </NavLink>

        <nav
          className="app-navigation"
          aria-label="Main navigation"
        >
          <NavLink to="/" className={getLinkClass}>
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={getLinkClass}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/restaurants"
                className={getLinkClass}
              >
                Restaurants
              </NavLink>

              {canAccessOwner && (
                <NavLink
                  to="/owner"
                  className={getLinkClass}
                >
                  Owner
                </NavLink>
              )}

              {user?.role === "ADMIN" && (
                <NavLink
                  to="/admin"
                  className={getLinkClass}
                >
                  Admin
                </NavLink>
              )}

              <span className="role-badge">
                {user?.role}
              </span>

              <button
                type="button"
                className="nav-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={getLinkClass}
              >
                Log in
              </NavLink>

              <NavLink
                to="/register"
                className="nav-link nav-link-primary"
              >
                Register
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        Restaurant Table Reservation System
      </footer>
    </div>
  );
}

export default AppLayout;
