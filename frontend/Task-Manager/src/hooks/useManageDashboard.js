import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { dashboardService } from "../services/dashboardService";

export const useDashboardData = () => {
  const abortControllerRef = useRef(null);

  const [cardStats, setCardStats] = useState([]);
  const [delayedAlerts, setDelayedAlerts] = useState({ tasks: [], count: 0 }); // State baru untuk data 2 minggu
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
      // Menjalankan kedua fetch secara bersamaan
      const [cards, delayed] = await Promise.all([
        dashboardService.fetchDashboardCards(controller.signal),
        dashboardService.fetchDelayedTasks(controller.signal),
      ]);

      setCardStats(cards);
      setDelayedAlerts(delayed);
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
      isLoading,
      filterDraft,
      appliedFilters,
    },
    actions,
  };
};
