import { apiClient } from "./apiClient";

function buildDiscoveryPath(filters = {}) {
  const parameters = new URLSearchParams();

  const search = filters.search?.trim();
  const cuisine = filters.cuisine?.trim();
  const location = filters.location?.trim();

  if (search) {
    parameters.set("search", search);
  }

  if (cuisine) {
    parameters.set("cuisine", cuisine);
  }

  if (location) {
    parameters.set("location", location);
  }

  const query = parameters.toString();

  return query
    ? `/restaurants?${query}`
    : "/restaurants";
}

export const restaurantService = {
  discover(filters = {}) {
    return apiClient.get(buildDiscoveryPath(filters));
  },

  getAll() {
    return apiClient.get("/restaurants");
  },

  getById(restaurantId) {
    return apiClient.get(`/restaurants/${restaurantId}`);
  },

  create(restaurant) {
    return apiClient.post("/restaurants", restaurant);
  },

  update(restaurantId, restaurant) {
    return apiClient.put(
      `/restaurants/${restaurantId}`,
      restaurant,
    );
  },

  remove(restaurantId) {
    return apiClient.delete(`/restaurants/${restaurantId}`);
  },
};
