import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LuArrowRight } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import InfoCard from "../../components/cards/InfoCard";
const CustomBarChart = React.lazy(() =>
  import("../../components/charts/CustomBarChart")
);
const CustomGraphChart = React.lazy(() =>
  import("../../components/charts/CustomGraphChart")
);
const TaskListTable = React.lazy(() =>
  import("../../components/tabels/TaskListTable")
);

import CardSkeleton from "../../components/Skeletons/CardSkeleton";
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
import Pagination from "../../components/ui/Pagination";

import { UserContext } from "../../context/UserContexts";
import { UseUserAuth } from "../../hooks/UseUserAuth";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { formatDateId } from "../../utils/formatDateId";

// =============================
// Constants & Helpers
// =============================
const CHART_COLORS = ["#8D51FF", "#00B8DB", "#7BCE08", "#FFBB28", "#FF1F57"];

const transformObjectToChartData = (obj) =>
  obj ? Object.entries(obj).map(([label, count]) => ({ label, count })) : [];

// =============================
// Komponen Dashboard (Admin)
// =============================
const Dashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // =============================
  // States
  // =============================
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchNopel, setSearchNopel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const recordLimit = 5;
  const abortControllerRef = useRef(null);

  const formattedToday = useMemo(
    () => formatDateId(new Date(), { withWeekday: true }),
    []
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // =============================
  // Data Extraction
  // =============================
  const {
    statsSummary,
    overdueTasks,
    totalOverdueTasks,
    weeklyStatistics,
    responsePage,
    responseLimit,
    totalPages,
  } = useMemo(() => {
    const statsSummary = dashboardData?.stats ?? {};
    const overdueTasks = dashboardData?.overdueTasks ?? [];
    const totalOverdueTasks = dashboardData?.overdueTotal ?? 0;
    const weeklyStatistics = dashboardData?.weeklyStats ?? [];

    const responsePage = Number(dashboardData?.page ?? currentPage);
    const responseLimit = Number(dashboardData?.limit ?? recordLimit);
    const currentRows = overdueTasks.length;

    const totalPages =
      totalOverdueTasks > 0
        ? Math.ceil(totalOverdueTasks / responseLimit)
        : responsePage + (currentRows === responseLimit ? 1 : 0);

    return {
      statsSummary,
      overdueTasks,
      totalOverdueTasks,
      weeklyStatistics,
      responsePage,
      responseLimit,
      totalPages,
    };
  }, [dashboardData, currentPage, recordLimit]);

  const handleSeeMore = useCallback(() => navigate("/admin/tasks"), [navigate]);

  // =============================
  // Fetch Dashboard Data
  // =============================
  const fetchDashboardData = useCallback(
    async ({ pageNumber = currentPage } = {}) => {
      abortControllerRef.current?.abort();
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;

      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get(
          API_PATHS.TASK.GET_DASHBOARD_DATA,
          {
            params: {
              page: pageNumber,
              limit: recordLimit,
              nopel: searchNopel || undefined,
              year: selectedYear || undefined,
            },
            signal: newAbortController.signal,
          }
        );
        setDashboardData(data ?? null);
      } catch (error) {
        if (
          !["CanceledError", "AbortError", "ERR_CANCELED"].includes(
            error?.name || error?.code
          )
        ) {
          console.error("Dashboard load error:", error);
          toast.error("Gagal memuat dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, recordLimit, searchNopel, selectedYear]
  );

  useEffect(() => {
    fetchDashboardData({ pageNumber: 1 });
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    fetchDashboardData({ pageNumber: 1 });
  }, [currentPage, searchNopel, selectedYear]);

  // =============================
  // RENDER
  // =============================
  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-12">
        <header className="my-6 px-3 md:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Selamat datang, {user?.name}
              </h1>
              <p className="text-sm text-gray-500">{formattedToday}</p>
            </div>

            {/* ✅ Filter Tahun */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-700">Filter Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <section className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <InfoCard
              label="Total Permohonan"
              value={statsSummary?.totalTasks ?? 0}
              color="primary"
            />
            <InfoCard
              label="Permohonan Dikirim"
              value={statsSummary?.totalApproved ?? 0}
              color="green"
            />
            <InfoCard
              label="Permohonan Ditolak"
              value={statsSummary?.totalRejected ?? 0}
              color="red"
            />
            <InfoCard
              label="Permohonan Diproses"
              value={statsSummary?.totalPending ?? 0}
              color="yellow"
            />
          </section>
        </header>

        {/* Charts Section */}
        <main className="px-3 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Suspense fallback={<CardSkeleton />}>
            {/* Per Jenis */}
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5">
              <h2 className="text-lg font-medium mb-4 text-slate-800">
                Permohonan Per Jenis
              </h2>
              {statsSummary?.tasksPerTitle &&
              Object.keys(statsSummary.tasksPerTitle).length > 0 ? (
                <CustomBarChart
                  data={transformObjectToChartData(statsSummary.tasksPerTitle)}
                  colors={CHART_COLORS}
                />
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data untuk ditampilkan.
                </div>
              )}
            </section>

            {/* Per Kecamatan */}
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5">
              <h2 className="text-lg font-medium mb-4 text-slate-800">
                Permohonan Per Kecamatan
              </h2>
              {statsSummary?.tasksPerSubdistrict &&
              Object.keys(statsSummary.tasksPerSubdistrict).length > 0 ? (
                <CustomBarChart
                  data={transformObjectToChartData(
                    statsSummary.tasksPerSubdistrict
                  )}
                  colors={CHART_COLORS}
                />
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data untuk ditampilkan.
                </div>
              )}
            </section>
          </Suspense>

          {/* Weekly Stats Chart */}
          <Suspense fallback={<CardSkeleton height={320} />}>
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 md:col-span-2">
              <h2 className="text-lg font-medium mb-4 text-slate-800">
                Pertumbuhan Permohonan (12 Minggu Terakhir)
              </h2>
              {weeklyStatistics.length > 0 ? (
                <CustomGraphChart data={weeklyStatistics} showLegend />
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data untuk ditampilkan.
                </div>
              )}
            </section>
          </Suspense>

          {/* Overdue Tasks */}
          <Suspense fallback={<TableSkeleton />}>
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 md:col-span-2 relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-800">
                  Permohonan Jatuh Tempo (2 Minggu Sejak Diinput)
                </h2>
                <button
                  onClick={handleSeeMore}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  Lihat Semua
                  <LuArrowRight className="text-base" />
                </button>
              </div>
              {overdueTasks.length > 0 ? (
                <>
                  <TaskListTable
                    tableData={overdueTasks}
                    page={responsePage}
                    limit={responseLimit}
                    searchNopel={searchNopel}
                    onSearchNopel={(query) => {
                      setCurrentPage(1);
                      setSearchNopel(query || "");
                    }}
                  />
                  <Pagination
                    page={responsePage}
                    totalPages={totalPages}
                    disabled={isLoading}
                    onPageChange={(nextPage) => {
                      const safePage = Math.max(1, nextPage);
                      if (safePage !== currentPage) setCurrentPage(safePage);
                    }}
                  />
                </>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data jatuh tempo.
                </div>
              )}
            </section>
          </Suspense>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
