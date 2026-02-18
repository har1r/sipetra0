import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStageProgress from "../../components/cards/TaskStageProgress";
import { formatDateId } from "../../utils/formatDateId";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { HiExclamationCircle, HiCheckCircle, HiXCircle, HiClock } from "react-icons/hi";

const stageLabel = {
  diinput: "Diinput",
  ditata: "Ditata",
  diteliti: "Diteliti",
  diarsipkan: "Diarsipkan",
  dikirim: "Dikirim",
  diperiksa: "Diperiksa",
  selesai: "Selesai",
};

const formatTitle = (str = "") =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTimeId = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const StatusChip = ({ status }) => {
  const baseClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider";
  
  switch (status) {
    case "approved":
      return <span className={`${baseClass} bg-emerald-50 text-emerald-700`}><HiCheckCircle /> Disetujui</span>;
    case "rejected":
      return <span className={`${baseClass} bg-rose-50 text-rose-700`}><HiXCircle /> Ditolak</span>;
    case "revised":
      return <span className={`${baseClass} bg-amber-50 text-amber-700`}><HiExclamationCircle /> Revisi</span>;
    default:
      return <span className={`${baseClass} bg-slate-50 text-slate-600`}><HiClock /> Menunggu</span>;
  }
};

const InfoRow = ({ label, children }) => (
  <div className="grid grid-cols-[120px_1fr] gap-x-2 items-start text-sm py-1">
    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider mt-1">{label}</span>
    <span className="text-slate-900 font-medium break-words">
      : {children ?? "-"}
    </span>
  </div>
);

const SectionCard = ({ title, children, className = "", bodyClassName = "" }) => (
  <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
    {title && (
      <header className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
      </header>
    )}
    <div className={`p-6 ${bodyClassName}`}>{children}</div>
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
        const response = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id), {
          signal: controller.signal,
        });
        setTask(response.data || null);
      } catch (error) {
        if (error?.name !== "CanceledError") console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
    return () => abortRef.current?.abort();
  }, [id]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50"><LoadingSpinner /></div>;
  if (!task) return <div className="p-10 text-center font-bold">Data tidak ditemukan</div>;

  const {
    mainData = {},
    additionalData = [],
    approvals = [],
    revisedHistory,
    overallStatus,
    currentStage,
    createdAt,
    title
  } = task;

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <main className="bg-slate-50 min-h-screen pb-20">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
          
          {/* ALERT REVISI */}
          {overallStatus === "revised" && revisedHistory && !revisedHistory.isResolved && (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 flex gap-4 animate-pulse">
              <HiExclamationCircle className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-black text-amber-900 uppercase text-sm tracking-tight">Perhatian: Berkas Perlu Revisi</h3>
                <p className="text-sm text-amber-800 mt-1 font-medium">
                  Catatan dari {revisedHistory.revisedBy?.name || 'Pemeriksa'}: <span className="italic font-bold">"{revisedHistory.revisedNote}"</span>
                </p>
                <p className="text-[10px] text-amber-600 mt-2 font-bold uppercase">Waktu: {formatDateTimeId(revisedHistory.revisedAt)}</p>
              </div>
            </div>
          )}

          {/* TOP HEADER CARD */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 font-black text-xl">#</div>
              <div>
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">{mainData.nopel}</h1>
                <p className="text-xs font-bold text-slate-400">Terdaftar pada {formatDateId(createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-3">
               <StatusChip status={overallStatus} />
               <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                 Stage: {stageLabel[currentStage] || currentStage}
               </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* LEFT: PROGRESS */}
            <aside className="space-y-6">
              <SectionCard title="Progress Tahapan">
                <TaskStageProgress task={task} orientation="vertical" />
              </SectionCard>
              
              <SectionCard title="Pembuat Berkas">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">{task.createdBy?.name || "System"}</p>
                  <p className="text-xs text-slate-500">{task.createdBy?.email}</p>
                  <div className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase inline-block">
                    {task.createdBy?.role}
                  </div>
                </div>
              </SectionCard>
            </aside>

            {/* RIGHT: DETAILS */}
            <div className="space-y-6">
              <SectionCard title="Data Utama Objek Pajak">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                  <InfoRow label="NOP">{mainData.nop}</InfoRow>
                  <InfoRow label="Nama Lama">{mainData.oldName}</InfoRow>
                  <InfoRow label="Kecamatan">{mainData.subdistrict}</InfoRow>
                  <InfoRow label="Kelurahan">{mainData.village}</InfoRow>
                  <div className="md:col-span-2 border-t my-2 pt-2">
                    <InfoRow label="Alamat OP">{mainData.address}</InfoRow>
                  </div>
                  <InfoRow label="Luas T. Lama">{mainData.oldlandWide} m²</InfoRow>
                  <InfoRow label="Luas B. Lama">{mainData.oldbuildingWide} m²</InfoRow>
                </div>
              </SectionCard>

              <SectionCard title={`Data Pecahan (${additionalData.length} Item)`}>
                <div className="space-y-4">
                  {additionalData.map((item, index) => (
                    <div key={index} className="group relative rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-white hover:border-indigo-200 transition-all">
                      <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300 group-hover:text-indigo-200">#{index + 1}</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <InfoRow label="Nama Baru">{item.newName}</InfoRow>
                          <InfoRow label="Sertifikat">{item.certificate}</InfoRow>
                        </div>
                        <div className="space-y-2">
                          <InfoRow label="Luas Tanah">{item.landWide} m²</InfoRow>
                          <InfoRow label="Luas Bangunan">{item.buildingWide} m²</InfoRow>
                          <div className="flex justify-end mt-2">
                            <span className={`text-[9px] font-black px-2 py-1 rounded ${item.addStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.addStatus?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Log Approval" bodyClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Tahapan</th>
                        <th className="px-6 py-4">Pemeriksa</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvals.map((app, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                          <td className="px-6 py-4 font-bold text-slate-700">{stageLabel[app.stage] || app.stage}</td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold">{app.approverId?.name || "-"}</div>
                            <div className="text-[10px] text-slate-400">{app.approverId?.role || ""}</div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusChip status={app.status} />
                            {app.note && <p className="text-[11px] mt-1 italic text-slate-500">"{app.note}"</p>}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-mono text-slate-400">
                            {formatDateTimeId(app.approvedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default TaskDetail;