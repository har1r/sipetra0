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
  FaHistory,
  FaSortAmountDown,
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
  const [nopel, setNopel] = useState("");
  const [appliedNopel, setAppliedNopel] = useState("");

  // State Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
  });

  const ctrlRef = useRef(null);

  const fetchTasks = useCallback(
    async (page = 1) => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      setLoading(true);
      try {
        const params = { page };
        if (appliedNopel.trim()) params.nopel = appliedNopel.trim();

        const res = await axiosInstance.get(
          API_PATHS.REPORTS.DAFTAR_SURAT_PENGANTAR,
          { params, signal: ctrl.signal },
        );

        setTasks(res?.data?.tasks || []);
        setPagination(
          res?.data?.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalData: 0,
          },
        );
      } catch (err) {
        if (err?.name !== "CanceledError") {
          toast.error(err?.response?.data?.message || "Gagal mengambil data.");
        }
      } finally {
        setLoading(false);
      }
    },
    [appliedNopel],
  );

  useEffect(() => {
    fetchTasks(pagination.currentPage);
    return () => ctrlRef.current?.abort();
  }, [fetchTasks, pagination.currentPage]);

  // --- HANDLERS ---

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length && tasks.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /**
   * Menambahkan fungsi handleAddDriveLink yang sebelumnya hilang
   */
  const handleAddDriveLink = async (e, taskId) => {
    e.stopPropagation();

    const newLink = prompt("Masukkan link Google Drive:");
    if (!newLink) return;

    // Backend meminta nama file juga, kita buat default atau tanya user
    const fileName = prompt(
      "Masukkan nama keterangan file (misal: Berkas Pendukung):",
      "Berkas PDF",
    );
    if (!fileName) return;

    const toastId = toast.loading("Mengunggah tautan...");

    try {
      const url = API_PATHS.REPORTS.UPLOAD_LINK_TASK(taskId);

      // Sesuai permintaan backend: Nama file dan Link Drive
      await axiosInstance.post(url, {
        fileName: fileName, // Sesuaikan key ini dengan yang dibaca backend (misal: 'name' atau 'fileName')
        driveLink: newLink, // Sesuaikan key ini dengan yang dibaca backend
      });

      toast.success("Tautan berhasil ditambahkan!", { id: toastId });
      fetchTasks(pagination.currentPage);
    } catch (err) {
      console.error("Update Error:", err.response?.data);
      const errorMessage =
        err.response?.data?.message || "Gagal memperbarui link.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0)
      return toast.error("Pilih minimal satu berkas.");

    const selectedTasks = tasks.filter((t) => selectedIds.includes(t._id));
    const hasExistingBatch = selectedTasks.some((t) => t.reportId);
    const isMixed = hasExistingBatch && selectedTasks.some((t) => !t.reportId);

    if (isMixed) {
      return toast.error(
        "Tidak bisa mencampur berkas baru dengan berkas yang sudah ada nomor batch.",
      );
    }

    const actionText = hasExistingBatch
      ? "Mencetak ulang PDF..."
      : "Menerbitkan nomor & PDF...";

    setExporting(true);
    const toastId = toast.loading(actionText);

    try {
      const response = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
        { taskIds: selectedIds },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SURAT_PENGANTAR_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(
        hasExistingBatch
          ? "Cetak ulang berhasil!"
          : "Nomor batch berhasil diterbitkan!",
        { id: toastId },
      );
      setSelectedIds([]);
      fetchTasks(hasExistingBatch ? pagination.currentPage : 1);
    } catch (err) {
      toast.error("Gagal memproses PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6 space-y-6">
        {/* TOP HEADER */}
        <header className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/40">
                  <FaClipboardList size={22} />
                </span>
                <h1 className="text-3xl font-black tracking-tight">
                  Cetak Pengantar
                </h1>
              </div>
              <p className="text-slate-400 text-sm max-w-md ml-1">
                Kumpulkan berkas yang sudah tervalidasi ke dalam satu surat
                pengantar kolektif atau cetak ulang batch yang sudah ada.
              </p>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={selectedIds.length === 0 || exporting}
              className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-8 py-4 text-sm font-black text-slate-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {exporting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              ) : (
                <FaFilePdf className="text-emerald-600 group-hover:scale-125 transition-transform" />
              )}
              {selectedIds.length > 0 &&
              tasks.find((t) => t._id === selectedIds[0])?.reportId
                ? "Cetak Ulang Batch"
                : "Generate Batch Baru"}
              <span className="ml-1 bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                {selectedIds.length}
              </span>
            </button>
          </div>
        </header>

        {/* CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <section className="lg:col-span-8 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedNopel(nopel);
                setPagination((p) => ({ ...p, currentPage: 1 }));
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NOPEL..."
                  value={nopel}
                  onChange={(e) => setNopel(e.target.value)}
                  className="w-full rounded-2xl border-none bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-black transition-all"
              >
                Cari Berkas
              </button>
            </form>
          </section>

          <div className="lg:col-span-4 flex justify-end gap-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 text-xs font-bold">
              <FaSortAmountDown />
              <span>Urutan: Terbaru</span>
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <span className="text-xs font-bold text-slate-500 animate-pulse">
                  Memuat Berkas...
                </span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-5 w-16 text-center">
                    <button onClick={toggleSelectAll} className="text-xl">
                      {selectedIds.length === tasks.length &&
                      tasks.length > 0 ? (
                        <FaSquareCheck className="text-emerald-600" />
                      ) : (
                        <FaRegSquare className="text-slate-300" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-5 font-black uppercase tracking-tighter text-[10px]">
                    Informasi Objek Pajak
                  </th>
                  <th className="px-4 py-5 font-black uppercase tracking-tighter text-[10px]">
                    Status Cetak
                  </th>
                  <th className="px-4 py-5 font-black uppercase tracking-tighter text-[10px]">
                    Tgl Verifikasi
                  </th>
                  <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px] text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length > 0 ? (
                  tasks.map((task) => {
                    const isSelected = selectedIds.includes(task._id);
                    const hasBatch = !!task.reportId;

                    return (
                      <tr
                        key={task._id}
                        onClick={() => toggleSelectOne(task._id)}
                        className={`group cursor-pointer transition-all ${isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50/80"}`}
                      >
                        <td
                          className="px-6 py-5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleSelectOne(task._id)}
                            className="text-xl"
                          >
                            {isSelected ? (
                              <FaSquareCheck className="text-emerald-600" />
                            ) : (
                              <FaRegSquare className="text-slate-200 group-hover:text-emerald-300" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-base">
                              {task.mainData?.nopel}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {task.mainData?.nop}
                            </span>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">
                                {task.additionalData?.[0]?.newName || "N/A"}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                                {task.title}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          {hasBatch ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <FaRotate className="text-[10px]" />
                                <span className="text-[10px] font-black uppercase tracking-tight">
                                  Sudah Dicetak
                                </span>
                              </div>
                              <div className="flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-lg border border-emerald-100">
                                <FaTag className="text-emerald-500" size={10} />
                                <span className="font-mono text-[11px] font-bold text-emerald-700">
                                  {task.displayBatchId ||
                                    task.reportId?.slice(-8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                              <div className="h-2 w-2 rounded-full bg-slate-200 animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-tight italic">
                                Menunggu Antrean
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(task.updatedAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </td>
                        <td
                          className="px-6 py-5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-center gap-2">
                            {task.attachments?.[0]?.driveLink && (
                              <a
                                href={task.attachments[0].driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all"
                                title="Lihat Berkas"
                              >
                                <FaExternalLinkAlt size={14} />
                              </a>
                            )}
                            <button
                              onClick={(e) => handleAddDriveLink(e, task._id)}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 transition-all"
                              title="Update Link"
                            >
                              <FaLink size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                          <FaClipboardList size={48} />
                        </div>
                        <p className="text-slate-400 font-bold">
                          Tidak ada data yang tersedia.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {tasks.length > 0 && (
            <div className="bg-slate-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Metadata
                </span>
                <div className="px-3 py-1 bg-white rounded-full border border-slate-200 text-[10px] font-bold text-slate-600">
                  Total {pagination.totalData} Berkas
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.currentPage === 1}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      currentPage: p.currentPage - 1,
                    }))
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-emerald-50 disabled:opacity-30 transition-all"
                >
                  <FaChevronLeft size={10} /> Prev
                </button>

                <div className="flex gap-1">
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setPagination((p) => ({ ...p, currentPage: i + 1 }))
                      }
                      className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                        pagination.currentPage === i + 1
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-white text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      currentPage: p.currentPage + 1,
                    }))
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-emerald-50 disabled:opacity-30 transition-all"
                >
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HISTORY */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 bg-emerald-500 rounded-full" />
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Riwayat Batch PDF
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Daftar Surat Pengantar yang Pernah Diterbitkan
                </p>
              </div>
            </div>
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
