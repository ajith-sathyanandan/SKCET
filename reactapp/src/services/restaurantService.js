import { apiClient } from "./apiClient";

export const restaurantService = {
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
