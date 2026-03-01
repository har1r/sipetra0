import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const reportService = {
  getVerifiedTasks: async (params, signal) => {
    const res = await axiosInstance.get(API_PATHS.REPORTS.GET_VERIFIED_TASKS, {
      params,
      signal,
    });

    return res.data;
  },

  getReports: async (params, signal) => {
    const res = await axiosInstance.get(API_PATHS.REPORTS.GET_REPORTS, {
      params,
      signal,
    });

    return res.data;
  },

  createBatch: async (selectedIds) => {
    return await axiosInstance.post(API_PATHS.REPORTS.CREATE_REPORT, {
      selectedTaskIds: selectedIds,
    });
  },

  generatePartialMutation: async (taskId) => {
    return await axiosInstance.post(
      API_PATHS.REPORTS.GENERATE_PARTIAL_MUTATION(taskId),
      {},
      { responseType: "blob", headers: { Accept: "application/pdf" } },
    );
  },

  addAttachmentToTask: async (taskId, payload) => {
    return await axiosInstance.post(
      API_PATHS.REPORTS.ADD_ATTACHMENT_TO_TASK(taskId),
      payload,
    );
  },

  generateReport: async (reportId) => {
    return await axiosInstance.post(
      API_PATHS.REPORTS.GENERATE_REPORT(reportId),
      {},
      { responseType: "blob", headers: { Accept: "application/pdf" } },
    );
  },

  addAttachmentToReport: async (reportId, payload) => {
    return await axiosInstance.post(
      API_PATHS.REPORTS.ADD_ATTACHMENT_TO_REPORT(reportId),
      payload,
    );
  },

  voidReport: async (reportId) => {
    return await axiosInstance.patch(
      API_PATHS.REPORTS.VOID_REPORT(reportId),
    );
  },
};
