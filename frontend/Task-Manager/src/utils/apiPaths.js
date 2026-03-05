// Alamat URL Utama
export const BASE_URL = "https://f998hms6-8000.asse.devtunnels.ms/";

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
    DELETE_ATTACHMENT_TO_TASK: (taskId, attachmentId) =>
      `/api/reports/delete-attachment-to-task/${taskId}/attachments/${attachmentId}`,
    ADD_ATTACHMENT_TO_REPORT: (reportId) =>
      `/api/reports/add-attachment-to-report/${reportId}`,
  },

  DASHBOARD: {
    GET_CARD_TASKS: "/api/dashboard/get-card-task",
    GET_DELAYED_TASKS: "/api/dashboard/get-delayed-task",
    GET_SUBDISTRICT_CHART: "/api/dashboard/get-subdistrict-chart",
    GET_VILLAGE_CHART: "/api/dashboard/get-village-chart",
    GET_COUNT: "/api/dashboard/get-count-batcId-reported-task",
  },
};
