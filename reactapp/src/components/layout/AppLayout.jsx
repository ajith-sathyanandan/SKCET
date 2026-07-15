import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function getDashboardPath(role) {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  if (role === "OWNER") {
    return "/owner/dashboard";
  }

  return "/customer/dashboard";
}

function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    [
      "rounded-full px-4 py-2 text-sm font-medium transition",
      isActive
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-300 hover:bg-white/10 hover:text-white",
    ].join(" ");

  const dashboardPath = getDashboardPath(user?.role);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(99,102,241,0.14),_transparent_25%),linear-gradient(180deg,_#050816_0%,_#0f172a_42%,_#f8fafc_42%,_#f8fafc_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-[-8rem] h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-28 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-3 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400 text-lg font-black text-slate-950 shadow-lg shadow-amber-400/25">
              R
            </span>
            <span className="leading-tight">
              <strong className="block text-base tracking-wide">Restaurant Reservation</strong>
              <small className="block text-xs text-slate-400">Fast booking and restaurant management</small>
            </span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Main navigation">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to={dashboardPath} className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/restaurants" className={linkClass}>
                  Restaurants
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>

                {user?.role === "OWNER" && (
                  <NavLink to="/owner/dashboard" className={linkClass}>
                    Owner tools
                  </NavLink>
                )}

                {user?.role === "ADMIN" && (
                  <NavLink to="/admin/dashboard" className={linkClass}>
                    Admin tools
                  </NavLink>
                )}

                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                  {user?.role}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Create account
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-slate-950/85 px-4 py-5 text-center text-sm text-slate-400 backdrop-blur md:px-6 lg:px-8">
        Restaurant Table Reservation System
      </footer>
    </div>
  );
}

export default AppLayout;
