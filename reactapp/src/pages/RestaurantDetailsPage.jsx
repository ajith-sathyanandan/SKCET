import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiClientError } from "../services/apiClient";
import { restaurantService } from "../services/restaurantService";

function formatTime(value) {
  return value ? value.slice(0, 5) : "Not available";
}

function RestaurantDetailsPage() {
  const { restaurantId } = useParams();

  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRestaurant() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response =
          await restaurantService.getById(restaurantId);

        if (active) {
          setRestaurant(response);
        }
      } catch (error) {
        if (active) {
          setRestaurant(null);

          setErrorMessage(
            error instanceof ApiClientError
              ? error.message
              : "Unable to load restaurant details",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadRestaurant();

    return () => {
      active = false;
    };
  }, [restaurantId]);

  if (isLoading) {
    return (
      <section
        className="restaurant-details-page"
        aria-busy="true"
      >
        <div className="discovery-loading">
          <div className="discovery-spinner" />
          <p>Loading restaurant details...</p>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="restaurant-details-page">
        <div
          className="discovery-alert discovery-alert-error"
          role="alert"
        >
          {errorMessage}
        </div>

        <Link
          to="/restaurants"
          className="restaurant-back-link"
        >
          Back to restaurants
        </Link>
      </section>
    );
  }

  if (!restaurant) {
    return null;
  }

  const tables = Array.isArray(restaurant.tables)
    ? restaurant.tables
    : [];

  return (
    <section className="restaurant-details-page">
      <Link
        to="/restaurants"
        className="restaurant-back-link"
      >
        Back to restaurants
      </Link>

      <header className="restaurant-details-hero">
        <div className="restaurant-details-mark">
          {restaurant.name?.charAt(0).toUpperCase() || "R"}
        </div>

        <div>
          <span className="restaurant-cuisine-badge">
            {restaurant.cuisine}
          </span>

          <h2>{restaurant.name}</h2>
          <p>{restaurant.address}</p>
        </div>
      </header>

      <div className="restaurant-details-grid">
        <article className="restaurant-information-card">
          <h3>Restaurant information</h3>

          <dl className="restaurant-information-list">
            <div>
              <dt>Restaurant owner</dt>
              <dd>{restaurant.ownerName}</dd>
            </div>

            <div>
              <dt>Opening time</dt>
              <dd>
                {formatTime(restaurant.openingTime)}
              </dd>
            </div>

            <div>
              <dt>Closing time</dt>
              <dd>
                {formatTime(restaurant.closingTime)}
              </dd>
            </div>

            <div>
              <dt>Total tables</dt>
              <dd>{restaurant.totalTables ?? 0}</dd>
            </div>

            <div>
              <dt>Total seating capacity</dt>
              <dd>{restaurant.totalCapacity ?? 0}</dd>
            </div>
          </dl>
        </article>

        <article className="restaurant-table-card">
          <div className="restaurant-table-heading">
            <div>
              <span className="eyebrow">
                Seating information
              </span>
              <h3>Restaurant tables</h3>
            </div>

            <span className="restaurant-table-count">
              {tables.length} table
              {tables.length === 1 ? "" : "s"}
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="restaurant-table-empty">
              Table information is not available yet.
            </div>
          ) : (
            <div className="restaurant-table-list">
              {tables.map((table) => (
                <div
                  className="restaurant-table-item"
                  key={table.id}
                >
                  <div>
                    <strong>
                      Table {table.tableNumber}
                    </strong>
                    <span>
                      Restaurant seating table
                    </span>
                  </div>

                  <span className="restaurant-capacity">
                    {table.capacity} seats
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default RestaurantDetailsPage;
