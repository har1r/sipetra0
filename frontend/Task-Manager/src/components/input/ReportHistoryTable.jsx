import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import { FaLink, FaFileInvoice, FaFolderOpen } from "react-icons/fa";
import {
  HiOutlineSearch,
  HiOutlineInbox,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePrinter,
} from "react-icons/hi";
import toast from "react-hot-toast";

const ReportHistoryTable = forwardRef(({ onPrint }, ref) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBatch, setFilterBatch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalData: 0,
  });

  // --- REQ 1: GET ALL REPORTS (Untuk List Tabel) ---
  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          API_PATHS.REPORTS.EXPORTED_REPORTS,
          {
            params: {
              batchId: filterBatch,
              page: page,
              limit: 10,
            },
          },
        );
        console.log("API Response for Report History:", res.data.reports);
        setReports(res.data.reports || []);
        setPagination(
          res.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalData: 0,
          },
        );
      } catch (err) {
        toast.error("Gagal mengambil riwayat laporan.");
      } finally {
        setLoading(false);
      }
    },
    [filterBatch],
  );

  useImperativeHandle(ref, () => ({
    refresh: () => fetchReports(1),
  }));

  useEffect(() => {
    const timer = setTimeout(() => fetchReports(1), filterBatch ? 500 : 0);
    return () => clearTimeout(timer);
  }, [filterBatch, fetchReports]);

  // --- REQ 2 & 3: GET BY ID & GENERATE PDF ---
  const handleDownloadPDF = async (reportId) => {
    const toastId = toast.loading("Menyiapkan dokumen PDF...");
    try {
      const response = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS(reportId),
        {}, // Data body kosong (karena ID ada di URL params)
        {
          responseType: "blob", // Sangat Penting: Agar Axios tidak memproses data sebagai JSON
          headers: {
            Accept: "application/pdf",
          },
        },
      );

      // Verifikasi jika yang kembali bukan JSON error (opsional tapi disarankan)
      if (response.data.type === "application/json") {
        // Jika backend mengirim JSON (berarti error), konversi blob ke text
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message);
      }

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);

      // Buka di tab baru
      window.open(fileURL, "_blank");

      toast.success("PDF berhasil dibuka!", { id: toastId });
      setTimeout(() => URL.revokeObjectURL(fileURL), 100);
    } catch (err) {
      console.error("Print Error:", err);
      toast.error(err.message || "Gagal mencetak PDF.", { id: toastId });
    }
  };

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
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId ? { ...r, driveLink: newLink } : r,
        ),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan link.", {
        id: toastId,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* --- SEARCH BAR --- */}
      <div className="px-4 pt-4">
        <div className="relative max-w-md">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Batch..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
          />
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white rounded-[1.2rem] border border-slate-100 overflow-hidden shadow-sm mx-2 mb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-800 text-slate-200 text-[10px] font-bold tracking-widest uppercase">
              <tr>
                <th className="px-6 py-5">Detail Batch & Admin</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Cakupan Berkas</th>
                <th className="px-6 py-5 text-center">Folder Drive</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-6 py-8">
                        <div className="h-5 bg-slate-100 rounded-full w-full" />
                      </td>
                    </tr>
                  ))
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr
                    key={report._id}
                    className="hover:bg-slate-50/80 transition-all group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <FaFileInvoice className="text-emerald-500 shrink-0" />
                          <span className="text-[13px] font-black text-slate-700 leading-none tracking-tight">
                            {report.batchId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Oleh: {report.admin}
                          </span>
                          <span className="text-slate-200">|</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {formatDateId(report.tanggalCetak)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border shadow-sm ${
                          report.status === "FINAL"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : report.status === "VOID"
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-[10px] border border-slate-200">
                          {report.totalTasks} Berkas
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {report.driveLink ? (
                        <a
                          href={report.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-tight"
                        >
                          <FaFolderOpen /> Buka Folder
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic">
                          Belum Terkait
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {/* TOMBOL CETAK PDF (MEMANGGIL FUNGSI LOCAL) */}
                        <button
                          onClick={() => handleDownloadPDF(report._id)}
                          className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all active:scale-90"
                          title="Cetak PDF"
                        >
                          <HiOutlinePrinter size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleSetBatchLink(report._id, report.driveLink)
                          }
                          className="p-2.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 hover:text-blue-500 hover:border-blue-500 hover:bg-white hover:shadow-md transition-all active:scale-90"
                          title="Tautkan Link Drive"
                        >
                          <FaLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <HiOutlineInbox className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Tidak ada riwayat batch
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            Total: {pagination.totalData} Batch
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => fetchReports(pagination.currentPage - 1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:border-emerald-500 transition-all"
            >
              <HiOutlineChevronLeft size={16} />
            </button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 shadow-sm">
              {pagination.currentPage} / {pagination.totalPages}
            </div>
            <button
              disabled={
                pagination.currentPage === pagination.totalPages || loading
              }
              onClick={() => fetchReports(pagination.currentPage + 1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:border-emerald-500 transition-all"
            >
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ReportHistoryTable;
