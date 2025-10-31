import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStageProgress from "../../components/cards/TaskStageProgress";
import { formatDateId } from "../../utils/formatDateId";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const stageLabel = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

// Helper fungsi
const formatTitle = (str = "") =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTimeId = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
};

const StatusChip = ({ status }) => {
  const baseClass =
    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium";
  if (status === "approved")
    return (
      <span className={`${baseClass} bg-emerald-50 text-emerald-700`}>
        ✔️ Disetujui
      </span>
    );
  if (status === "rejected")
    return (
      <span className={`${baseClass} bg-rose-50 text-rose-700`}>
        ❌ Ditolak
      </span>
    );
  return (
    <span className={`${baseClass} bg-amber-50 text-amber-700`}>
      ⏳ Menunggu
    </span>
  );
};

const InfoRow = ({ label, children }) => (
  <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-2 items-start text-sm">
    <span className="font-medium text-slate-700">{label}</span>
    <span className="text-slate-900 before:content-[':'] before:mr-1 before:text-slate-400 break-words min-w-0">
      {children ?? "-"}
    </span>
  </div>
);

const SectionCard = ({
  title,
  children,
  className = "",
  bodyClassName = "",
}) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    {title && (
      <header className="border-b border-slate-200 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </header>
    )}
    <div className={`p-5 ${bodyClassName}`}>{children}</div>
  </section>
);

const TaskDetail = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axiosInstance.get(
          API_PATHS.TASK.GET_TASK_BY_ID(id),
          {
            signal: controller.signal,
            headers,
          }
        );

        setTask(response.data || null);
      } catch (error) {
        if (error?.response?.status === 401) {
          console.warn("Akses ditolak: Harap login terlebih dahulu.");
        } else if (error?.name !== "CanceledError") {
          console.error("Gagal mengambil data task:", error);
        }
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
    return () => abortRef.current?.abort();
  }, [id]);

  const approvals = useMemo(() => task?.approvals ?? [], [task]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              Task tidak ditemukan
            </h2>
            <p className="text-sm text-slate-600">
              Pastikan tautan benar atau hubungi admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    mainData = {},
    additionalData = [],
    title,
    createdAt,
    currentStage,
  } = task;

  return (
    <DashboardLayout>
      <main className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          {/* HEADER */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Detail Permohonan
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Dibuat:{" "}
                  <span className="font-medium text-slate-700">
                    {formatDateId(createdAt)}
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Tahap:{" "}
                {stageLabel[String(currentStage)?.toLowerCase()] ||
                  formatTitle(currentStage)}
              </span>
            </div>
          </section>

          {/* PROGRESS & DETAIL */}
          <section>
            <div className="grid md:grid-cols-[minmax(0,240px)_1fr] gap-6">
              <SectionCard
                title="Progress Tahapan"
                className="self-start md:sticky md:top-4"
              >
                <div className="w-full max-w-[220px] mx-auto">
                  <TaskStageProgress task={task} orientation="vertical" />
                </div>
              </SectionCard>

              <div className="space-y-6">
                <SectionCard title="Data Utama">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <InfoRow label="NOPEL">{mainData.nopel}</InfoRow>
                      <InfoRow label="NOP">{mainData.nop}</InfoRow>
                      <InfoRow label="Nama Lama">{mainData.oldName}</InfoRow>
                      <InfoRow label="Alamat">{mainData.address}</InfoRow>
                    </div>
                    <div className="space-y-2">
                      <InfoRow label="Kelurahan">{mainData.village}</InfoRow>
                      <InfoRow label="Kecamatan">
                        {mainData.subdistrict}
                      </InfoRow>
                      <InfoRow label="Permohonan">{formatTitle(title)}</InfoRow>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Data Tambahan">
                  <div className="grid gap-4">
                    {additionalData.length > 0 ? (
                      additionalData.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm"
                        >
                          <div className="grid sm:grid-cols-2 gap-2">
                            <InfoRow label="Nama Baru">{item.newName}</InfoRow>
                            <InfoRow label="Nomor Sertifikat">
                              {item.certificate || "-"}
                            </InfoRow>
                            <InfoRow label="Luas Tanah">
                              {item.landWide ? `${item.landWide} m²` : "-"}
                            </InfoRow>
                            <InfoRow label="Luas Bangunan">
                              {item.buildingWide
                                ? `${item.buildingWide} m²`
                                : "-"}
                            </InfoRow>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Tidak ada data tambahan.
                      </p>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Riwayat Persetujuan" bodyClassName="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-100 text-slate-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Tahapan</th>
                          <th className="px-3 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-left">Waktu</th>
                          <th className="px-3 py-2 text-left">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
                        {approvals.length > 0 ? (
                          approvals.map((approval, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/40">
                              <td className="px-3 py-2">
                                {stageLabel[approval.stage] ||
                                  formatTitle(approval.stage)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <StatusChip status={approval.status} />
                              </td>
                              <td className="px-3 py-2">
                                {approval.approvedAt
                                  ? formatDateTimeId(approval.approvedAt)
                                  : "-"}
                              </td>
                              <td
                                className="px-3 py-2"
                                title={approval.note || "-"}
                              >
                                {approval.note || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-4 text-center italic text-slate-500"
                            >
                              Belum ada data approval.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TaskDetail;
