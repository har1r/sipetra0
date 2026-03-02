// services/dashboardService.js
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const dashboardService = {
  fetchDashboardCards: async (signal) => {
    const { data } = await axiosInstance.get(
      API_PATHS.DASHBOARD.GET_CARD_TASKS,
      {
        signal,
      },
    );
    return data.data ?? [];
  },

  fetchDelayedTasks: async (signal) => {
    const { data } = await axiosInstance.get(
      API_PATHS.DASHBOARD.GET_DELAYED_TASKS,
      {
        signal,
      },
    );

    return {
      tasks: data.data ?? [],
      count: data.count ?? 0,
    };
  },

  fetchSubdistrictChart: async (signal) => {
    const { data } = await axiosInstance.get(
      API_PATHS.DASHBOARD.GET_SUBDISTRICT_CHART, 
      {
        signal,
      }
    );

    return data.data ?? { serviceTypes: [], chartData: [] };
  },

  fetchVillageChart: async (signal) => {
    const { data } = await axiosInstance.get(
      API_PATHS.DASHBOARD.GET_VILLAGE_CHART, 
      {
        signal,
      }
    );

    return data.data ?? { serviceTypes: [], chartData: [] };
  },
};
