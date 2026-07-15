import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { restaurantService } from "../services/restaurantService";

const emptyFilters = {
  search: "",
  cuisine: "",
  location: "",
};

function formatTime(value) {
  return value ? value.slice(0, 5) : "";
}

function CustomerDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(emptyFilters);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRestaurantDetails = useCallback(async (restaurantId) => {
    try {
      setDetailsLoading(true);
      const response = await restaurantService.getById(restaurantId);
      setSelectedRestaurant(response);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to load restaurant details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await restaurantService.discover(filters);
      const loadedRestaurants = Array.isArray(response) ? response : [];
      setRestaurants(loadedRestaurants);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to load restaurants.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!selectedRestaurant && restaurants.length > 0) {
      loadRestaurantDetails(restaurants[0].id);
    }
  }, [loadRestaurantDetails, restaurants, selectedRestaurant]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const selectRestaurant = async (restaurant) => {
    if (!restaurant) {
      return;
    }

    await loadRestaurantDetails(restaurant.id);
  };

  const summary = useMemo(
    () => ({
      restaurants: restaurants.length,
      cuisines: new Set(restaurants.map((restaurant) => restaurant.cuisine)).size,
      active: selectedRestaurant ? 1 : 0,
    }),
    [restaurants, selectedRestaurant],
  );

  const copyAddress = async () => {
    if (!selectedRestaurant?.address) {
      return;
    }

    await navigator.clipboard.writeText(selectedRestaurant.address);
  };

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
              Customer discovery
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Find a place worth booking
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Browse restaurants, narrow by cuisine or location, and open a detailed view with table capacity and service hours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Restaurants" value={summary.restaurants} />
            <StatCard label="Cuisines" value={summary.cuisines} />
            <StatCard label="Selected" value={summary.active} />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Search
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Filter restaurants
                </h2>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="search">
                  Search
                </label>
                <input
                  id="search"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Restaurant name or keyword"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="cuisine">
                    Cuisine
                  </label>
                  <input
                    id="cuisine"
                    name="cuisine"
                    value={filters.cuisine}
                    onChange={handleFilterChange}
                    placeholder="Indian"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="City or area"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Results
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Available restaurants
                </h2>
              </div>
              <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                {restaurants.length}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Loading restaurants...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No restaurants match the current filters.
              </div>
            ) : (
              <div className="grid gap-4">
                {restaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => selectRestaurant(restaurant)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      String(selectedRestaurant?.id) === String(restaurant.id)
                        ? "border-amber-300 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-950">{restaurant.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{restaurant.cuisine}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        Open
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">{restaurant.address}</p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1 font-medium">
                        {formatTime(restaurant.openingTime)} - {formatTime(restaurant.closingTime)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 font-medium">
                        Owner {restaurant.ownerName}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Selected venue
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedRestaurant?.name ?? "Choose a restaurant"}
              </h2>
            </div>
            {selectedRestaurant && (
              <Link
                to={`/restaurants/${selectedRestaurant.id}`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Open page
              </Link>
            )}
          </div>

          {detailsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Loading details...
            </div>
          ) : selectedRestaurant ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-300">{selectedRestaurant.cuisine}</p>
                    <h3 className="mt-1 text-2xl font-semibold">{selectedRestaurant.name}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                    {selectedRestaurant.totalTables} tables
                  </span>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
                  {selectedRestaurant.address}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MiniStat label="Owner" value={selectedRestaurant.ownerName} />
                <MiniStat
                  label="Capacity"
                  value={selectedRestaurant.totalCapacity ?? 0}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Service hours
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      Operating window
                    </h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {formatTime(selectedRestaurant.openingTime)} - {formatTime(selectedRestaurant.closingTime)}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Copy address
                  </button>
                  <Link
                    to="/profile"
                    className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Update profile
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Tables
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      Capacity breakdown
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                    {selectedRestaurant.tables?.length ?? 0}
                  </span>
                </div>

                {selectedRestaurant.tables?.length ? (
                  <div className="grid gap-3">
                    {selectedRestaurant.tables.map((table) => (
                      <div
                        key={table.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">Table {table.tableNumber}</p>
                          <p className="text-sm text-slate-500">Seats {table.capacity}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                          Ready
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    No table data is available for this restaurant yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Select a restaurant to see details and table inventory.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Account
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Signed in as {user?.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Edit profile
            </Link>
            <Link
              to="/restaurants"
              className="rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Browse full catalog
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="min-w-[120px] rounded-3xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-amber-300">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default CustomerDashboard;
