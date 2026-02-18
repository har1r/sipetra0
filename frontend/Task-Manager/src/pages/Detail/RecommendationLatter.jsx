import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ReportHistoryTable from "../../components/inputs/ReportHistoryTable";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
import { FaSearch, FaLink, FaExternalLinkAlt } from "react-icons/fa"; // Tambahan ikon
import { 
  FaClipboardList, 
  FaFilePdf, 
  FaSquareCheck, 
  FaRegSquare 
} from "react-icons/fa6";
import toast from "react-hot-toast";

const EmptyState = ({ children = "Tidak ada antrean pengantar" }) => (
  <div className="rounded-2xl border border-emerald-200 bg-white/80 p-10 text-center text-emerald-700 shadow-inner">
    {children}
  </div>
);

const ExportSummary = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [nopel, setNopel] = useState("");
  const [appliedNopel, setAppliedNopel] = useState("");

  const ctrlRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setLoading(true);
    try {
      const params = {};
      if (appliedNopel.trim()) params.nopel = appliedNopel.trim();

      const res = await axiosInstance.get(API_PATHS.REPORTS.DAFTAR_SURAT_PENGANTAR, {
        params,
        signal: ctrl.signal,
      });

      setTasks(res?.data?.tasks || []);
    } catch (err) {
      if (err?.name !== "CanceledError") {
        toast.error(err?.response?.data?.message || "Gagal mengambil data antrean.");
      }
    } finally {
      setLoading(false);
    }
  }, [appliedNopel]);

  useEffect(() => {
    fetchTasks();
    return () => ctrlRef.current?.abort();
  }, [fetchTasks]);

  /* ------------------- FUNGSI BARU: Update Link Drive ----------------- */
  const handleAddDriveLink = async (e, taskId) => {
    e.stopPropagation(); // Agar tidak men-trigger checkbox baris
    
    const task = tasks.find(t => t._id === taskId);
    const existingLink = task?.attachments?.[0]?.driveLink || "";
    
    const newLink = window.prompt("Masukkan URL Google Drive (Contoh: Scan KTP/Sertifikat):", existingLink);
    
    if (newLink === null) return;
    if (newLink.trim() === "") return toast.error("Link tidak boleh kosong.");

    const toastId = toast.loading("Menyimpan link ke database...");
    try {
      // Menggunakan fungsi addAttachmentToTask yang sudah kita bahas sebelumnya
      await axiosInstance.post(API_PATHS.REPORTS.UPLOAD_LINK_TASK(taskId), { 
        fileName: "Dokumen Pendukung", 
        driveLink: newLink 
      });

      toast.success("Link berhasil disimpan!", { id: toastId });
      fetchTasks(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan link.", { id: toastId });
    }
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

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return toast.error("Pilih minimal satu task.");

    const selectedTasks = tasks.filter(t => selectedIds.includes(t._id));
    const uniqueTitles = [...new Set(selectedTasks.map(t => t.title))];
    
    if (uniqueTitles.length > 1) {
      return toast.error("Hanya jenis pelayanan yang sama yang dapat digabung dalam satu batch.");
    }

    setExporting(true);
    const toastId = toast.loading("Sedang menerbitkan nomor & men-generate PDF...");

    try {
      const response = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS, 
        { taskIds: selectedIds },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SURAT_PENGANTAR_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Laporan PDF berhasil diterbitkan!", { id: toastId });
      setSelectedIds([]); 
      fetchTasks();
    } catch (err) {
      toast.error("Gagal mengekspor PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    setAppliedNopel(nopel.trim());
  };

  const onReset = () => {
    setNopel("");
    setAppliedNopel("");
  };


  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-800 flex items-center gap-3">
              <FaClipboardList className="text-emerald-600" />
              Cetak Pengantar
            </h1>
            <p className="mt-1 text-sm text-emerald-700">
              Daftar berkas tahap <span className="font-bold text-orange-600">Lulus Diteliti</span> yang siap cetak batch.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={selectedIds.length === 0 || exporting}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-700 hover:to-lime-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {exporting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FaFilePdf />}
            Generate Batch ({selectedIds.length})
          </button>
        </header>

        <section className="rounded-2xl border border-emerald-100 bg-white p-4 mb-6 shadow-sm">
          <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan NOPEL..."
                value={nopel}
                onChange={(e) => setNopel(e.target.value)}
                className="w-full rounded-xl border border-emerald-100 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700">Cari</button>
              <button type="button" onClick={onReset} className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">Reset</button>
            </div>
          </form>
        </section>

        <Suspense fallback={<TableSkeleton number={8} />}>
          <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-50/50 text-emerald-900 border-b border-emerald-100">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <button onClick={toggleSelectAll} className="text-xl text-emerald-600">
                        {selectedIds.length === tasks.length && tasks.length > 0 ? <FaSquareCheck /> : <FaRegSquare className="text-emerald-200" />}
                      </button>
                    </th>
                    <th className="px-3 py-4 font-bold uppercase tracking-wider">NOPEL</th>
                    <th className="px-3 py-4 font-bold uppercase tracking-wider">Nama Pemohon</th>
                    <th className="px-3 py-4 font-bold uppercase tracking-wider">Jenis Layanan</th>
                    <th className="px-3 py-4 font-bold uppercase tracking-wider">Link Dokumen</th>
                    <th className="px-3 py-4 font-bold uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {tasks.length > 0 ? (
                    tasks.map((task) => {
                      const isSelected = selectedIds.includes(task._id);
                      const driveLink = task.attachments?.[0]?.driveLink; // Ambil link pertama jika ada

                      return (
                        <tr 
                          key={task._id} 
                          onClick={() => toggleSelectOne(task._id)}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleSelectOne(task._id)} className="text-xl">
                              {isSelected ? <FaSquareCheck className="text-emerald-600" /> : <FaRegSquare className="text-emerald-200" />}
                            </button>
                          </td>
                          <td className="px-3 py-4">
                            <div className="font-bold text-emerald-900">{task.mainData?.nopel}</div>
                            <div className="text-[10px] font-mono text-slate-400">{task.mainData?.nop}</div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">{task.additionalData?.[0]?.newName || "-"}</td>
                          <td className="px-3 py-4 text-slate-700">{task.title || "-"}</td>
                          <td className="px-3 py-4">
                            {driveLink ? (
                              <a 
                                href={driveLink} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium text-xs"
                              >
                                <FaExternalLinkAlt className="text-[10px]" /> Buka Drive
                              </a>
                            ) : (
                              <span className="text-slate-300 italic text-xs">Belum ada link</span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={(e) => handleAddDriveLink(e, task._id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-white border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                            >
                              <FaLink /> {driveLink ? "Ubah Link" : "Set Link"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-10"><EmptyState /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </Suspense>

        <hr className="my-12 border-emerald-100" />
        <ReportHistoryTable />
      </div>
    </DashboardLayout>
  );
};

export default ExportSummary;