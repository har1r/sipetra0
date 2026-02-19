import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

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

/* ===== Small stat card ===== */
const StatCard = ({ title, value, tone = "indigo" }) => {
  const color =
    tone === "green"
      ? "bg-green-50 text-green-700"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "yellow"
      ? "bg-yellow-50 text-yellow-700"
      : "bg-indigo-50 text-indigo-700";

  return (
    <div className={`rounded-lg p-3 text-center shadow-sm ${color}`}>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
};

/* ===== User performance row ===== */
const UserRow = ({ user }) => (
  <tr className="border-b text-sm">
    <td className="py-2">{user.userName}</td>
    <td>{user.userRole}</td>
    <td className="text-center">{nf.format(user.totalTasks)}</td>
    <td className="text-center text-green-700">{user.approvedCount}</td>
    <td className="text-center text-red-600">{user.rejectedCount}</td>
    <td className="text-center text-yellow-700">{user.pendingCount}</td>
    <td className="text-center">{user.avgProcessingTimeDays} hr</td>
    <td className="text-center">{user.onTimeRate}%</td>
  </tr>
);

/* ===== Stage KPI section ===== */
const StageSection = ({ stage, users }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
    <h3 className="mb-3 text-lg font-semibold capitalize text-slate-900">
      {toLabel(stage)}
    </h3>
    {users.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="py-2 text-left">Nama</th>
              <th className="text-left">Peran</th>
              <th className="text-center">Total</th>
              <th className="text-center">Disetujui</th>
              <th className="text-center">Ditolak</th>
              <th className="text-center">Menunggu</th>
              <th className="text-center">Rata-rata</th>
              <th className="text-center">Tepat Waktu</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.userId} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-slate-500 italic">Belum ada data pengguna.</p>
    )}
  </div>
);

/* ===== Main page ===== */
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
      if (err?.name !== "CanceledError") {
        toast.error("Gagal memuat data performa");
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
            Pantau efisiensi tiap tahap dan operator.
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
        <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            title="Total Berkas"
            value={nf.format(summary.totalTasks)}
          />
          <StatCard
            title="Rata-rata Selesai"
            value={`${summary.avgDaysUntilSent} hari`}
            tone={summary.avgDaysUntilSent <= 7 ? "green" : "red"}
          />
          <StatCard
            title="Sesuai Target"
            value={summary.withinTarget ? "✅ Ya" : "⚠️ Tidak"}
            tone={summary.withinTarget ? "green" : "red"}
          />
        </div>
      )}

      {/* KPI per Stage */}
      <div className="space-y-6">
        {kpiPerStage.map((s) => (
          <StageSection key={s.stage} stage={s.stage} users={s.users} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default TeamPerformance;
