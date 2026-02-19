import axios from "axios";
import { BASE_URL } from "./apiPaths";

/**
 * === 🔧 AXIOS INSTANCE CONFIGURATION ===
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

/**
 * === 📤 REQUEST INTERCEPTOR ===
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Penanganan FormData yang lebih bersih
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `🟢 [Axios Request] ${config.method?.toUpperCase()} -> ${config.url}`,
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * === 📥 RESPONSE INTERCEPTOR ===
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, code } = error;

    if (response) {
      const { status } = response;

      // 401 Unauthorized: Paksa logout jika token tidak valid
      if (status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("user:profile");
        // Opsional: window.location.href = "/login";
      }

      if (process.env.NODE_ENV === "development") {
        console.error(
          `🚨 [Axios Error ${status}] -> ${response.config.url}`,
          response.data,
        );
      }
    } else if (code === "ECONNABORTED") {
      console.error("⏰ Request timed out");
    }

    return Promise.reject(error);
  },
);

// PENTING: Lampirkan isCancel agar bisa diakses via axiosInstance
axiosInstance.isCancel = axios.isCancel;

export default axiosInstance;
