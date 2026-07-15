import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ApiClientError } from "../services/apiClient";
import { restaurantService } from "../services/restaurantService";

const emptyFilters = {
  search: "",
  cuisine: "",
  location: "",
};

function formatTime(value) {
  if (!value) {
    return "Not available";
  }

  return value.slice(0, 5);
}

function RestaurantDiscoveryPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRestaurants = useCallback(async (activeFilters) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response =
        await restaurantService.discover(activeFilters);

      setRestaurants(
        Array.isArray(response) ? response : [],
      );
    } catch (error) {
      setRestaurants([]);

      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unable to load restaurants",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants(emptyFilters);
  }, [loadRestaurants]);

  const updateFilter = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadRestaurants(filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    loadRestaurants(emptyFilters);
  };

  return (
    <section className="discovery-page">
      <header className="discovery-header">
        <div>
          <span className="eyebrow">
            Restaurant discovery
          </span>
          <h2>Find your next dining experience</h2>
          <p>
            Search restaurants by name, cuisine, or location
            and view available table information.
          </p>
        </div>
      </header>

      <form
        className="discovery-filter-card"
        onSubmit={handleSubmit}
      >
        <div className="discovery-field discovery-search-field">
          <label htmlFor="restaurant-search">
            Search
          </label>

          <input
            id="restaurant-search"
            name="search"
            type="search"
            placeholder="Restaurant name or cuisine"
            value={filters.search}
            onChange={updateFilter}
          />
        </div>

        <div className="discovery-field">
          <label htmlFor="cuisine-filter">
            Cuisine
          </label>

          <input
            id="cuisine-filter"
            name="cuisine"
            type="text"
            placeholder="Indian, Italian..."
            value={filters.cuisine}
            onChange={updateFilter}
          />
        </div>

        <div className="discovery-field">
          <label htmlFor="location-filter">
            Location
          </label>

          <input
            id="location-filter"
            name="location"
            type="text"
            placeholder="Coimbatore"
            value={filters.location}
            onChange={updateFilter}
          />
        </div>

        <div className="discovery-filter-actions">
          <button
            type="submit"
            className="discovery-primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            className="discovery-secondary-button"
            onClick={clearFilters}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </form>

      {errorMessage && (
        <div
          className="discovery-alert discovery-alert-error"
          role="alert"
        >
          {errorMessage}

          <button
            type="button"
            onClick={() => loadRestaurants(filters)}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div
          className="discovery-loading"
          aria-busy="true"
        >
          <div className="discovery-spinner" />
          <p>Loading restaurants...</p>
        </div>
      ) : restaurants.length === 0 && !errorMessage ? (
        <div className="discovery-empty-state">
          <span className="discovery-empty-icon">R</span>
          <h3>No restaurants found</h3>
          <p>
            Try changing the search term, cuisine, or
            location.
          </p>

          <button
            type="button"
            className="discovery-secondary-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="discovery-result-header">
            <h3>Available restaurants</h3>
            <span>
              {restaurants.length} result
              {restaurants.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="restaurant-card-grid">
            {restaurants.map((restaurant) => (
              <article
                className="restaurant-discovery-card"
                key={restaurant.id}
              >
                <div className="restaurant-card-banner">
                  <span>
                    {restaurant.name
                      ?.charAt(0)
                      .toUpperCase() || "R"}
                  </span>
                </div>

                <div className="restaurant-card-content">
                  <div className="restaurant-card-heading">
                    <div>
                      <span className="restaurant-cuisine-badge">
                        {restaurant.cuisine}
                      </span>

                      <h3>{restaurant.name}</h3>
                    </div>

                    <span className="restaurant-status">
                      Open
                    </span>
                  </div>

                  <p className="restaurant-address">
                    {restaurant.address}
                  </p>

                  <dl className="restaurant-card-details">
                    <div>
                      <dt>Opening</dt>
                      <dd>
                        {formatTime(
                          restaurant.openingTime,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Closing</dt>
                      <dd>
                        {formatTime(
                          restaurant.closingTime,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    to={`/restaurants/${restaurant.id}`}
                    className="restaurant-details-link"
                  >
                    View restaurant details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default RestaurantDiscoveryPage;
