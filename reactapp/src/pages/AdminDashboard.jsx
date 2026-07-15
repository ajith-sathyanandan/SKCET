import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const emptyForm = {
  ownerId: "",
  name: "",
  address: "",
  cuisine: "",
  openingTime: "",
  closingTime: "",
};

function formatTime(value) {
  return value ? value.slice(0, 5) : "";
}

function AdminDashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const owners = useMemo(
    () => users.filter((account) => account.role === "OWNER"),
    [users],
  );

  const summary = useMemo(
    () => ({
      restaurants: restaurants.length,
      owners: owners.length,
      users: users.length,
      admins: users.filter((account) => account.role === "ADMIN").length,
    }),
    [owners.length, restaurants.length, users],
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [restaurantsResponse, usersResponse] = await Promise.all([
        api.get("/api/restaurants"),
        api.get("/api/admin/users"),
      ]);

      setRestaurants(restaurantsResponse.data ?? []);
      setUsers(usersResponse.data ?? []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to load admin data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.address.trim() || !form.cuisine.trim()) {
      setError("Fill in the restaurant name, address, and cuisine.");
      return;
    }

    if (!form.openingTime || !form.closingTime) {
      setError("Opening and closing time are required.");
      return;
    }

    if (form.closingTime <= form.openingTime) {
      setError("Closing time must be after opening time.");
      return;
    }

    if (!form.ownerId) {
      setError("Select an owner for the restaurant.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/api/restaurants", {
        ownerId: Number(form.ownerId),
        name: form.name.trim(),
        address: form.address.trim(),
        cuisine: form.cuisine.trim(),
        openingTime: `${form.openingTime}:00`,
        closingTime: `${form.closingTime}:00`,
      });

      setSuccess("Restaurant created successfully.");
      resetForm();
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to create restaurant.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (restaurant) => {
    const confirmed = window.confirm(
      `Delete "${restaurant.name}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(restaurant.id);
      setError("");
      setSuccess("");

      await api.delete(`/api/restaurants/${restaurant.id}`);
      setSuccess("Restaurant deleted successfully.");
      await loadData();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to delete restaurant.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
              Admin console
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Platform overview
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Control restaurants, onboard owners, and keep the platform tidy from one central workspace.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Signed in as {user?.name ?? "admin"}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Restaurants" value={summary.restaurants} />
            <StatCard label="Owners" value={summary.owners} />
            <StatCard label="Admins" value={summary.admins} />
            <StatCard label="Users" value={summary.users} />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50"
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              New restaurant
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Create a venue for an owner
            </h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="ownerId">
                Owner
              </label>
              <select
                id="ownerId"
                name="ownerId"
                value={form.ownerId}
                onChange={updateField}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
              >
                <option value="">Select an owner</option>
                {owners.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.email})
                  </option>
                ))}
              </select>
              {owners.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No owners exist yet. Register an owner account first.
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">
                  Restaurant name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Spice Garden"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="cuisine">
                  Cuisine
                </label>
                <input
                  id="cuisine"
                  name="cuisine"
                  value={form.cuisine}
                  onChange={updateField}
                  placeholder="Indian"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={updateField}
                placeholder="Full restaurant address"
                rows="3"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="openingTime">
                  Opening time
                </label>
                <input
                  id="openingTime"
                  name="openingTime"
                  type="time"
                  value={form.openingTime}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="closingTime">
                  Closing time
                </label>
                <input
                  id="closingTime"
                  name="closingTime"
                  type="time"
                  value={form.closingTime}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create restaurant"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                System users
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Accounts and access
              </h2>
            </div>
            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
              {owners.length} owner accounts
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Loading users...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{account.name}</td>
                      <td className="px-4 py-3 text-slate-600">{account.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {account.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Managed venues
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Restaurants and controls
            </h2>
          </div>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            {restaurants.length} total
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Loading restaurants...
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No restaurants are available yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {restaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">{restaurant.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{restaurant.cuisine}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    ID {restaurant.id}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {restaurant.address}
                </p>

                <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Owner</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{restaurant.ownerName}</dd>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Hours</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(restaurant)}
                    disabled={deletingId === restaurant.id}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === restaurant.id ? "Deleting..." : "Delete"}
                  </button>
                  <a
                    href={`/restaurants/${restaurant.id}`}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    View details
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="min-w-[140px] rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-left backdrop-blur">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-amber-300">{value}</p>
    </div>
  );
}

export default AdminDashboard;
