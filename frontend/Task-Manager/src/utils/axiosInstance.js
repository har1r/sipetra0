// src/utils/axiosInstance.js
import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,        // pastikan: "https://localhost:8000"
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
  withCredentials: false,   // kembali ke mode token di localStorage
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Untuk FormData: biarkan browser set boundary otomatis
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // biar caller/UserProvider bisa handle logout
        return Promise.reject({ ...error, isUnauthorized: true });
      } else if (status === 500) {
        console.error("Server error. Please try again later.");
      }
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timed out. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// import axios from "axios";
// import { BASE_URL } from "./apiPaths";

// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   timeout: 10000, // Set timeout to 10 seconds
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
// });

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     // Add any request modifications here, e.g., adding auth token
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Handle successful responses
//     return response;
//   },
//   (error) => {
//     // Handle errors globally
//     if (error.response) {
//       if (error.response.status === 401) {
//         // Redirect to login page
//         window.location.href = "/login";
//       } else if (error.response.status === 500) {
//         // Handle forbidden access
//         console.error("Server error. Please try again later.");
//       }
//     } else if (error.code === "ECONNABORTED") {
//       // Handle timeout error
//       console.error("Request timed out. Please try again.");
//     }
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
