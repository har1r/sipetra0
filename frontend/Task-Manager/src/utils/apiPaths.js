// Alamat URL yang akan kita gunakan untuk setiap request
export const BASE_URL = "http://localhost:8000";

//utils/apiPaths.js
export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_USER_PROFILE: "/api/auth/profile",
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  USER: {
    GET_ALL_USER: "/api/users",
  },
  TASK: {
    GET_DASHBOARD_DATA: "/api/tasks/admin-dashboard",
    GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard",
    GET_ALL_TASKS: "/api/tasks",
    CREATE_TASK: "/api/tasks/create",
    GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`,
    APPROVE_TASK: (taskId) => `/api/tasks/approve/${taskId}`,
    UPDATE_TASK: (taskId) => `/api/tasks/update/${taskId}`,
    DELETE_TASK: (taskId) => `/api/tasks/delete/${taskId}`,
    TEAM_PERFORMANCE: "/api/tasks/user-performance",
    GET_TASKS_WEEKLY_STATS: "/api/tasks/weekly-task",
  },
  REPORTS: {
    EXPORT_SELECTED_TASKS: "/api/reports/export-selected",
    DAFTAR_SURAT_PENGANTAR: "/api/reports/daftar-surat-pengantar",
  },
};
