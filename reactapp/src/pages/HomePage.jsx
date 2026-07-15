import { Link } from "react-router-dom";

import heroImage from "../assets/hero.png";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { isAuthenticated, user } = useAuth();

  const dashboardPath =
    user?.role === "ADMIN"
      ? "/admin/dashboard"
      : user?.role === "OWNER"
        ? "/owner/dashboard"
        : "/customer/dashboard";

  const stats = [
    ["12k+", "Reservations monthly"],
    ["98%", "Table fill rate"],
    ["24/7", "Live availability"],
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/85 px-5 py-8 text-white shadow-[0_24px_90px_rgba(15,23,42,0.35)] sm:px-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-16 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/8 to-transparent" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 shadow-lg shadow-amber-400/10">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Secure reservations, cleaner operations
          </span>

          <div className="max-w-2xl space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl lg:text-[4.6rem] lg:leading-[0.96]">
              Reserve, manage, and run restaurants from one place.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              A modern restaurant reservation workspace for customers, owners, and admins.
              Search restaurants, manage venues, and keep operations under control with role-based access.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to={dashboardPath}
                className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/25"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/25"
                >
                  Create account
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Log in
                </Link>
              </>
            )}
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            {stats.map(([value, label]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-amber-300/30 hover:bg-white/8"
              >
                <strong className="block text-2xl font-semibold text-white">
                  {value}
                </strong>
                <span className="mt-1 block text-sm text-slate-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-6 hidden h-24 w-24 rounded-[1.75rem] border border-amber-300/20 bg-amber-300/10 p-3 shadow-xl shadow-amber-400/10 lg:block">
            <img
              src={heroImage}
              alt=""
              className="h-full w-full object-contain"
              aria-hidden="true"
            />
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.14),_transparent_28%)]" />

            <div className="relative grid gap-4 sm:grid-cols-2">
              <article className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/8">
                <p className="text-sm text-slate-400">Customers</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Discover and book
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Find venues, review hours, and plan your next reservation.
                </p>
              </article>

              <article className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white/8">
                <p className="text-sm text-slate-400">Owners</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Manage venues
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Create restaurants, configure tables, and keep venue data current.
                </p>
              </article>

              <article className="sm:col-span-2 rounded-[1.5rem] border border-amber-400/20 bg-gradient-to-r from-slate-950/85 to-slate-800/80 p-5 backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-amber-300/35">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm text-amber-200/80">Admins</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      Platform control
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      Oversee users and restaurants with stricter access controls, cleaner workflows, and faster operations.
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Live now
                    </span>
                    <strong className="text-lg text-white">
                      Reservations, owners, and admin tools
                    </strong>
                  </div>
                </div>
              </article>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-amber-400/10" />
              <img
                src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1400&q=80"
                alt="Modern restaurant dining room"
                className="h-64 w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
