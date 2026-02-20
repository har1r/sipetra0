import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ReportHistoryTable from "../../components/input/ReportHistoryTable";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import Pagination from "../../components/ui/Pagination";
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineInbox,
  HiOutlinePrinter,
  HiOutlineLink,
  HiOutlineExternalLink,
  HiFilter,
} from "react-icons/hi";
import { FaSquareCheck, FaRegSquare } from "react-icons/fa6";
import toast from "react-hot-toast";

const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm`}
      />
    </div>
  </div>
);

const ReportHistory = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Diubah dari loading ke isLoading
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filterDraft, setFilterDraft] = useState({
    nopel: "",
    startDate: "",
    endDate: "",
    sortOrder: "desc",
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filterDraft });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const ctrlRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setIsLoading(true); // Menggunakan setIsLoading
    try {
      const params = {
        page: currentPage,
        limit: 10,
        sortOrder: appliedFilters.sortOrder,
        ...(appliedFilters.nopel.trim() && {
          nopel: appliedFilters.nopel.trim(),
        }),
        ...(appliedFilters.startDate && {
          startDate: appliedFilters.startDate,
        }),
        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
      };

      const res = await axiosInstance.get(
        API_PATHS.REPORTS.DAFTAR_SURAT_PENGANTAR,
        {
          params,
          signal: ctrl.signal,
        },
      );

      setTasks(res?.data?.tasks || []);
      setTotalData(res?.data?.pagination?.totalData || 0);
      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch (err) {
      if (err?.name !== "CanceledError") {
        toast.error("Gagal sinkronisasi data");
      }
    } finally {
      setIsLoading(false); // Menggunakan setIsLoading
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    fetchTasks();
    return () => ctrlRef.current?.abort();
  }, [fetchTasks]);

  const handleApplyFilter = () => {
    setAppliedFilters(filterDraft);
    setCurrentPage(1);
  };

  const resetFilter = () => {
    const init = { nopel: "", startDate: "", endDate: "", sortOrder: "desc" };
    setIsLoading(true); // Memicu putaran icon segera saat reset diklik
    setFilterDraft(init);
    setAppliedFilters(init);
    setCurrentPage(1);
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
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0)
      return toast.error("Pilih minimal satu berkas.");
    setExporting(true);
    const toastId = toast.loading("Sedang memproses PDF...");
    try {
      const response = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
        { taskIds: selectedIds },
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PENGANTAR_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("PDF berhasil diunduh", { id: toastId });
      setSelectedIds([]);
      fetchTasks();
    } catch (err) {
      toast.error("Gagal memproses PDF", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Riwayat Pengantar">
      <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-8 animate-fadeIn">
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-4">
              Cetak Pengantar
              <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Valid
              </div>
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 tracking-wide capitalize">
              Kumpulkan permohonan yang sudah diteliti ke dalam satu surat
              pengantar kolektif.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetFilter}
              className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all active:scale-95"
            >
              <HiOutlineRefresh
                className={`w-4 h-4 ${
                  isLoading
                    ? "animate-spin text-emerald-500"
                    : "group-hover:rotate-180 transition-transform duration-500"
                }`}
              />
              Reset Filter
            </button>
            <button
              onClick={handleExportPDF}
              disabled={selectedIds.length === 0 || exporting}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-[11px] font-bold shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              Generate Batch ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* --- FILTER CONTROLS --- */}
        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col lg:flex-row items-end gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow w-full">
            <FilterInput
              label="Pencarian Nopel"
              icon={HiOutlineSearch}
              placeholder="Masukkan Nopel..."
              value={filterDraft.nopel}
              onChange={(e) =>
                setFilterDraft({ ...filterDraft, nopel: e.target.value })
              }
            />
            <FilterInput
              label="Mulai Tanggal"
              type="date"
              value={filterDraft.startDate}
              onChange={(e) =>
                setFilterDraft({ ...filterDraft, startDate: e.target.value })
              }
            />
            <FilterInput
              label="Sampai Tanggal"
              type="date"
              value={filterDraft.endDate}
              onChange={(e) =>
                setFilterDraft({ ...filterDraft, endDate: e.target.value })
              }
            />
            <div className="group space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest">
                Urutan
              </label>
              <select
                value={filterDraft.sortOrder}
                onChange={(e) =>
                  setFilterDraft({ ...filterDraft, sortOrder: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleApplyFilter}
            className="w-full lg:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <HiFilter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-800 text-slate-200 text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-5 text-center w-16">
                    <button
                      onClick={toggleSelectAll}
                      className="text-lg transition-all active:scale-90"
                    >
                      {selectedIds.length === tasks.length &&
                      tasks.length > 0 ? (
                        <FaSquareCheck className="text-emerald-400" />
                      ) : (
                        <FaRegSquare className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-5 text-left uppercase tracking-widest">
                    Identitas Berkas
                  </th>
                  <th className="px-4 py-5 text-left uppercase tracking-widest">
                    Wajib Pajak & Layanan
                  </th>
                  <th className="px-4 py-5 text-center uppercase tracking-widest">
                    No. Pengantar
                  </th>
                  <th className="px-4 py-5 text-center uppercase tracking-widest">
                    Tgl Verifikasi
                  </th>
                  <th className="px-4 py-5 text-center uppercase tracking-widest">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-6 py-8">
                          <div className="h-5 bg-slate-100 rounded-full w-full" />
                        </td>
                      </tr>
                    ))
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr
                      key={task._id}
                      className={`hover:bg-slate-50/80 transition-all group ${
                        selectedIds.includes(task._id) ? "bg-emerald-50/30" : ""
                      }`}
                      onClick={() => toggleSelectOne(task._id)}
                    >
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleSelectOne(task._id)}
                          className="text-lg"
                        >
                          {selectedIds.includes(task._id) ? (
                            <FaSquareCheck className="text-emerald-600 animate-in zoom-in duration-200" />
                          ) : (
                            <FaRegSquare className="text-slate-200 group-hover:text-emerald-200" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-700 leading-none">
                            {task.mainData?.nopel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">
                            {task.mainData?.nop}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase">
                            {task.additionalData?.[0]?.newName || "TANPA NAMA"}
                          </span>
                          <div className="flex">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-tighter">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {task.reportId ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            {task.displayBatchId}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            Antrean
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-[11px] font-bold text-slate-600">
                        {formatDateId(task.updatedAt)}
                      </td>
                      <td
                        className="px-4 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:text-emerald-500 hover:border-emerald-500 transition-all"
                          >
                            <HiOutlineLink size={14} />
                          </button>
                          {task.attachments?.[0]?.driveLink && (
                            <a
                              href={task.attachments[0].driveLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:text-blue-500 hover:border-blue-500 transition-all"
                            >
                              <HiOutlineExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-24">
                      <div className="flex flex-col items-center justify-center space-y-3 w-full">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <HiOutlineInbox className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="space-y-1 text-center">
                          <h3 className="text-base font-black text-slate-600 uppercase tracking-widest">
                            Tidak Ada Data Ditemukan
                          </h3>
                          <p className="text-sm text-slate-400 font-medium">
                            Maaf, kami tidak menemukan berkas yang sesuai dengan
                            filter Anda.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              Total: {totalData} Berkas
            </span>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* --- RIWAYAT SECTION --- */}
        <div className="space-y-6 pt-10">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-emerald-500 rounded-full" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Riwayat Batch PDF
            </h2>
          </div>
          <div className="bg-white rounded-[1.5rem] p-2 border border-slate-200 shadow-sm overflow-hidden">
            <ReportHistoryTable />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportHistory;
