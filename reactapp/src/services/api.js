import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const storageEntry = localStorage.getItem("restaurant-reservation-auth");
  const fallbackToken = localStorage.getItem("token");
  let token = fallbackToken;

  if (storageEntry) {
    try {
      const session = JSON.parse(storageEntry);
      token = session?.accessToken ?? token;
    } catch {
      token = fallbackToken;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

export default api;
