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

// Palet
const COLORS = ["#8D51FF", "#00B8DB", "#7BCE08", "#FFBB28", "#FF1F57"];

const mapToBarData = (obj) =>
  obj ? Object.entries(obj).map(([title, count]) => ({ title, count })) : []; // NEW

// Utils
// const formatTodayID = () =>
//   new Intl.DateTimeFormat("id-ID", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   }).format(new Date());

// ============================= //
// Komponen Dashboard (Admin)    //
// ============================= //
const Dashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // State utama
  const [dashboardData, setDashboardData] = useState(null);
  const [weeklyTaskData, setWeeklyTaskData] = useState([]);
  const [loading, setLoading] = useState(true); // CHANGED: satu-satunya sumber loading untuk card Overdue

  // Pagination Overdue (mengikuti backend)
  const [page, setPage] = useState(1); 
  const limit = 5;
  const [nopel, setNopel] = useState("");

  const todayStr = useMemo(() => formatDateId(new Date, { withWeekday: true}), []);

  const {
    barChartTitleData,
    barChartSubdistrictData,
    overdueTasks,
    respPage,
    respLimit,
    totalPages,
  } = useMemo(() => {
    const stats = dashboardData?.stats;
    const barChartTitleData = mapToBarData(stats?.tasksPerTitle); 
    const barChartSubdistrictData = mapToBarData(stats?.tasksPerSubdistrict); 

    // Ambil meta pagination dari backend; fallback ke local state
    const respPage = Number(dashboardData?.page ?? page); 
    const respLimit = Number(dashboardData?.limit ?? limit); 

    const overdueTasks = Array.isArray(dashboardData?.overdueTasks)
      ? dashboardData.overdueTasks
      : []; 

    // Total pages dari overdueTotal
    const overdueTotal =
      typeof dashboardData?.overdueTotal === "number"
        ? dashboardData.overdueTotal
        : null;
    const rowsLen = overdueTasks.length;
    const totalPages =
      overdueTotal !== null
        ? Math.max(1, Math.ceil(overdueTotal / respLimit))
        : respPage + (rowsLen === respLimit ? 1 : 0); // fallback jika total tidak tersedia

    return {
      barChartTitleData,
      barChartSubdistrictData,
      overdueTasks,
      respPage,
      respLimit,
      totalPages,
    };
  }, [dashboardData, page, limit]); // CHANGED

  const onSeeMore = useCallback(() => navigate("/admin/tasks"), [navigate]);

  // AbortController ref
  const ctrlRef = useRef(null);

  const fetchDashboardData = useCallback(
    async ({ p = page, withWeekly = false } = {}) => {
      // batalkan request sebelumnya
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      try {
        setLoading(true);

        const dashReq = axiosInstance.get(API_PATHS.TASK.GET_DASHBOARD_DATA, {
          params: {
            page: p,
            limit,
            nopel: nopel || undefined, // NEW: kirim filter NOPel bila ada
          },
          signal: ctrl.signal,
        });

        if (withWeekly) {
          const weeklyReq = axiosInstance.get(
            API_PATHS.TASK.GET_TASKS_WEEKLY_STATS,
            { signal: ctrl.signal }
          );

          const [dashRes, weeklyRes] = await Promise.all([dashReq, weeklyReq]);
          
          setDashboardData(dashRes?.data ?? null);
          setWeeklyTaskData(weeklyRes?.data ?? []);
        } else {
          const dashRes = await dashReq;
          setDashboardData(dashRes?.data ?? null);
        }
      } catch (err) {
        if (
          err?.name !== "CanceledError" &&
          err?.name !== "AbortError" &&
          err?.code !== "ERR_CANCELED"
        ) {
          console.error("Dashboard load error:", err);
          toast.error("Gagal memuat dashboard");
        }
      } finally {
        setLoading(false);
      }
    },
    [page, limit, nopel]
  );

  // mount: parallel (dashboard + weekly)
  useEffect(() => {
    fetchDashboardData({ p: 1, withWeekly: true });
    return () => ctrlRef.current?.abort();
  }, []);

  // ganti halaman / filter NOPel: hanya dashboard
  useEffect(() => {
    if (page !== 1) fetchDashboardData({ p: page, withWeekly: false });
    else if (dashboardData) fetchDashboardData({ p: 1, withWeekly: false });
  }, [page, nopel]); // ⬅️ tambahkan nopel agar refetch saat search

  return (
    <DashboardLayout activeMenu="Dashboard">
      <header
        className="card my-5"
        role="banner"
        aria-labelledby="dashboard-title"
      >
        <div className="flex flex-col gap-1.5">
          <h1
            id="dashboard-title"
            className="text-xl md:text-2xl font-semibold text-slate-900"
          >
            Selamat datang, {user?.name}
          </h1>
          <p className="text-xs md:text-[13px] text-gray-500">{todayStr}</p>
        </div>

        {/* Summary cards */}
        <section
          id="stats"
          aria-labelledby="stats-title"
          className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
        >
          <InfoCard
            id="stat-total"
            label="Total Permohonan"
            value={dashboardData?.stats?.totalTasks ?? 0}
            color="primary"
          />
          <InfoCard
            id="stat-approved"
            label="Permohonan Dikirim"
            value={dashboardData?.stats?.totalApproved ?? 0}
            color="green"
          />
          <InfoCard
            id="stat-rejected"
            label="Permohonan Ditolak"
            value={dashboardData?.stats?.totalRejected ?? 0}
            color="red"
          />
          <InfoCard
            id="stat-pending"
            label="Permohonan Diproses"
            value={dashboardData?.stats?.totalPending ?? 0}
            color="yellow"
          />
        </section>
      </header>

      {/* Charts & Table */}
      <main
        role="main"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 md:my-6"
      >
        {/* Satukan chart dalam satu Suspense seperti UserDashboard */}
        <Suspense fallback={<CardSkeleton />}>
          {/* Tasks per Title */}
          <section
            id="chart-title"
            aria-labelledby="chart-title-heading"
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium" id="chart-title-heading">
                Permohonan Per Jenis
              </h2>
            </div>
            {barChartTitleData.length > 0 ? (
              <CustomBarChart
                id="bar-title"
                data={barChartTitleData}
                colors={COLORS}
              />
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data untuk ditampilkan.
              </div>
            )}
          </section>

          {/* Tasks per Subdistrict */}
          <section
            id="chart-subdistrict"
            aria-labelledby="chart-subdistrict-heading"
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-base font-medium"
                id="chart-subdistrict-heading"
              >
                Permohonan Per Kecamatan
              </h2>
            </div>
            {barChartSubdistrictData.length > 0 ? (
              <CustomBarChart
                id="bar-subdistrict"
                data={barChartSubdistrictData}
                colors={COLORS}
              />
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data untuk ditampilkan.
              </div>
            )}
          </section>
        </Suspense>

        {/* Task Growth */}
        <Suspense fallback={<CardSkeleton height={320} />}>
          <section
            id="chart-growth"
            aria-labelledby="chart-growth-heading"
            className="card md:col-span-2"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium" id="chart-growth-heading">
                Pertumbuhan Permohonan (12 Minggu Terakhir)
              </h2>
            </div>
            {weeklyTaskData.length > 0 ? (
              <CustomGraphChart
                id="line-growth"
                data={weeklyTaskData}
                showLegend={true}
              />
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data untuk ditampilkan.
              </div>
            )}
          </section>
        </Suspense>

        {/* Overdue Tasks dengan overlay loading & pagination */}
        <Suspense fallback={<TableSkeleton />}>
          <section
            id="overdue"
            aria-labelledby="overdue-heading"
            className="md:col-span-2"
          >
            <div className="card relative min-h-[320px]">
              {/* NEW: jaga tinggi & overlay */}
              {loading && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium" id="overdue-heading">
                  Permohonan Jatuh Tempo (2 Minggu Sejak Diinput)
                </h2>
                <button
                  type="button"
                  className="card-btn"
                  onClick={onSeeMore}
                  aria-label="Lihat semua tugas"
                >
                  See All <LuArrowRight className="text-base" aria-hidden />
                </button>
              </div>
              {overdueTasks.length > 0 ? (
                <>
                  <TaskListTable
                    tableData={overdueTasks}
                    page={respPage}
                    limit={respLimit}
                    // === Search by NOPel (frontend) ===
                    searchNopel={nopel}
                    onSearchNopel={(q) => {
                      setPage(1);
                      setNopel(q || "");
                    }}
                  />
                  <Pagination
                    page={respPage}
                    totalPages={totalPages}
                    disabled={loading}
                    onPageChange={(next) => {
                      const clamped = Math.max(1, next);
                      if (clamped !== page) setPage(clamped);
                    }}
                  />
                </>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  Belum ada data jatuh tempo.
                </div>
              )}
            </div>
          </section>
        </Suspense>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;