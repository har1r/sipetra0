import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
  useRef,
} from "react";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import InfoCard from "../../components/cards/InfoCard";
const CustomBarChart = React.lazy(() =>
  import("../../components/charts/CustomBarChart")
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

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE08", "#FFBB28", "#FF1F57"];

const mapToBarData = (obj) =>
  obj ? Object.entries(obj).map(([title, count]) => ({ title, count })) : [];

// const formatTodayID = () =>
//   new Intl.DateTimeFormat("id-ID", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   }).format(new Date());

const UserDashboard = () => {
  UseUserAuth();
  const { user } = useContext(UserContext);

  // state utama
  const [userDashboardData, setUserDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // pagination & search (mengikuti struktur Dashboard admin)
  const [page, setPage] = useState(1);
  const limit = 5;
  const [nopel, setNopel] = useState(""); // ⬅️ query NOPel

  const todayStr = useMemo(() => formatDateId(new Date, { withWeekday: true}), []);

  const {
    barChartTitleData,
    barChartSubdistrictData,
    approvedTasks,
    respPage,
    respLimit,
    totalPages,
    stageBadge,
    stage,
  } = useMemo(() => {
    const stats = userDashboardData?.stats;
    const barChartTitleData = mapToBarData(stats?.tasksPerTitle);
    const barChartSubdistrictData = mapToBarData(stats?.tasksPerSubdistrict);

    const respPage = Number(userDashboardData?.page ?? page);
    const respLimit = Number(userDashboardData?.limit ?? limit);

    const approvedTasks = Array.isArray(userDashboardData?.approvedTasks)
      ? userDashboardData.approvedTasks
      : [];

    const approvedTotal =
      typeof userDashboardData?.approvedTotal === "number"
        ? userDashboardData.approvedTotal
        : null;

    const totalPages =
      approvedTotal !== null
        ? Math.max(1, Math.ceil(approvedTotal / respLimit))
        : respPage + (approvedTasks.length === respLimit ? 1 : 0);

    const stage = userDashboardData?.stage || "-";
    const stageBadge = String(stage).toUpperCase();

    return {
      barChartTitleData,
      barChartSubdistrictData,
      respPage,
      respLimit,
      totalPages,
      stageBadge,
      approvedTasks,
      stage,
    };
  }, [userDashboardData, page, limit]);

  // fetcher + abort (selaras Dashboard admin)
  const ctrlRef = useRef(null);

  const fetchUserDashboardData = useCallback(
    async (p = page) => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      try {
        setLoading(true);

        const userDashReq = await axiosInstance.get(
          API_PATHS.TASK.GET_USER_DASHBOARD_DATA,
          {
            params: { page: p, limit, nopel: nopel || undefined }, // ⬅️ kirim nopel bila ada
            signal: ctrl.signal,
          }
        );

        setUserDashboardData(userDashReq?.data ?? null);
      } catch (err) {
        if (
          err?.name !== "CanceledError" &&
          err?.name !== "AbortError" &&
          err?.code !== "ERR_CANCELED"
        ) {
          console.error("Error fetching user dashboard:", err);
          toast.error("Gagal memuat dashboard");
        }
      } finally {
        setLoading(false);
      }
    },
    [page, limit, nopel]
  );

  // mount
  useEffect(() => {
    fetchUserDashboardData(1);
    return () => ctrlRef.current?.abort();
  }, []);

  // ganti halaman / query NOPel
  useEffect(() => {
    fetchUserDashboardData(page);
  }, [page, nopel, fetchUserDashboardData]);

  return (
    <DashboardLayout activeMenu="Dashboard">
      {/* Header */}
      <header
        className="card my-5"
        role="banner"
        aria-labelledby="user-dashboard-title"
      >
        <div className="flex flex-col gap-1.5">
          {stageBadge && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 w-fit"
              aria-label={`Tahap ${stageBadge}`}
            >
              Tahap: {stageBadge}
            </span>
          )}
          <h1
            id="user-dashboard-title"
            className="text-xl md:text-2xl font-semibold text-slate-900"
          >
            Selamat Datang, {user?.name}
          </h1>
          <p className="text-xs md:text-[13px] text-gray-500">{todayStr}</p>
        </div>

        {/* Summary cards */}
        <section
          id="user-stats"
          aria-labelledby="user-stats-title"
          className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
        >
          <InfoCard
            id="u-stat-total"
            label="Total Permohonan"
            value={userDashboardData?.stats?.totalTask ?? 0}
            color="primary"
          />
          <InfoCard
            id="u-stat-approved"
            label={`Disetujui di tahap ${stage ?? "-"}`}
            value={userDashboardData?.stats?.totalApproved ?? 0}
            color="green"
          />
          <InfoCard
            id="u-stat-rejected"
            label={`Ditolak di tahap ${stage ?? "-"}`}
            value={userDashboardData?.stats?.totalRejected ?? 0}
            color="red"
          />
          <InfoCard
            id="u-stat-pending"
            label={`Diproses di tahap ${stage ?? "-"}`}
            value={userDashboardData?.stats?.totalPending ?? 0}
            color="yellow"
          />
        </section>
      </header>

      {/* Charts & Table */}
      <main
        role="main"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4 md:my-6"
      >
        {/* Dua chart dalam satu Suspense (selaras Dashboard admin) */}
        <Suspense fallback={<CardSkeleton />}>
          <section
            id="u-chart-title"
            aria-labelledby="u-chart-title-heading"
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium" id="u-chart-title-heading">
                Permohonan per jenis
              </h2>
            </div>
            {barChartTitleData.length > 0 ? (
              <CustomBarChart
                id="u-bar-title"
                data={barChartTitleData}
                colors={COLORS}
              />
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data untuk tahap ini.
              </div>
            )}
          </section>

          <section
            id="u-chart-subdistrict"
            aria-labelledby="u-chart-subdistrict-heading"
            className="card"
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-base font-medium"
                id="u-chart-subdistrict-heading"
              >
                Permohonan per kecamatan
              </h2>
            </div>
            {barChartSubdistrictData.length > 0 ? (
              <CustomBarChart
                id="u-bar-subdistrict"
                data={barChartSubdistrictData}
                colors={COLORS}
              />
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data tahap ini.
              </div>
            )}
          </section>
        </Suspense>

        {/* Daftar approved + overlay loading + pagination + search NOPel */}
        <Suspense fallback={<TableSkeleton />}>
          <section
            id="u-recent"
            aria-labelledby="u-recent-heading"
            className="lg:col-span-2"
          >
            <div className="card relative min-h-[320px]">
              {loading && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium" id="u-recent-heading">
                  Permohonan approved
                </h2>
              </div>

              {approvedTasks.length > 0 ? (
                <>
                  <TaskListTable
                    tableData={approvedTasks}
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
                  Belum ada data diapproved pada tahap ini.
                </div>
              )}
            </div>
          </section>
        </Suspense>
      </main>
    </DashboardLayout>
  );
};

export default UserDashboard;
