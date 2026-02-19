import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiExclamationCircle,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiOutlineArrowLeft,
  HiOutlineIdentification,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
  HiOutlineSquare3Stack3D,
} from "react-icons/hi2";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TaskStageProgress from "../../components/cards/TaskStageProgress";
import { formatDateId } from "../../utils/formatDateId";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const STAGE_LABEL = {
  diinput: "Input Data",
  ditata: "Penataan",
  diteliti: "Penelitian",
  diarsipkan: "Arsip",
  dikirim: "Pengiriman",
  diperiksa: "Pemeriksaan",
  selesai: "Selesai",
};

const formatDateTimeId = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

const StatusChip = ({ status }) => {
  const configs = {
    approved: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <HiCheckCircle />,
      label: "Selesai",
    },
    rejected: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      icon: <HiXCircle />,
      label: "Ditolak",
    },
    revised: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <HiExclamationCircle />,
      label: "Revisi",
    },
    in_progress: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: <HiClock />,
      label: "Proses",
    },
  };
  const config = configs[status] || configs.in_progress;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text} border border-current/10`}
    >
      {config.icon} {config.label}
    </span>
  );
};

const InfoRow = ({ label, children, icon: Icon }) => (
  <div className="flex flex-col gap-1 py-2 border-b border-slate-50 last:border-0">
    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      {Icon && <Icon size={12} />} {label}
    </span>
    <span className="text-sm text-slate-900 font-semibold leading-relaxed">
      {children || (
        <span className="text-slate-300 italic font-normal text-xs">
          Kosong
        </span>
      )}
    </span>
  </div>
);

const SectionCard = ({ title, children, icon: Icon, action }) => (
  <section className="group rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
    {title && (
      <header className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-500 group-hover:text-indigo-600 transition-colors">
              <Icon size={18} />
            </div>
          )}
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.15em]">
            {title}
          </h2>
        </div>
        {action}
      </header>
    )}
    <div className="p-8">{children}</div>
  </section>
);

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await axiosInstance.get(
          API_PATHS.TASK.GET_TASK_BY_ID(id),
          {
            signal: controller.signal,
          },
        );
        if (response.data?.success) {
          setTask(response.data.data);
        }
      } catch (error) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          console.error("Fetch Error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchTask();
    return () => abortRef.current?.abort();
  }, [id]);

  console.log("Fetched Task Detail:", task);

  const renderDetails = useMemo(() => {
    if (!task) return null;
    return {
      title: task.title || "",
      mainData: task.mainData || {},
      additionalData: task.additionalData || [],
      approvals: task.approvals || [],
      uiHelpers: task.uiHelpers || {},
    };
  }, [task]);

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50/50">
        <LoadingSpinner />
      </div>
    );
  if (!task)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="p-6 bg-white rounded-full shadow-xl">
          <HiXCircle size={48} className="text-rose-500" />
        </div>
        <p className="font-black text-slate-800 uppercase tracking-widest">
          Data Tidak Ditemukan
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 font-bold flex items-center gap-2 hover:underline"
        >
          <HiOutlineArrowLeft /> Kembali
        </button>
      </div>
    );

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <main className="bg-[#F8FAFC] min-h-screen pb-24">
        <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
            >
              <HiOutlineArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-wider">
                Kembali
              </span>
            </button>
          </div>

          {task.uiHelpers?.displayStatus === "REVISI" && task.revisedInfo && (
            <div className="rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-8 flex flex-col md:flex-row gap-6 shadow-lg shadow-amber-100">
              <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                <HiExclamationCircle size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-amber-900 uppercase text-sm tracking-widest mb-2">
                  Perlu Perbaikan (Revisi)
                </h3>
                <div className="bg-white/50 rounded-2xl p-4 border border-amber-200/50">
                  <p className="text-sm text-amber-900 font-bold leading-relaxed italic">
                    "{task.revisedInfo.note}"
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase text-amber-600/70">
                  <span>
                    Pemeriksa: {task.revisedInfo.approverId?.name || "System"}
                  </span>
                  <span className="w-1 h-1 bg-amber-300 rounded-full" />
                  <span>{formatDateTimeId(task.revisedInfo.approvedAt)}</span>
                </div>
              </div>
            </div>
          )}

          <section className="rounded-[3rem] bg-white border border-slate-200 p-8 md:p-10 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0" />
            <div className="flex items-center gap-8 z-10 w-full lg:w-auto">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-3">
                <HiOutlineDocumentText size={36} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                  {renderDetails.mainData.nopel}
                </h1>
                <div className="flex items-center gap-3 text-slate-400">
                  <HiClock />{" "}
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Terdaftar {formatDateId(task.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 z-10 justify-center lg:justify-end w-full lg:w-auto">
              <StatusChip status={task.overallStatus} />
              <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[9px] font-black text-slate-400 uppercase mb-1">
                  Tahapan Saat Ini
                </span>
                <span className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                  {STAGE_LABEL[task.currentStage] || task.currentStage}
                </span>
              </div>
            </div>
          </section>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-4 space-y-8">
              <SectionCard title="Tracking Progress" icon={HiClock}>
                <TaskStageProgress task={task} orientation="vertical" />
              </SectionCard>
              <SectionCard title="Pembuat Data" icon={HiOutlineUserCircle}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <HiOutlineUserCircle size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">
                      {task.createdBy?.name || "Admin System"}
                    </p>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">
                      {task.createdBy?.role}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </aside>

            <div className="lg:col-span-8 space-y-8">
              <SectionCard
                title="Detail Objek Pajak"
                icon={HiOutlineIdentification}
              >
                <div className="grid md:grid-cols-2 gap-x-12">
                  <InfoRow label="NOP">{renderDetails.mainData.nop}</InfoRow>
                  <InfoRow label="Nama Lama">
                    {renderDetails.mainData.oldName}
                  </InfoRow>
                  <InfoRow label="Kecamatan">
                    {renderDetails.mainData.subdistrict}
                  </InfoRow>
                  <InfoRow label="Kelurahan">
                    {renderDetails.mainData.village}
                  </InfoRow>
                  <InfoRow label="Jenis Pelayanan">
                    {renderDetails.title}
                  </InfoRow>
                  <InfoRow label="Alamat Lengkap">
                    {renderDetails.mainData.address}
                  </InfoRow>
                  <InfoRow label="Luas Tanah Lama">
                    {renderDetails.mainData.oldlandWide} m²
                  </InfoRow>
                  <InfoRow label="Luas Bangunan Lama">
                    {renderDetails.mainData.oldbuildingWide} m²
                  </InfoRow>
                </div>
              </SectionCard>

              <SectionCard
                title="Data Pecahan Berkas"
                icon={HiOutlineSquare3Stack3D}
                action={
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                    {renderDetails.additionalData.length} Item
                  </span>
                }
              >
                <div className="grid gap-6">
                  {renderDetails.additionalData.map((item, index) => (
                    <div
                      key={index}
                      className="group relative rounded-3xl border border-slate-100 bg-slate-50/50 p-6 hover:bg-white transition-all"
                    >
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-300 group-hover:text-indigo-600 shadow-sm">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <InfoRow label="Nama Baru">{item.newName}</InfoRow>
                          <InfoRow label="Nomor Sertifikat">
                            {item.certificate}
                          </InfoRow>
                        </div>
                        <div className="space-y-1">
                          <InfoRow label="Luas Tanah Baru">
                            {item.landWide} m²
                          </InfoRow>
                          <InfoRow label="Luas Bangunan Baru">
                            {item.buildingWide} m²
                          </InfoRow>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Log Aktivitas & Approval"
                icon={HiCheckCircle}
              >
                <div className="overflow-x-auto -mx-8 -my-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5">Tahapan</th>
                        <th className="px-8 py-5">Oleh</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {renderDetails.approvals.length > 0 ? (
                        renderDetails.approvals.map((app, i) => (
                          <tr
                            key={i}
                            className="hover:bg-slate-50/30 transition-colors"
                          >
                            <td className="px-8 py-5">
                              <span className="text-xs font-black text-slate-700 uppercase">
                                {STAGE_LABEL[app.stage] || app.stage}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-xs font-bold text-slate-800">
                                {app.approverId?.name || "System"}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                {app.approverId?.role}
                              </p>
                            </td>
                            <td className="px-8 py-5">
                              <StatusChip status={app.status} />
                              {app.note && (
                                <div className="mt-2 text-[11px] font-medium text-slate-500 italic bg-slate-100/50 p-2 rounded-lg">
                                  "{app.note}"
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400">
                              {formatDateTimeId(app.approvedAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-8 py-10 text-center text-xs font-bold text-slate-400 uppercase"
                          >
                            Belum Ada Aktivitas Approval
                          </td>
                        </tr>
                      )}
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
