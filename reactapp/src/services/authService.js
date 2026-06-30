import { apiClient } from "./apiClient";

export const authService = {
  register(payload) {
    return apiClient.post("/auth/register", payload);
  },

  login(payload) {
    return apiClient.post("/auth/login", payload);
  },

  getProfile() {
    return apiClient.get("/profile");
  },

  updateProfile(payload) {
    return apiClient.put("/profile", payload);
  },

  changePassword(payload) {
    return apiClient.put("/profile/password", payload);
  },
};
