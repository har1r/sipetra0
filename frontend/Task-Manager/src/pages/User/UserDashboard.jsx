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
import { LuArrowRight } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import InfoCard from "../../components/cards/InfoCard";
import CardSkeleton from "../../components/Skeletons/CardSkeleton";
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
import Pagination from "../../components/ui/Pagination";

import UserContext from "../../context/UserContexts";
import { UseUserAuth } from "../../hooks/UseUserAuth";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { formatDateId } from "../../utils/formatDateId";

const CustomBarChart = React.lazy(() =>
  import("../../components/charts/CustomBarChart")
);
const TaskListTable = React.lazy(() =>
  import("../../components/tabels/TaskListTable")
);

// ======================================
// Helpers
// ======================================
const CHART_COLORS = ["#8D51FF", "#00B8DB", "#7BCE08", "#FFBB28", "#FF1F57"];

const transformToChartData = (obj) =>
  obj ? Object.entries(obj).map(([label, count]) => ({ label, count })) : [];

// ======================================
// Main Component
// ======================================
const UserDashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // ======================================
  // States
  // ======================================
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchNopel, setSearchNopel] = useState("");
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(currentYear);
  const abortControllerRef = useRef(null);

  const recordLimit = 5;
  const todayLabel = useMemo(
    () => formatDateId(new Date(), { withWeekday: true }),
    []
  );

  const availableYears = useMemo(
    () => Array.from({ length: 3 }, (_, i) => currentYear - i),
    [currentYear]
  );

  // ======================================
  // Derived Data
  // ======================================
  const {
    stats = {},
    approvedTasks = [],
    approvedTotal = 0,
    stage = "-",
  } = dashboardData || {};

  const totalPages = useMemo(
    () => Math.ceil(approvedTotal / recordLimit) || 1,
    [approvedTotal, recordLimit]
  );

  // ======================================
  // Fetch Function
  // ======================================
  const fetchDashboardData = useCallback(
    async (pageNumber = 1) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);
        const { data } = await axiosInstance.get(
          API_PATHS.TASK.GET_USER_DASHBOARD_DATA,
          {
            params: {
              page: pageNumber,
              limit: recordLimit,
              nopel: searchNopel || undefined,
              year: yearFilter || undefined,
            },
            signal: controller.signal,
          }
        );

        setDashboardData(data ?? {});
        setPage(pageNumber);
      } catch (error) {
        if (
          !["CanceledError", "AbortError", "ERR_CANCELED"].includes(
            error?.name || error?.code
          )
        ) {
          console.error("Error fetching user dashboard:", error);
          toast.error("Gagal memuat data dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [recordLimit, searchNopel, yearFilter]
  );

  // ======================================
  // Effects
  // ======================================
  useEffect(() => {
    fetchDashboardData(1);
    return () => abortControllerRef.current?.abort();
  }, [fetchDashboardData]);

  // ======================================
  // Render
  // ======================================
  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="min-h-screen ">
        {/* Header */}
        <header className="my-6 px-3 md:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Selamat datang, {user?.name}
              </h1>
              <p className="text-sm text-gray-500">{todayLabel}</p>
              <span className="inline-block mt-2 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Tahap: {String(stage).toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">
                Tahun:
              </label>
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  fetchDashboardData(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer hover:border-indigo-400"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                <option value="">Semua Tahun</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <section className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <InfoCard
              label="Total Permohonan"
              value={stats.totalTasks ?? 0}
              color="primary"
            />
            <InfoCard
              label="Dikirim"
              value={stats.totalApproved ?? 0}
              color="green"
            />
            <InfoCard
              label="Ditolak"
              value={stats.totalRejected ?? 0}
              color="red"
            />
            <InfoCard
              label="Diproses"
              value={stats.totalPending ?? 0}
              color="yellow"
            />
          </section>
        </header>

        {/* Charts */}
        <main className="px-3 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Suspense fallback={<CardSkeleton />}>
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5">
              <h2 className="text-lg font-medium mb-4 text-slate-800">
                Permohonan Per Jenis
              </h2>
              {stats.tasksPerTitle ? (
                <CustomBarChart
                  data={transformToChartData(stats.tasksPerTitle)}
                  colors={CHART_COLORS}
                />
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data untuk ditampilkan.
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5">
              <h2 className="text-lg font-medium mb-4 text-slate-800">
                Permohonan Per Kecamatan
              </h2>
              {stats.tasksPerSubdistrict ? (
                <CustomBarChart
                  data={transformToChartData(stats.tasksPerSubdistrict)}
                  colors={CHART_COLORS}
                />
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data untuk ditampilkan.
                </div>
              )}
            </section>
          </Suspense>

          {/* Approved Task List */}
          <Suspense fallback={<TableSkeleton />}>
            <section className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 md:col-span-2 relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-800">
                  Permohonan Disetujui
                </h2>
                <button
                  onClick={() => navigate("/user/tasks")}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Lihat Semua
                  <LuArrowRight className="text-base" />
                </button>
              </div>

              {approvedTasks.length > 0 ? (
                <>
                  <TaskListTable
                    tableData={approvedTasks}
                    page={page}
                    limit={recordLimit}
                    searchNopel={searchNopel}
                    onSearchNopel={(val) => {
                      setSearchNopel(val);
                      fetchDashboardData(1);
                    }}
                  />
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    disabled={isLoading}
                    onPageChange={(newPage) => fetchDashboardData(newPage)}
                  />
                </>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data disetujui pada tahap ini.
                </div>
              )}
            </section>
          </Suspense>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
