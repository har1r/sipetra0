// Alamat URL Utama
export const BASE_URL = "http://localhost:8000";

/**
 * === 🛠️ API PATHS REGISTRY ===
 * Mengorganisir semua endpoint agar selaras dengan struktur fitur
 */
export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_USER_PROFILE: "/api/auth/profile",
    UPLOAD_IMAGE: "/api/auth/upload-image", // Dipindah ke sini karena terkait profil user
  },

  USER: {
    GET_ALL_USER: "/api/users",
  },

  TASK: {
    // UNIFIED: Dashboard sekarang menggunakan satu jalur utama,
    // pembedaan data dilakukan oleh logic backend berdasarkan token role.
    GET_DASHBOARD_DATA: "/api/tasks/dashboard",

    // CRUD Permohonan
    GET_ALL_TASKS: "/api/tasks",
    CREATE_TASK: "/api/tasks",
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
    UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`,
    DELETE_TASK: (taskId) => `/api/tasks/${taskId}`,

    // Workflow
    APPROVE_TASK: (taskId) => `/api/tasks/${taskId}/approve`,
    TEAM_PERFORMANCE: "/api/tasks/user-performance",
  },

  REPORTS: {
    // Pengelolaan Surat Pengantar & Export
    CREATE_REPORT: "/api/reports/create-report",
    DAFTAR_SURAT_PENGANTAR: "/api/reports/daftar-surat-pengantar",
    EXPORTED_REPORTS: "/api/reports/exported-reports",
    EXPORT_SELECTED_TASKS: (reportId) =>
      `/api/reports/export-selected/${reportId}`,

    // Lampiran & Link (Unified naming)
    ADD_ATTACHMENT: (taskId) => `/api/reports/add-attachment/${taskId}`,
    UPDATE_BATCH_ATTACHMENT: (reportId) =>
      `/api/reports/attachment/${reportId}`,
  },
};
