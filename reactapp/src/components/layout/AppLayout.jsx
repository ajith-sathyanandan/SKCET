import { NavLink, Outlet } from "react-router";

function AppLayout() {
  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Restaurant Table Reservation</h1>
          <p>Find restaurants and reserve tables easily.</p>
        </div>

        <nav className="app-navigation">
          <NavLink to="/" className={getLinkClass}>
            Home
          </NavLink>
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
