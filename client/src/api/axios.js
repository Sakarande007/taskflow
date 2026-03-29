import axios from "axios";

const API = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: true,
  timeout:         12000,
});

// Attach stored token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let queue = [];

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return API(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.data.accesstoken;
        localStorage.setItem("tf_access_token", newToken);
        queue.forEach((p) => p.resolve(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return API(original);
      } catch (refreshError) {
        queue.forEach((p) => p.reject(refreshError));
        queue = [];
        localStorage.removeItem("tf_access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
