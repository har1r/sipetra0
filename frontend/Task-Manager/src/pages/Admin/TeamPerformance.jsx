import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

/* ==================== Helper & formatter ==================== */
const STAGE_LABEL = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  selesai: "Selesai",
};
const toLabel = (s) => STAGE_LABEL[s] ?? s;
const nf = new Intl.NumberFormat("id-ID");

/* ==================== Small UI ==================== */
const StatCard = ({ title, value, desc, tone = "indigo" }) => {
  const color =
    tone === "green"
      ? "bg-green-50 text-green-800"
      : tone === "red"
      ? "bg-red-50 text-red-800"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-800"
      : "bg-indigo-50 text-indigo-800";
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-lg font-bold">{value}</p>
      {desc && <p className="text-xs opacity-80">{desc}</p>}
    </div>
  );
};

/* ==================== KPI Table per Stage ==================== */
const StageKpiCard = ({ stage, data }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <h3 className="mb-3 text-lg font-semibold capitalize text-slate-900">
        {toLabel(stage)}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
        <StatCard title="Total Berkas" value={nf.format(data.totalTasks)} />
        <StatCard
          title="Disetujui"
          tone="green"
          value={nf.format(data.approvedCount)}
        />
        <StatCard
          title="Ditolak"
          tone="red"
          value={nf.format(data.rejectedCount)}
        />
        <StatCard
          title="Menunggu"
          tone="yellow"
          value={nf.format(data.pendingCount)}
        />
        <StatCard
          title="Tingkat Penyelesaian"
          value={`${data.throughputRate}%`}
        />
        <StatCard
          title="Tingkat Penolakan"
          tone="red"
          value={`${data.rejectionRate}%`}
        />
        <StatCard
          title="Ketepatan Waktu"
          tone="green"
          value={`${data.onTimeRate}%`}
        />
        <StatCard
          title="Rata-rata Waktu Proses"
          value={`${data.avgProcessingTimeDays} hari`}
        />
      </div>
    </div>
  );
};

/* ==================== Main Page ==================== */
const TeamPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [kpiPerStage, setKpiPerStage] = useState([]);
  const ctrlRef = useRef(null);

  const fetchPerformance = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    try {
      setLoading(true);
      const res = await axiosInstance.get(API_PATHS.TASK.TEAM_PERFORMANCE, {
        signal: ctrl.signal,
      });

      const data = res?.data;
      setSummary(data?.summary || null);
      setKpiPerStage(data?.kpiPerStage || []);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error(
          err?.response?.data?.message || "Gagal memuat data performa"
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
    return () => ctrlRef.current?.abort();
  }, [fetchPerformance]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="Performa Tim">
        <div className="min-h-[60vh] grid place-items-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Performa Tim">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performa Tim</h2>
          <p className="mt-1 text-sm text-slate-600">
            Rekap efisiensi, ketepatan waktu, dan kualitas kerja setiap tahap
            proses persetujuan.
          </p>
        </div>
        <button
          onClick={fetchPerformance}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Muat Ulang
        </button>
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total Berkas"
            value={nf.format(summary.totalTasks)}
            desc="Jumlah keseluruhan berkas yang diproses"
          />
          <StatCard
            title="Tingkat Kepatuhan"
            tone="green"
            value={`${summary.complianceRate}%`}
            desc="Kepatuhan terhadap urutan dan SOP proses"
          />
        </div>
      )}

      {/* KPI per Stage */}
      {kpiPerStage.length > 0 ? (
        <div className="space-y-6">
          {kpiPerStage.map((s) => (
            <StageKpiCard key={s.stage} stage={s.stage} data={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          Belum ada data performa untuk ditampilkan.
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamPerformance;

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   memo,
// } from "react";
// import DashboardLayout from "../../components/layouts/DashboardLayout";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import toast from "react-hot-toast";
// import LoadingSpinner from "../../components/ui/LoadingSpinner";

// /* =========================== Helpers & formatters =========================== */
// const STAGE_LABEL = {
//   diinput: "Diinput",
//   ditata: "Ditata",
//   diteliti: "Diteliti",
//   diarsipkan: "Diarsipkan",
//   dikirim: "Dikirim",
//   selesai: "Selesai",
// };
// const toLabel = (s) =>
//   STAGE_LABEL[s] ??
//   String(s || "")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (c) => c.toUpperCase());

// const pct = (val, total) => (total > 0 ? Math.round((val / total) * 100) : 0);
// const nf = new Intl.NumberFormat("id-ID");

// const titleCase = (s = "") =>
//   String(s)
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (c) => c.toUpperCase());

// /* ================================ Small UI ================================= */
// const StatPill = memo(function StatPill({ tone = "indigo", label, value }) {
//   const toneCls =
//     tone === "green"
//       ? "bg-green-50 text-green-800"
//       : tone === "red"
//       ? "bg-red-50 text-red-800"
//       : tone === "yellow"
//       ? "bg-yellow-50 text-yellow-800"
//       : "bg-indigo-50 text-indigo-800";
//   return (
//     <span
//       className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneCls}`}
//     >
//       {label}: <span className="ml-1 font-semibold">{value}</span>
//     </span>
//   );
// });

// const SegmentedProgress = memo(function SegmentedProgress({
//   approved = 0,
//   rejected = 0,
//   pending = 0,
// }) {
//   const total = approved + rejected + pending;
//   const a = pct(approved, total);
//   const r = pct(rejected, total);
//   const p = pct(pending, total);
//   return (
//     <div>
//       <div className="flex h-2 w-full overflow-hidden rounded-full ring-1 ring-slate-200">
//         <div
//           className="bg-green-500"
//           style={{ width: `${a}%` }}
//           aria-label={`Approved ${a}%`}
//         />
//         <div
//           className="bg-yellow-400"
//           style={{ width: `${p}%` }}
//           aria-label={`Pending ${p}%`}
//         />
//         <div
//           className="bg-red-500"
//           style={{ width: `${r}%` }}
//           aria-label={`Rejected ${r}%`}
//         />
//       </div>
//       <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate-600">
//         <StatPill
//           tone="green"
//           label="Disetujui"
//           value={`${approved} (${a}%)`}
//         />
//         <StatPill tone="yellow" label="Menunggu" value={`${pending} (${p}%)`} />
//         <StatPill tone="red" label="Ditolak" value={`${rejected} (${r}%)`} />
//       </div>
//     </div>
//   );
// });

// const UserRow = memo(function UserRow({
//   name,
//   approved = 0,
//   rejected = 0,
//   pending = 0,
// }) {
//   return (
//     <div className="flex flex-wrap items-center gap-2 text-sm">
//       <span className="w-40 shrink-0 font-medium text-slate-800">{name}</span>
//       <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
//         ✔ {approved}
//       </span>
//       <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
//         ⏳ {pending}
//       </span>
//       <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
//         ✖ {rejected}
//       </span>
//     </div>
//   );
// });

// /* ========================== Title panel per stage ========================== */
// /** Robust terhadap 2 bentuk respons:
//  *  - Baru: approved.count (jumlah dokumen), approved.users = [{userId, name, role, count}]
//  *  - Lama: approved.users = array nama (duplikat), tanpa count
//  */
// const TitlePanel = memo(function TitlePanel({ title, stats }) {
//   const processed = useMemo(() => {
//     const byName = new Map();

//     // Helper: bump count dengan nilai 'count' kalau ada, jika tidak 1
//     const bump = (list = [], key) => {
//       for (const u of list) {
//         const uname = u?.name || "Tidak diketahui";
//         const inc = Number.isFinite(u?.count) ? Number(u.count) : 1;
//         const cur = byName.get(uname) || {
//           approved: 0,
//           rejected: 0,
//           pending: 0,
//         };
//         cur[key] += inc;
//         byName.set(uname, cur);
//       }
//     };

//     bump(stats?.approved?.users, "approved");
//     bump(stats?.rejected?.users, "rejected");
//     bump(stats?.pending?.users, "pending");

//     const users = Array.from(byName.entries()).map(([name, v]) => ({
//       name,
//       ...v,
//     }));
//     users.sort(
//       (a, b) =>
//         b.approved +
//           b.rejected +
//           b.pending -
//           (a.approved + a.rejected + a.pending) || a.name.localeCompare(b.name)
//     );

//     const approvedDocs = Number(
//       stats?.approved?.count ?? stats?.approved?.users?.length ?? 0
//     );
//     const rejectedDocs = Number(
//       stats?.rejected?.count ?? stats?.rejected?.users?.length ?? 0
//     );
//     const pendingDocs = Number(
//       stats?.pending?.count ?? stats?.pending?.users?.length ?? 0
//     );
//     const totalDocs = approvedDocs + rejectedDocs + pendingDocs;

//     return {
//       users,
//       approvedDocs,
//       rejectedDocs,
//       pendingDocs,
//       totalDocs,
//     };
//   }, [stats]);

//   return (
//     <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:shadow-sm">
//       <div className="mb-3 flex items-center justify-between gap-3">
//         <h4 className="text-base font-semibold text-slate-800 capitalize">
//           {titleCase(title)}
//         </h4>
//         <StatPill label="Total Dokumen" value={processed.totalDocs} />
//       </div>

//       <SegmentedProgress
//         approved={processed.approvedDocs}
//         rejected={processed.rejectedDocs}
//         pending={processed.pendingDocs}
//       />

//       <div className="mt-3 grid gap-1.5">
//         {processed.users.length ? (
//           processed.users.map((u) => (
//             <UserRow
//               key={u.name}
//               name={u.name}
//               approved={u.approved}
//               rejected={u.rejected}
//               pending={u.pending}
//             />
//           ))
//         ) : (
//           <p className="text-sm italic text-slate-500">
//             Belum ada kontributor tercatat pada title ini.
//           </p>
//         )}
//       </div>
//     </div>
//   );
// });

// /* =========================== Stage recap (atas) =========================== */
// const StageCard = memo(function StageCard({ stage, titles }) {
//   // Rekap yang benar: gunakan approved.count (bukan length users)
//   const recap = useMemo(() => {
//     let approved = 0,
//       rejected = 0,
//       pending = 0,
//       total = 0;

//     for (const stats of Object.values(titles || {})) {
//       const a = Number(stats?.approved?.count ?? 0);
//       const r = Number(stats?.rejected?.count ?? 0);
//       const p = Number(stats?.pending?.count ?? 0);
//       approved += a;
//       rejected += r;
//       pending += p;
//       total += a + r + p;
//     }
//     return { approved, rejected, pending, total };
//   }, [titles]);

//   return (
//     <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
//       <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
//         <h3 className="text-xl font-semibold capitalize text-slate-900">
//           {toLabel(stage)}
//         </h3>
//         <div className="flex flex-wrap items-center gap-2">
//           <StatPill tone="indigo" label="Total Dokumen" value={recap.total} />
//           <StatPill tone="green" label="✔ Disetujui" value={recap.approved} />
//           <StatPill tone="yellow" label="⏳ Menunggu" value={recap.pending} />
//           <StatPill tone="red" label="✖ Ditolak" value={recap.rejected} />
//         </div>
//       </div>

//       <SegmentedProgress
//         approved={recap.approved}
//         rejected={recap.rejected}
//         pending={recap.pending}
//       />

//       <div className="mt-6 grid gap-4 sm:grid-cols-2">
//         {Object.entries(titles || {}).map(([title, stats]) => (
//           <TitlePanel key={title} title={title} stats={stats} />
//         ))}
//       </div>
//     </section>
//   );
// });

// /* ============== Performa (avgMs / avgHours / avgDays) per stage ============== */
// const PerfStageCard = memo(function PerfStageCard({ stage, byUser = [] }) {
//   return (
//     <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
//       <div className="mb-4 flex items-center justify-between">
//         <h3 className="text-lg font-semibold capitalize text-slate-900">
//           {toLabel(stage)}
//         </h3>
//         <span className="text-xs text-slate-500">{byUser.length} pengguna</span>
//       </div>

//       {byUser.length === 0 ? (
//         <p className="text-sm text-slate-500 italic">
//           Belum ada data performa pada stage ini.
//         </p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-sm">
//             <thead className="sticky top-0 bg-slate-100/80 backdrop-blur text-slate-800">
//               <tr>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   User
//                 </th>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   Role
//                 </th>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   Sampel
//                 </th>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   avgMs
//                 </th>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   Rata-rata (jam)
//                 </th>
//                 <th className="border-b px-3 py-2 text-left font-semibold">
//                   Rata-rata (hari)
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//               {byUser.map((u) => (
//                 <tr
//                   key={String(u.userId)}
//                   className="transition-colors hover:bg-indigo-50/40"
//                 >
//                   <td className="border-b px-3 py-2">{u.name || "-"}</td>
//                   <td className="border-b px-3 py-2">
//                     <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
//                       {u.role || "-"}
//                     </span>
//                   </td>
//                   <td className="border-b px-3 py-2">
//                     {nf.format(u?.count || 0)}
//                   </td>
//                   <td className="border-b px-3 py-2">
//                     {nf.format(u?.avgMs || 0)}
//                   </td>
//                   <td className="border-b px-3 py-2">
//                     {nf.format(u?.avgHours || 0)}
//                   </td>
//                   <td className="border-b px-3 py-2">
//                     {nf.format(u?.avgDays || 0)}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </section>
//   );
// });

// /* ================================== Page ================================== */
// const TeamPerformance = () => {
//   const [loading, setLoading] = useState(true);
//   const [statsPerStage, setStatsPerStage] = useState({});
//   const [performancePerStage, setPerformancePerStage] = useState(null);
//   const ctrlRef = useRef(null);

//   const fetchStats = useCallback(async () => {
//     ctrlRef.current?.abort();
//     const ctrl = new AbortController();
//     ctrlRef.current = ctrl;

//     try {
//       setLoading(true);
//       const res = await axiosInstance.get(API_PATHS.TASK.TEAM_PERFORMANCE, {
//         signal: ctrl.signal,
//       });
//       setStatsPerStage(res?.data?.statsPerStage || {});
//       setPerformancePerStage(res?.data?.performancePerStage || null);
//     } catch (err) {
//       if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
//         const msg = err?.response?.data?.message || "Gagal memuat performa tim";
//         toast.error(msg);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStats();
//     return () => ctrlRef.current?.abort();
//   }, [fetchStats]);

//   const hasStageStats = Object.keys(statsPerStage || {}).length > 0;
//   const perfEntries = useMemo(
//     () => (performancePerStage ? Object.entries(performancePerStage) : []),
//     [performancePerStage]
//   );

//   if (loading) {
//     return (
//       <DashboardLayout activeMenu="Team Performance">
//         <div className="min-h-[50vh] grid place-items-center">
//           <LoadingSpinner />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout activeMenu="Team Performance">
//       {/* Header */}
//       <div className="mb-6 flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl font-bold text-slate-900">Performa Tim</h2>
//           <p className="mt-1 text-sm text-slate-600">
//             Rekap jumlah dokumen <span className="font-medium">approved</span>{" "}
//             di setiap stage per jenis, dan rata-rata waktu perpindahan ke stage
//             berikutnya per pengguna.
//           </p>
//         </div>
//         <button
//           type="button"
//           onClick={fetchStats}
//           className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
//           title="Muat ulang"
//         >
//           Muat Ulang
//         </button>
//       </div>

//       {/* Rekap status per Stage → Title */}
//       {!hasStageStats ? (
//         <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
//           Belum ada data performa untuk ditampilkan.
//         </div>
//       ) : (
//         <div className="space-y-8">
//           {Object.entries(statsPerStage).map(([stage, titles]) => (
//             <StageCard key={stage} stage={stage} titles={titles} />
//           ))}
//         </div>
//       )}

//       {/* Performa pengguna per stage */}
//       {perfEntries.length > 0 && (
//         <>
//           <h3 className="mt-10 mb-4 text-lg font-semibold text-slate-900">
//             Performa Pengguna per Stage (rata-rata waktu ke stage berikutnya)
//           </h3>
//           <div className="space-y-6">
//             {perfEntries.map(([stage, payload]) => (
//               <PerfStageCard
//                 key={stage}
//                 stage={stage}
//                 byUser={payload?.byUser || []}
//               />
//             ))}
//           </div>
//         </>
//       )}
//     </DashboardLayout>
//   );
// };

// export default TeamPerformance;
