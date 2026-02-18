import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  FaHistory,
  FaSearch,
  FaLink,
  FaExternalLinkAlt,
  FaFileInvoice,
  FaCalendarAlt,
  FaFolderOpen,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ReportHistoryTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBatch, setFilterBatch] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORTED_REPORTS, {
        params: { batchId: filterBatch },
      });
      // Backend mengembalikan { reports: [...] }
      setReports(res.data.reports || []);
    } catch (err) {
      toast.error("Gagal mengambil riwayat laporan.");
    } finally {
      setLoading(false);
    }
  }, [filterBatch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchReports]);

  /* --- Update pada fungsi handleSetBatchLink --- */
  const handleSetBatchLink = async (reportId, currentLink) => {
    const newLink = window.prompt(
      "Masukkan URL Google Drive untuk Batch ini:",
      currentLink || "",
    );

    if (newLink === null) return;
    if (newLink.trim() === "") return toast.error("Link tidak boleh kosong.");

    const toastId = toast.loading("Menyimpan link batch...");
    try {
      await axiosInstance.put(API_PATHS.REPORTS.UPLOAD_BATCH_LINK(reportId), {
        driveLink: newLink,
      });

      toast.success("Link batch berhasil diperbarui!", { id: toastId });

      // PERBAIKAN 1: Optimistic Update (Update state lokal segera)
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId ? { ...report, driveLink: newLink } : report,
        ),
      );

      // Tetap panggil fetchReports untuk sinkronisasi data menyeluruh dengan server
      await fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan link.", {
        id: toastId,
      });
    }
  };

  /* --- Perbaikan pada useEffect --- */
  useEffect(() => {
    // Jika input pencarian kosong, langsung ambil data tanpa delay
    if (!filterBatch) {
      fetchReports();
      return;
    }

    // Jika sedang mengetik, gunakan debounce
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filterBatch, fetchReports]); // Pastikan fetchReports masuk dependency

  return (
    <div className="space-y-6">
      {/* FILTER SECTION - Menyesuaikan style ExportSummary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Batch / Nomor Surat..."
            className="w-full rounded-2xl border-none bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <FaHistory className="text-emerald-500" />
          Total: {reports.length} Batch
        </div>
      </div>

      {/* TABLE SECTION - Glassmorphism Style */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px]">
                  Detail Batch & Admin
                </th>
                <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px]">
                  Waktu Penerbitan
                </th>
                <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px] text-center">
                  Cakupan Berkas
                </th>
                <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px] text-center">
                  Folder Drive
                </th>
                <th className="px-6 py-5 font-black uppercase tracking-tighter text-[10px] text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <tr
                    key={report._id}
                    className="group hover:bg-slate-50/80 transition-all"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <FaFileInvoice className="text-emerald-500" />
                          <span className="font-black text-slate-800 text-base tracking-tight">
                            {report.batchId}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                          Oleh: {report.admin}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <FaCalendarAlt className="text-slate-300 text-xs" />
                        {new Date(report.tanggalCetak).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-black text-xs">
                          {report.totalTasks} Berkas
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1 max-w-[150px] truncate italic">
                          {report.daftarNopel}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {report.driveLink ? (
                        <a
                          href={report.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold"
                        >
                          <FaFolderOpen /> Buka Folder
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                          Belum Terkait
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() =>
                          handleSetBatchLink(report._id, report.driveLink)
                        }
                        className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-600 hover:shadow-lg transition-all"
                        title="Tautkan Folder Drive"
                      >
                        <FaLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-5 bg-slate-50 rounded-full text-slate-200">
                        <FaHistory size={40} />
                      </div>
                      <p className="text-slate-400 font-bold">
                        Tidak ada riwayat batch ditemukan.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportHistoryTable;
