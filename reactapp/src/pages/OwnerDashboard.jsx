import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const emptyRestaurantForm = {
  ownerId: "",
  name: "",
  address: "",
  cuisine: "",
  openingTime: "",
  closingTime: "",
};

const emptyTableForm = {
  tableNumber: "",
  capacity: "",
};

function formatTime(value) {
  return value ? value.slice(0, 5) : "";
}

function restaurantToForm(restaurant) {
  if (!restaurant) {
    return emptyRestaurantForm;
  }

  return {
    ownerId: restaurant.ownerId ? String(restaurant.ownerId) : "",
    name: restaurant.name ?? "",
    address: restaurant.address ?? "",
    cuisine: restaurant.cuisine ?? "",
    openingTime: formatTime(restaurant.openingTime),
    closingTime: formatTime(restaurant.closingTime),
  };
}

function OwnerDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurantForm);
  const [tableForm, setTableForm] = useState(emptyTableForm);
  const [editingTableId, setEditingTableId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [savingTable, setSavingTable] = useState(false);
  const [deletingRestaurantId, setDeletingRestaurantId] = useState(null);
  const [deletingTableId, setDeletingTableId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const accessibleRestaurants = useMemo(() => {
    if (isAdmin) {
      return restaurants;
    }

    return restaurants.filter(
      (restaurant) => String(restaurant.ownerId) === String(user?.id),
    );
  }, [isAdmin, restaurants, user?.id]);

  const selectedRestaurant = useMemo(
    () =>
      accessibleRestaurants.find(
        (restaurant) => String(restaurant.id) === String(selectedRestaurantId),
      ) ?? null,
    [accessibleRestaurants, selectedRestaurantId],
  );

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [restaurantsResponse, usersResponse] = await Promise.all([
        api.get("/api/restaurants"),
        isAdmin ? api.get("/api/admin/users") : Promise.resolve({ data: [] }),
      ]);

      const loadedRestaurants = restaurantsResponse.data ?? [];
      setRestaurants(loadedRestaurants);
      setUsers(usersResponse.data ?? []);

      const firstVisibleRestaurant = loadedRestaurants.find(
        (restaurant) =>
          isAdmin || String(restaurant.ownerId) === String(user?.id),
      );

      if (firstVisibleRestaurant) {
        setSelectedRestaurantId(String(firstVisibleRestaurant.id));
        setRestaurantForm(restaurantToForm(firstVisibleRestaurant));
      } else {
        setSelectedRestaurantId("");
        setRestaurantForm(
          isAdmin
            ? { ...emptyRestaurantForm, ownerId: "" }
            : emptyRestaurantForm,
        );
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to load restaurant data.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  const loadTables = async (restaurantId) => {
    if (!restaurantId) {
      setTables([]);
      return;
    }

    try {
      setLoadingTables(true);
      const response = await api.get(`/api/restaurants/${restaurantId}/tables`);
      setTables(response.data ?? []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to load table data.",
      );
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadTables(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const updateRestaurantField = (event) => {
    const { name, value } = event.target;
    setRestaurantForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const updateTableField = (event) => {
    const { name, value } = event.target;
    setTableForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const selectRestaurant = (restaurantId) => {
    const nextRestaurant = accessibleRestaurants.find(
      (restaurant) => String(restaurant.id) === String(restaurantId),
    );

    if (!nextRestaurant) {
      return;
    }

    setSelectedRestaurantId(String(nextRestaurant.id));
    setRestaurantForm(restaurantToForm(nextRestaurant));
    setTableForm(emptyTableForm);
    setEditingTableId(null);
    setError("");
    setSuccess("");
  };

  const beginCreate = () => {
    setSelectedRestaurantId("");
    setRestaurantForm(
      isAdmin
        ? { ...emptyRestaurantForm, ownerId: "" }
        : emptyRestaurantForm,
    );
    setTableForm(emptyTableForm);
    setEditingTableId(null);
    setTables([]);
    setError("");
    setSuccess("");
  };

  const handleRestaurantSubmit = async (event) => {
    event.preventDefault();

    if (
      !restaurantForm.name.trim()
      || !restaurantForm.address.trim()
      || !restaurantForm.cuisine.trim()
      || !restaurantForm.openingTime
      || !restaurantForm.closingTime
    ) {
      setError("Complete all restaurant fields before saving.");
      return;
    }

    if (restaurantForm.closingTime <= restaurantForm.openingTime) {
      setError("Closing time must be after opening time.");
      return;
    }

    if (isAdmin && !selectedRestaurant && !restaurantForm.ownerId) {
      setError("Choose an owner before creating a restaurant.");
      return;
    }

    try {
      setSavingRestaurant(true);
      setError("");
      setSuccess("");

      const payload = {
        name: restaurantForm.name.trim(),
        address: restaurantForm.address.trim(),
        cuisine: restaurantForm.cuisine.trim(),
        openingTime: `${restaurantForm.openingTime}:00`,
        closingTime: `${restaurantForm.closingTime}:00`,
      };

      if (isAdmin && !selectedRestaurant) {
        payload.ownerId = Number(restaurantForm.ownerId);
      }

      const response = selectedRestaurant
        ? await api.put(`/api/restaurants/${selectedRestaurant.id}`, payload)
        : await api.post("/api/restaurants", payload);

      const savedRestaurant = response.data;
      setSuccess(
        selectedRestaurant
          ? "Restaurant updated successfully."
          : "Restaurant created successfully.",
      );

      await loadRestaurants();
      if (savedRestaurant?.id) {
        selectRestaurant(savedRestaurant.id);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to save restaurant.",
      );
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedRestaurant.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingRestaurantId(selectedRestaurant.id);
      setError("");
      setSuccess("");

      await api.delete(`/api/restaurants/${selectedRestaurant.id}`);
      setSuccess("Restaurant deleted successfully.");
      beginCreate();
      await loadRestaurants();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to delete restaurant.",
      );
    } finally {
      setDeletingRestaurantId(null);
    }
  };

  const clearTableForm = () => {
    setTableForm(emptyTableForm);
    setEditingTableId(null);
  };

  const handleTableSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRestaurant) {
      setError("Create or select a restaurant before managing tables.");
      return;
    }

    if (!tableForm.tableNumber || !tableForm.capacity) {
      setError("Table number and capacity are required.");
      return;
    }

    try {
      setSavingTable(true);
      setError("");
      setSuccess("");

      const payload = {
        tableNumber: Number(tableForm.tableNumber),
        capacity: Number(tableForm.capacity),
      };

      const response = editingTableId
        ? await api.put(
            `/api/restaurants/${selectedRestaurant.id}/tables/${editingTableId}`,
            payload,
          )
        : await api.post(
            `/api/restaurants/${selectedRestaurant.id}/tables`,
            payload,
          );

      setSuccess(
        editingTableId
          ? "Table updated successfully."
          : "Table added successfully.",
      );

      clearTableForm();
      setTables((current) => {
        const nextTable = response.data;
        if (!nextTable) {
          return current;
        }

        const exists = current.some((table) => String(table.id) === String(nextTable.id));
        if (exists) {
          return current.map((table) =>
            String(table.id) === String(nextTable.id) ? nextTable : table,
          );
        }

        return [...current, nextTable].sort((a, b) => a.tableNumber - b.tableNumber);
      });

      await loadTables(selectedRestaurant.id);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to save table.",
      );
    } finally {
      setSavingTable(false);
    }
  };

  const handleEditTable = (table) => {
    setEditingTableId(table.id);
    setTableForm({
      tableNumber: String(table.tableNumber ?? ""),
      capacity: String(table.capacity ?? ""),
    });
  };

  const handleDeleteTable = async (table) => {
    if (!selectedRestaurant) {
      return;
    }

    try {
      setDeletingTableId(table.id);
      setError("");
      setSuccess("");

      await api.delete(
        `/api/restaurants/${selectedRestaurant.id}/tables/${table.id}`,
      );

      setTables((current) =>
        current.filter((item) => String(item.id) !== String(table.id)),
      );
      setSuccess("Table deleted successfully.");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message
          ?? requestError.message
          ?? "Unable to delete table.",
      );
    } finally {
      setDeletingTableId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Owner workspace</p>
            <p className="mt-1 text-lg font-semibold">Loading restaurant management data...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              {isAdmin ? "Admin restaurant tools" : "Owner dashboard"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Restaurant management
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Create venues, edit operating hours, and manage table layouts from a single workspace.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-sm text-slate-300">Accessible restaurants</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-300">
              {accessibleRestaurants.length}
            </p>
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Restaurants
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Manage your venues
              </h2>
            </div>

            <button
              type="button"
              onClick={beginCreate}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              New restaurant
            </button>
          </div>

          {accessibleRestaurants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No restaurants are available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {accessibleRestaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => selectRestaurant(restaurant.id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                    String(selectedRestaurantId) === String(restaurant.id)
                      ? "border-amber-300 bg-amber-50 shadow-sm"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{restaurant.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{restaurant.cuisine}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      ID {restaurant.id}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{restaurant.address}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Details
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedRestaurant ? selectedRestaurant.name : "Create a restaurant"}
              </h2>
            </div>
            {selectedRestaurant && (
              <Link
                to={`/restaurants/${selectedRestaurant.id}`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View page
              </Link>
            )}
          </div>

          <form onSubmit={handleRestaurantSubmit} className="space-y-4">
            {isAdmin && !selectedRestaurant && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="ownerId">
                  Owner
                </label>
                <select
                  id="ownerId"
                  name="ownerId"
                  value={restaurantForm.ownerId}
                  onChange={updateRestaurantField}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                >
                  <option value="">Select owner</option>
                  {users
                    .filter((account) => account.role === "OWNER")
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.email})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="restaurantName">
                  Restaurant name
                </label>
                <input
                  id="restaurantName"
                  name="name"
                  value={restaurantForm.name}
                  onChange={updateRestaurantField}
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
                  value={restaurantForm.cuisine}
                  onChange={updateRestaurantField}
                  placeholder="Italian"
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
                value={restaurantForm.address}
                onChange={updateRestaurantField}
                rows="3"
                placeholder="Street address"
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
                  value={restaurantForm.openingTime}
                  onChange={updateRestaurantField}
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
                  value={restaurantForm.closingTime}
                  onChange={updateRestaurantField}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={savingRestaurant}
                className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingRestaurant
                  ? "Saving..."
                  : selectedRestaurant
                    ? "Save restaurant"
                    : "Create restaurant"}
              </button>

              <button
                type="button"
                onClick={() =>
                  selectedRestaurant
                    ? selectRestaurant(selectedRestaurant.id)
                    : beginCreate()
                }
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </button>

              {selectedRestaurant && (
                <button
                  type="button"
                  onClick={handleDeleteRestaurant}
                  disabled={deletingRestaurantId === selectedRestaurant.id}
                  className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingRestaurantId === selectedRestaurant.id
                    ? "Deleting..."
                    : "Delete restaurant"}
                </button>
              )}
            </div>
          </form>

          {selectedRestaurant && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Table management
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {editingTableId ? "Edit table" : "Add a table"}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {tables.length} tables
                </span>
              </div>

              <form onSubmit={handleTableSubmit} className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <input
                  name="tableNumber"
                  type="number"
                  min="1"
                  placeholder="Table number"
                  value={tableForm.tableNumber}
                  onChange={updateTableField}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="Capacity"
                  value={tableForm.capacity}
                  onChange={updateTableField}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingTable}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingTable
                      ? "Saving..."
                      : editingTableId
                        ? "Update"
                        : "Add"}
                  </button>
                  {editingTableId && (
                    <button
                      type="button"
                      onClick={clearTableForm}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {loadingTables ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                    Loading tables...
                  </div>
                ) : tables.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    No tables have been added yet.
                  </div>
                ) : (
                  tables.map((table) => (
                    <div
                      key={table.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">Table {table.tableNumber}</p>
                        <p className="text-sm text-slate-500">Capacity {table.capacity}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditTable(table)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTable(table)}
                          disabled={deletingTableId === table.id}
                          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingTableId === table.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default OwnerDashboard;
