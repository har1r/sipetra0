// hooks/useDashboardData.js
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { dashboardService } from "../services/dashboardService";

export const useManageDashboard = () => {
  const abortControllerRef = useRef(null);

  const [cardStats, setCardStats] = useState([]);
  const [delayedAlerts, setDelayedAlerts] = useState({ tasks: [], count: 0 });
  // State baru untuk data grafik Bar Subdistrict
  const [subdistrictData, setSubdistrictData] = useState({ serviceTypes: [], chartData: [] });
  const [villageData, setVillageData] = useState({ serviceTypes: [], chartData: [] });
  const [isLoading, setIsLoading] = useState(true);

  const [filterDraft, setFilterDraft] = useState({
    year: new Date().getFullYear(),
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filterDraft });

  const loadData = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      // Menjalankan ketiga fetch secara bersamaan untuk performa maksimal
      const [cards, delayed, subdistrictChart, villageChart] = await Promise.all([
        dashboardService.fetchDashboardCards(controller.signal),
        dashboardService.fetchDelayedTasks(controller.signal),
        dashboardService.fetchSubdistrictChart(controller.signal), // Fetch grafik baru
        dashboardService.fetchVillageChart(controller.signal), // Fetch grafik baru
      ]);

      setCardStats(cards);
      setDelayedAlerts(delayed);
      setSubdistrictData(subdistrictChart); // Update state grafik
      setVillageData(villageChart);
    } catch (err) {
      if (
        !["CanceledError", "AbortError", "ERR_CANCELED"].includes(
          err?.name || err?.code,
        )
      ) {
        toast.error("Gagal mengambil data statistik dashboard");
        console.error("Dashboard fetch error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => abortControllerRef.current?.abort();
  }, [loadData]);

  const actions = {
    refresh: () => loadData(),

    setFilterDraft: (updates) => {
      setFilterDraft((prev) => ({ ...prev, ...updates }));
    },

    applyFilter: () => {
      setAppliedFilters({ ...filterDraft });
    },

    resetFilter: () => {
      const init = { year: new Date().getFullYear() };
      setFilterDraft(init);
      setAppliedFilters(init);
    },
  };

  return {
    state: {
      cardStats,
      delayedAlerts,
      subdistrictData, // Return state grafik ke komponen UI
      villageData,
      isLoading,
      filterDraft,
      appliedFilters,
    },
    actions,
  };
};