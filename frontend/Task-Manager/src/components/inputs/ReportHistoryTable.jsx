import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  FaHistory,
  FaSearch,
  FaLink,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ReportHistoryTable = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterBatch, setFilterBatch] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORTED_REPORTS, {
        params: { batchId: filterBatch },
      });
      // Pastikan menyesuaikan mapping data jika backend menggunakan id/_id
      setReports(res.data.reports || []);
    } catch (err) {
      toast.error("Gagal mengambil riwayat laporan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filterBatch]);

  /* --- FUNGSI BARU: Update Link Drive untuk Batch --- */
  const handleSetBatchLink = async (reportId, currentLink) => {
    const newLink = window.prompt("Masukkan URL Google Drive untuk Batch ini:", currentLink || "");
    
    if (newLink === null) return;
    if (newLink.trim() === "") return toast.error("Link tidak boleh kosong.");

    const toastId = toast.loading("Menyimpan link batch...");
    try {
      // Menggunakan rute PUT /api/reports/attachment/:reportId
      await axiosInstance.put(API_PATHS.REPORTS.UPLOAD_BATCH_LINK(reportId), { 
        driveLink: newLink 
      });

      toast.success("Link batch berhasil diperbarui!", { id: toastId });
      fetchReports(); // Refresh data tabel
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan link.", { id: toastId });
    }
  };

  return (
    <div className="mt-12 space-y-6">
      <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
        <FaHistory className="text-2xl text-emerald-600" />
        <h2 className="text-xl font-bold text-emerald-800">
          Riwayat Batch & Link Folder
        </h2>
      </div>

      <div className="flex max-w-sm relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
        <input
          type="text"
          placeholder="Cari No. Batch..."
          className="w-full rounded-xl border border-emerald-100 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-emerald-900 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">No. Batch / Surat</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Jumlah Task</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-center">Folder Drive</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">Loading...</td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-emerald-700">{report.batchId}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(report.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {report.totalTasks} Berkas
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.driveLink ? (
                        <a
                          href={report.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:underline font-medium"
                        >
                          <FaExternalLinkAlt className="text-[10px]" /> Buka Folder
                        </a>
                      ) : (
                        <span className="text-slate-300 italic">Belum ada link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSetBatchLink(report._id, report.driveLink)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        <FaLink /> {report.driveLink ? "Ubah Link" : "Set Link"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400">Data tidak ditemukan.</td>
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