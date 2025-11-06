// utils/axiosInstance.js
import axios from "axios";
import { BASE_URL } from "./apiPaths";

/**
 * === 🔧 AXIOS INSTANCE CONFIGURATION ===
 * Base setup untuk semua request HTTP dari aplikasi
 * - baseURL: URL utama API backend
 * - timeout: batas waktu (ms)
 * - headers: konfigurasi default
 */
const axiosInstance = axios.create({
  baseURL: BASE_URL, // Contoh: "https://localhost:8000/api"
  timeout: 10_000, // 10 detik
  headers: {
    Accept: "application/json",
  },
  withCredentials: false, // Tidak kirim cookie otomatis
});

/**
 * === 📤 REQUEST INTERCEPTOR ===
 * Menyisipkan token Authorization ke setiap request jika ada.
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Pastikan headers sudah ada
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Jika data adalah FormData, biarkan browser handle Content-Type
    const isFormData =
      typeof FormData !== "undefined" && config.data instanceof FormData;

    if (isFormData && config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    // Debugging log (opsional, bisa dimatikan di production)
    if (process.env.NODE_ENV === "development") {
      console.log("🟢 [Axios Request]", {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ [Axios Request Error]", error);
    return Promise.reject(error);
  }
);

/**
 * === 📥 RESPONSE INTERCEPTOR ===
 * Menangani respon sukses & error dari server.
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ [Axios Response]", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    // Deteksi error yang berasal dari server
    if (error.response) {
      const { status, data, config } = error.response;

      console.error("🚨 [Axios Error Response]", {
        status,
        url: config?.url,
        message: data?.message || error.message,
      });

      // Tangani status tertentu
      if (status === 401) {
        // Unauthorized → biarkan handler di luar (misal: logout user)
        return Promise.reject({ ...error, isUnauthorized: true });
      }

      if (status >= 500) {
        console.error(
          "💥 Server error (500+):",
          data?.message || "Unknown error"
        );
      }
    } else if (error.code === "ECONNABORTED") {
      // Timeout error
      console.error("⏰ Request timed out:", error.message);
    } else {
      // Kesalahan koneksi atau error lain
      console.error("⚠️ [Axios Network/Error]", error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
