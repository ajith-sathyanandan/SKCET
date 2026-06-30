import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  ApiClientError,
} from "../services/apiClient";
import {
  restaurantService,
} from "../services/restaurantService";

const emptyForm = {
  ownerId: "",
  name: "",
  address: "",
  cuisine: "",
  openingTime: "",
  closingTime: "",
  totalTables: "",
};

function normalizeTime(value) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function restaurantToForm(restaurant) {
  return {
    ownerId: restaurant.ownerId?.toString() ?? "",
    name: restaurant.name ?? "",
    address: restaurant.address ?? "",
    cuisine: restaurant.cuisine ?? "",
    openingTime: normalizeTime(restaurant.openingTime),
    closingTime: normalizeTime(restaurant.closingTime),
    totalTables:
      restaurant.totalTables?.toString() ?? "",
  };
}

function validateRestaurant(form, requireOwnerId) {
  const errors = {};

  if (requireOwnerId && !form.ownerId.trim()) {
    errors.ownerId = "Owner ID is required";
  }

  if (!form.name.trim()) {
    errors.name = "Restaurant name is required";
  }

  if (!form.address.trim()) {
    errors.address = "Address is required";
  }

  if (!form.cuisine.trim()) {
    errors.cuisine = "Cuisine is required";
  }

  if (!form.openingTime) {
    errors.openingTime = "Opening time is required";
  }

  if (!form.closingTime) {
    errors.closingTime = "Closing time is required";
  }

  if (
    form.openingTime
    && form.closingTime
    && form.closingTime <= form.openingTime
  ) {
    errors.closingTime =
      "Closing time must be after opening time";
  }

  const totalTables = Number(form.totalTables);

  if (!form.totalTables) {
    errors.totalTables = "Total tables is required";
  } else if (
    !Number.isInteger(totalTables)
    || totalTables < 1
    || totalTables > 500
  ) {
    errors.totalTables =
      "Total tables must be a whole number between 1 and 500";
  }

  return errors;
}

function OwnerPage() {
  const { user } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] =
    useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isCreating, setIsCreating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.role === "ADMIN";

  const accessibleRestaurants = useMemo(() => {
    if (isAdmin) {
      return restaurants;
    }

    return restaurants.filter(
      (restaurant) =>
        String(restaurant.ownerId) === String(user?.id),
    );
  }, [restaurants, isAdmin, user?.id]);

  const selectedRestaurant = useMemo(
    () =>
      accessibleRestaurants.find(
        (restaurant) =>
          String(restaurant.id)
          === String(selectedRestaurantId),
      ) ?? null,
    [accessibleRestaurants, selectedRestaurantId],
  );

  const selectRestaurant = useCallback((restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    setForm(restaurantToForm(restaurant));
    setFormErrors({});
    setIsCreating(false);
    setSuccessMessage("");
    setErrorMessage("");
  }, []);

  const beginCreate = useCallback(() => {
    setSelectedRestaurantId(null);
    setForm(emptyForm);
    setFormErrors({});
    setIsCreating(true);
    setSuccessMessage("");
    setErrorMessage("");
  }, []);

  const loadRestaurants = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await restaurantService.getAll();
      const loadedRestaurants = Array.isArray(response)
        ? response
        : [];

      setRestaurants(loadedRestaurants);

      const visibleRestaurants = isAdmin
        ? loadedRestaurants
        : loadedRestaurants.filter(
            (restaurant) =>
              String(restaurant.ownerId)
              === String(user?.id),
          );

      if (visibleRestaurants.length > 0) {
        selectRestaurant(visibleRestaurants[0]);
      } else {
        beginCreate();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to load restaurant information",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    beginCreate,
    isAdmin,
    selectRestaurant,
    user?.id,
  ]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleRestaurantSelection = (event) => {
    const restaurant = restaurants.find(
      (item) =>
        String(item.id) === event.target.value,
    );

    if (restaurant) {
      selectRestaurant(restaurant);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateRestaurant(
      form,
      isAdmin && isCreating,
    );

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMessage(
        "Correct the highlighted fields before saving",
      );
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      cuisine: form.cuisine.trim(),
      openingTime: `${form.openingTime}:00`,
      closingTime: `${form.closingTime}:00`,
      totalTables: Number(form.totalTables),
    };

    if (isAdmin && isCreating) {
      payload.ownerId = Number(form.ownerId);
    }

    try {
      let savedRestaurant;

      if (isCreating) {
        savedRestaurant =
          await restaurantService.create(payload);
      } else {
        savedRestaurant =
          await restaurantService.update(
            selectedRestaurantId,
            payload,
          );
      }

      const restaurantWithTableCount = {
        ...savedRestaurant,
        totalTables: Number(form.totalTables),
      };

      setRestaurants((current) => {
        const exists = current.some(
          (restaurant) =>
            String(restaurant.id)
            === String(restaurantWithTableCount.id),
        );

        if (exists) {
          return current.map((restaurant) =>
            String(restaurant.id)
              === String(restaurantWithTableCount.id)
              ? restaurantWithTableCount
              : restaurant,
          );
        }

        return [...current, restaurantWithTableCount];
      });

      selectRestaurant(restaurantWithTableCount);

      setSuccessMessage(
        isCreating
          ? "Restaurant profile created successfully"
          : "Restaurant profile updated successfully",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to save restaurant profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRestaurant || !isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedRestaurant.name}"? `
        + "This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await restaurantService.remove(
        selectedRestaurant.id,
      );

      const remainingRestaurants = restaurants.filter(
        (restaurant) =>
          String(restaurant.id)
          !== String(selectedRestaurant.id),
      );

      setRestaurants(remainingRestaurants);

      if (remainingRestaurants.length > 0) {
        selectRestaurant(remainingRestaurants[0]);
        setSuccessMessage(
          "Restaurant deleted successfully",
        );
      } else {
        beginCreate();
        setSuccessMessage(
          "Restaurant deleted successfully",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to delete restaurant",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <section
        className="owner-workspace"
        aria-busy="true"
      >
        <div className="owner-loading-card">
          <div className="owner-spinner" />
          <p>Loading restaurant profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="owner-workspace">
      <header className="owner-page-header">
        <div>
          <span className="eyebrow">
            {isAdmin ? "ADMIN management" : "OWNER access"}
          </span>
          <h2>Restaurant management</h2>
          <p>
            Create and maintain restaurant information,
            operating hours and table capacity.
          </p>
        </div>

        <button
          type="button"
          className="owner-secondary-button"
          onClick={beginCreate}
        >
          Add restaurant
        </button>
      </header>

      {errorMessage && (
        <div
          className="owner-alert owner-alert-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          className="owner-alert owner-alert-success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {isAdmin && restaurants.length > 0 && (
        <div className="owner-restaurant-selector">
          <label htmlFor="restaurant-selection">
            Select restaurant
          </label>

          <select
            id="restaurant-selection"
            value={selectedRestaurantId ?? ""}
            onChange={handleRestaurantSelection}
          >
            {restaurants.map((restaurant) => (
              <option
                key={restaurant.id}
                value={restaurant.id}
              >
                {restaurant.name} - {restaurant.ownerName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="owner-management-grid">
        <form
          className="owner-form-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="owner-form-heading">
            <div>
              <span className="owner-form-mode">
                {isCreating
                  ? "Create profile"
                  : "Edit profile"}
              </span>

              <h3>
                {isCreating
                  ? "New restaurant"
                  : selectedRestaurant?.name}
              </h3>
            </div>

            {!isCreating && (
              <span className="owner-id-badge">
                ID #{selectedRestaurantId}
              </span>
            )}
          </div>

          {isAdmin && isCreating && (
            <div className="owner-field">
              <label htmlFor="ownerId">
                Restaurant owner ID
              </label>

              <input
                id="ownerId"
                name="ownerId"
                type="number"
                min="1"
                value={form.ownerId}
                onChange={updateField}
                aria-invalid={Boolean(
                  formErrors.ownerId,
                )}
              />

              {formErrors.ownerId && (
                <small className="owner-field-error">
                  {formErrors.ownerId}
                </small>
              )}
            </div>
          )}

          <div className="owner-field">
            <label htmlFor="name">
              Restaurant name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              maxLength="255"
              placeholder="Example: Spice Garden"
              value={form.name}
              onChange={updateField}
              aria-invalid={Boolean(formErrors.name)}
            />

            {formErrors.name && (
              <small className="owner-field-error">
                {formErrors.name}
              </small>
            )}
          </div>

          <div className="owner-field">
            <label htmlFor="address">Address</label>

            <textarea
              id="address"
              name="address"
              rows="3"
              maxLength="255"
              placeholder="Restaurant street address"
              value={form.address}
              onChange={updateField}
              aria-invalid={Boolean(
                formErrors.address,
              )}
            />

            {formErrors.address && (
              <small className="owner-field-error">
                {formErrors.address}
              </small>
            )}
          </div>

          <div className="owner-form-row">
            <div className="owner-field">
              <label htmlFor="cuisine">Cuisine</label>

              <input
                id="cuisine"
                name="cuisine"
                type="text"
                maxLength="100"
                placeholder="Indian"
                value={form.cuisine}
                onChange={updateField}
                aria-invalid={Boolean(
                  formErrors.cuisine,
                )}
              />

              {formErrors.cuisine && (
                <small className="owner-field-error">
                  {formErrors.cuisine}
                </small>
              )}
            </div>

            <div className="owner-field">
              <label htmlFor="totalTables">
                Total tables
              </label>

              <input
                id="totalTables"
                name="totalTables"
                type="number"
                min="1"
                max="500"
                placeholder="20"
                value={form.totalTables}
                onChange={updateField}
                aria-invalid={Boolean(
                  formErrors.totalTables,
                )}
              />

              {formErrors.totalTables && (
                <small className="owner-field-error">
                  {formErrors.totalTables}
                </small>
              )}
            </div>
          </div>

          <div className="owner-form-row">
            <div className="owner-field">
              <label htmlFor="openingTime">
                Opening time
              </label>

              <input
                id="openingTime"
                name="openingTime"
                type="time"
                value={form.openingTime}
                onChange={updateField}
                aria-invalid={Boolean(
                  formErrors.openingTime,
                )}
              />

              {formErrors.openingTime && (
                <small className="owner-field-error">
                  {formErrors.openingTime}
                </small>
              )}
            </div>

            <div className="owner-field">
              <label htmlFor="closingTime">
                Closing time
              </label>

              <input
                id="closingTime"
                name="closingTime"
                type="time"
                value={form.closingTime}
                onChange={updateField}
                aria-invalid={Boolean(
                  formErrors.closingTime,
                )}
              />

              {formErrors.closingTime && (
                <small className="owner-field-error">
                  {formErrors.closingTime}
                </small>
              )}
            </div>
          </div>

          <p className="owner-table-note">
            Table capacity is validated in this screen.
            Individual table records will be configured in
            the table-management workflow.
          </p>

          <div className="owner-form-actions">
            <button
              type="submit"
              className="owner-primary-button"
              disabled={isSaving || isDeleting}
            >
              {isSaving
                ? "Saving..."
                : isCreating
                  ? "Create restaurant"
                  : "Save changes"}
            </button>

            {!isCreating && (
              <button
                type="button"
                className="owner-secondary-button"
                onClick={() =>
                  selectRestaurant(
                    selectedRestaurant,
                  )
                }
                disabled={isSaving || isDeleting}
              >
                Reset changes
              </button>
            )}

            {!isCreating && isAdmin && (
              <button
                type="button"
                className="owner-danger-button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting
                  ? "Deleting..."
                  : "Delete restaurant"}
              </button>
            )}
          </div>
        </form>

        <aside className="owner-preview-card">
          <span className="owner-preview-label">
            Live preview
          </span>

          <h3>
            {form.name.trim()
              || "Your restaurant name"}
          </h3>

          <p className="owner-preview-cuisine">
            {form.cuisine.trim()
              || "Cuisine type"}
          </p>

          <dl className="owner-preview-details">
            <div>
              <dt>Address</dt>
              <dd>
                {form.address.trim()
                  || "Restaurant address"}
              </dd>
            </div>

            <div>
              <dt>Operating hours</dt>
              <dd>
                {form.openingTime && form.closingTime
                  ? `${form.openingTime} - ${form.closingTime}`
                  : "Not configured"}
              </dd>
            </div>

            <div>
              <dt>Total tables</dt>
              <dd>
                {form.totalTables || "Not configured"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

export default OwnerPage;
