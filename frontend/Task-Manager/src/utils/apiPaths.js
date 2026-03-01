// Alamat URL Utama
export const BASE_URL = "https://c7qrlm2d-8000.asse.devtunnels.ms/";

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
    CREATE_REPORT: "/api/reports/create-report",
    GENERATE_REPORT: (reportId) => `/api/reports/generate-report/${reportId}`,
    GENERATE_PARTIAL_MUTATION: (taskId) =>
      `/api/reports/generate-partial-mutation/${taskId}`,
    GET_VERIFIED_TASKS: "/api/reports/get-verified-tasks",
    GET_REPORTS: "/api/reports/get-reports",
    VOID_REPORT: (reportId) => `/api/reports/void-report/${reportId}`,

    ADD_ATTACHMENT_TO_TASK: (taskId) =>
      `/api/reports/add-attachment-to-task/${taskId}`,
    ADD_ATTACHMENT_TO_REPORT: (reportId) =>
      `/api/reports/add-attachment-to-report/${reportId}`,
  },
};
