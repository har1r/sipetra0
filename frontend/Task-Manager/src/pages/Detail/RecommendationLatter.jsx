import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ReportHistoryTable from "../../components/inputs/ReportHistoryTable";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  FaSearch,
  FaLink,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSortAmountDown,
  FaCalendarAlt,
  FaTrashRestore,
} from "react-icons/fa";
import {
  FaClipboardList,
  FaFilePdf,
  FaSquareCheck,
  FaRegSquare,
  FaTag,
  FaRotate,
} from "react-icons/fa6";
import toast from "react-hot-toast";

const ExportSummary = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // --- STATE FILTER (Sync dengan Backend) ---
  const [filters, setFilters] = useState({
    nopel: "",
    startDate: "",
    endDate: "",
    sortOrder: "desc",
  });

  // State untuk menyimpan filter yang benar-benar dikirim ke API
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // --- STATE PAGINATION ---
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const ctrlRef = useRef(null);

  const fetchTasks = useCallback(
    async (page = 1) => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      setLoading(true);
      try {
        const params = {
          page,
          sortOrder: appliedFilters.sortOrder,
          ...(appliedFilters.nopel.trim() && { nopel: appliedFilters.nopel.trim() }),
          ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
          ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
        };

        const res = await axiosInstance.get(
          API_PATHS.REPORTS.DAFTAR_SURAT_PENGANTAR,
          { params, signal: ctrl.signal }
        );

        setTasks(res?.data?.tasks || []);
        setPagination(
          res?.data?.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalData: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        );
      } catch (err) {
        if (err?.name !== "CanceledError") {
          toast.error(err?.response?.data?.message || "Gagal mengambil data.");
        }
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters]
  );

  useEffect(() => {
    fetchTasks(pagination.currentPage);
    return () => ctrlRef.current?.abort();
  }, [fetchTasks, pagination.currentPage]);

  // --- HANDLERS ---

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
    setPagination((p) => ({ ...p, currentPage: 1 }));
  };

  const resetFilter = () => {
    const defaultFilters = { nopel: "", startDate: "", endDate: "", sortOrder: "desc" };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPagination((p) => ({ ...p, currentPage: 1 }));
    toast.success("Filter dibersihkan");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length && tasks.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddDriveLink = async (e, taskId) => {
    e.stopPropagation();
    const newLink = prompt("Masukkan link Google Drive:");
    if (!newLink) return;

    const fileName = prompt("Keterangan file:", "Berkas PDF Pendukung");
    if (!fileName) return;

    const toastId = toast.loading("Mengunggah tautan...");
    try {
      await axiosInstance.post(API_PATHS.REPORTS.UPLOAD_LINK_TASK(taskId), {
        fileName,
        driveLink: newLink,
      });
      toast.success("Tautan berhasil ditambahkan!", { id: toastId });
      fetchTasks(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui link.", { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return toast.error("Pilih minimal satu berkas.");

    const selectedTasks = tasks.filter((t) => selectedIds.includes(t._id));
    const hasExistingBatch = selectedTasks.some((t) => t.reportId);
    const isMixed = hasExistingBatch && selectedTasks.some((t) => !t.reportId);

    if (isMixed) {
      return toast.error("Jangan campur berkas baru dengan yang sudah ber-batch.");
    }

    setExporting(true);
    const toastId = toast.loading(hasExistingBatch ? "Mencetak ulang..." : "Menerbitkan batch...");

    try {
      const response = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
        { taskIds: selectedIds },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PENGANTAR_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("PDF Berhasil diunduh", { id: toastId });
      setSelectedIds([]);
      fetchTasks(1);
    } catch (err) {
      toast.error("Gagal memproses PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
        
        {/* --- HEADER --- */}
        <header className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-[80px] -mr-20 -mt-20" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                  <FaClipboardList size={26} />
                </div>
                <h1 className="text-4xl font-black tracking-tight">Cetak Pengantar</h1>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed ml-1">
                Kumpulkan berkas tervalidasi ke dalam satu surat pengantar kolektif atau cetak ulang batch sebelumnya.
              </p>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={selectedIds.length === 0 || exporting}
              className="group flex items-center gap-4 rounded-2xl bg-white px-10 py-5 text-sm font-black text-slate-900 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-white/10"
            >
              {exporting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              ) : (
                <FaFilePdf className="text-emerald-600 text-xl" />
              )}
              <div className="text-left">
                <span className="block leading-none">
                  {selectedIds.length > 0 && tasks.find(t => t._id === selectedIds[0])?.reportId ? "Cetak Ulang Batch" : "Generate Batch Baru"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedIds.length} Berkas Dipilih</span>
              </div>
            </button>
          </div>
        </header>

        {/* --- FILTER CONTROLS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-9 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
            <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-10 gap-3">
              {/* NOPEL */}
              <div className="lg:col-span-4 relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NOPEL..."
                  value={filters.nopel}
                  onChange={(e) => setFilters(f => ({ ...f, nopel: e.target.value }))}
                  className="w-full rounded-2xl border-none bg-slate-50 py-3.5 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              {/* DATE RANGE */}
              <div className="lg:col-span-4 flex items-center gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                  className="flex-1 rounded-2xl bg-slate-50 py-3 text-xs font-bold px-3 outline-none border border-transparent focus:border-emerald-200"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                  className="flex-1 rounded-2xl bg-slate-50 py-3 text-xs font-bold px-3 outline-none border border-transparent focus:border-emerald-200"
                />
              </div>
              {/* ACTION BUTTONS */}
              <div className="lg:col-span-2 flex gap-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white rounded-xl hover:bg-black transition-all flex items-center justify-center">
                  <FaSearch size={14} />
                </button>
                <button type="button" onClick={resetFilter} className="flex-1 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center">
                  <FaTrashRestore size={14} />
                </button>
              </div>
            </form>
          </section>

          {/* SORT ORDER */}
          <section className="lg:col-span-3 bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaSortAmountDown />
            </div>
            <select
              value={filters.sortOrder}
              onChange={(e) => {
                const newOrder = e.target.value;
                setFilters(f => ({ ...f, sortOrder: newOrder }));
                setAppliedFilters(prev => ({ ...prev, sortOrder: newOrder }));
              }}
              className="flex-1 bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
            >
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </section>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sinkronisasi Data...</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-6 w-16 text-center">
                    <button onClick={toggleSelectAll} className="text-xl transition-transform active:scale-75">
                      {selectedIds.length === tasks.length && tasks.length > 0 ? (
                        <FaSquareCheck className="text-emerald-600" />
                      ) : (
                        <FaRegSquare className="text-slate-300" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-6 font-black uppercase tracking-[0.15em] text-[10px]">Informasi Objek Pajak</th>
                  <th className="px-4 py-6 font-black uppercase tracking-[0.15em] text-[10px]">Status Batch</th>
                  <th className="px-4 py-6 font-black uppercase tracking-[0.15em] text-[10px]">Tgl Verifikasi</th>
                  <th className="px-6 py-6 font-black uppercase tracking-[0.15em] text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const isSelected = selectedIds.includes(task._id);
                    const hasBatch = !!task.reportId;
                    return (
                      <tr
                        key={task._id}
                        onClick={() => toggleSelectOne(task._id)}
                        className={`group cursor-pointer transition-all ${isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/50"}`}
                      >
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelectOne(task._id)} className="text-xl">
                            {isSelected ? <FaSquareCheck className="text-emerald-600 animate-in zoom-in duration-200" /> : <FaRegSquare className="text-slate-200 group-hover:text-emerald-200" />}
                          </button>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-base tracking-tight">{task.mainData?.nopel}</span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">{task.mainData?.nop}</span>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-600">{task.additionalData?.[0]?.newName || "TANPA NAMA"}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-200" />
                              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-black uppercase">{task.title}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          {hasBatch ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase tracking-tighter">
                                <FaRotate size={8} className="animate-spin-slow" /> Terbit
                              </div>
                              <div className="flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-lg border border-emerald-100/50">
                                <FaTag className="text-emerald-500" size={10} />
                                <span className="font-mono text-[11px] font-black text-emerald-700">{task.displayBatchId}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-300 italic">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Antrean</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-5 font-bold text-slate-500 text-xs">
                          {new Date(task.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-2">
                            {task.attachments?.[0]?.driveLink && (
                              <a href={task.attachments[0].driveLink} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                                <FaExternalLinkAlt size={12} />
                              </a>
                            )}
                            <button onClick={(e) => handleAddDriveLink(e, task._id)} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100">
                              <FaLink size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <FaClipboardList size={60} />
                        <p className="mt-4 font-black uppercase tracking-[0.2em] text-sm">Data Tidak Ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          {tasks.length > 0 && (
            <div className="bg-slate-50/50 p-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-4">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Total Data: <span className="text-slate-900">{pagination.totalData}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-emerald-50 transition-all"
                >
                  <FaChevronLeft size={12} />
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagination(p => ({ ...p, currentPage: i + 1 }))}
                    className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${
                      pagination.currentPage === i + 1 ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-emerald-50 transition-all"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- HISTORY TABLE --- */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-emerald-500 rounded-full" />
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Riwayat Batch PDF</h2>
          </div>
          <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-sm">
            <ReportHistoryTable />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportSummary;