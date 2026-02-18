import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import VerificationModal from "../../components/modals/VerificationModal";
import RowActions from "../../components/actions/RowActions";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import toast from "react-hot-toast";
import {
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineInbox,
  HiOutlineInformationCircle,
  HiOutlineExternalLink,
} from "react-icons/hi";

// --- Sub-Komponen Reusable (Menyesuaikan Style CreateTask) ---
const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm`}
      />
    </div>
  </div>
);

const FilterSelect = ({ label, options, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest group-focus-within:text-emerald-500 transition-colors">
      {label}
    </label>
    <select
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-emerald-500 transition-all shadow-sm"
    >
      <option value="">Semua Data</option>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  </div>
);

const TaskRow = ({ task, index, isExpanded, onToggle, onApprove }) => {
  const primaryData = task.additionalData?.[0] || {};
  const hasPecahan = task.additionalData?.length > 1;
  const { uiHelpers } = task; // Mengambil data helper dari backend

  return (
    <React.Fragment>
      <tr className="hover:bg-slate-50/80 transition-all group border-b border-slate-100">
        {/* NO URUT */}
        <td className="px-4 py-4 text-[11px] font-black text-slate-400 text-center font-mono">
          {index}
        </td>

        {/* TANGGAL */}
        <td className="px-4 py-4">
          <div className="text-[11px] font-bold text-slate-700 leading-tight">
            {formatDateId(task.createdAt)}
          </div>
          <div className="text-[9px] text-slate-400 font-black uppercase mt-0.5">
            Oleh: {task.createdBy?.name?.split(" ")[0] || "System"}
          </div>
        </td>

        {/* IDENTITAS (NOPEL & NOP) */}
        <td className="px-4 py-4">
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-emerald-600 tracking-tight leading-none mb-1">
              {task.mainData?.nopel || "TIDAK ADA NOPEL"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">
              {task.mainData?.nop}
            </span>
          </div>
        </td>

        {/* NAMA PEMOHON & JENIS LAYANAN */}
        <td className="px-4 py-4">
          <div className="text-[12px] font-black text-slate-800 uppercase truncate max-w-[150px]">
            {primaryData.newName || task.mainData?.oldName}
          </div>
          <div className="inline-flex mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase tracking-tighter">
            {task.title}
          </div>
        </td>

        {/* LUAS T & B */}
        <td className="px-4 py-4">
          <div className="flex flex-col gap-1.5 min-w-[80px]">
            {" "}
            {/* Tambah gap dan min-width */}
            <div className="flex items-center gap-2 text-[10px] font-bold whitespace-nowrap">
              <span className="text-slate-400 w-4 inline-block">T:</span>{" "}
              {/* w-3 diubah ke w-4 */}
              <span className="text-slate-700">
                {task.mainData?.oldlandWide || 0} m²
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold whitespace-nowrap">
              <span className="text-slate-400 w-4 inline-block">B:</span>{" "}
              {/* w-3 diubah ke w-4 */}
              <span className="text-slate-700">
                {task.mainData?.oldbuildingWide || 0} m²
              </span>
            </div>
          </div>
        </td>

        {/* TAHAPAN */}
        <td className="px-4 py-4 text-center">
          <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
            {task.currentStage}
          </span>
        </td>

        {/* STATUS */}
        <td className="px-4 py-4 text-center">
          <div className="relative group/tooltip inline-block">
            <div
              className={`flex items-center px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter transition-all shadow-sm ${
                uiHelpers?.badgeColor === "green"
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                  : uiHelpers?.badgeColor === "red"
                    ? "text-rose-600 bg-rose-50 border-rose-200"
                    : uiHelpers?.badgeColor === "orange"
                      ? "text-amber-600 bg-amber-50 border-amber-200"
                      : "text-slate-600 bg-slate-50 border-slate-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-2 ${uiHelpers?.badgeColor === "green" ? "bg-emerald-500" : uiHelpers?.badgeColor === "red" ? "bg-rose-500" : "bg-current animate-pulse"}`}
              />
              {uiHelpers?.displayStatus}
            </div>

            {/* Tooltip Revisi */}
            {task.overallStatus === "revised" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50">
                <p className="font-black text-amber-400 uppercase mb-1 flex items-center gap-1">
                  CATATAN REVISI:
                </p>
                <p className="font-medium leading-relaxed italic">
                  "{task.revisedHistory?.revisedNote}"
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
        </td>

        {/* AKSI */}
        <td className="px-4 py-4">
          <div className="flex items-center justify-end gap-3 min-w-[100px]">
            {hasPecahan && (
              <button
                onClick={onToggle}
                title="Lihat Detail Pecahan"
                className={`p-2.5 rounded-xl border transition-all duration-300 flex-shrink-0 ${
                  isExpanded
                    ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-500 hover:bg-white"
                }`}
              >
                <HiOutlineExternalLink
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-45" : ""}`}
                />
              </button>
            )}

            <div className="flex-shrink-0">
              <RowActions task={task} onApprove={() => onApprove(task)} />
            </div>
          </div>
        </td>
      </tr>

      {/* EXPANDABLE ROW UNTUK DATA PECAHAN */}
      {isExpanded &&
        task.additionalData?.slice(1).map((pec, pIdx) => (
          <tr
            key={pec._id || pIdx}
            className="bg-slate-50/50 border-l-4 border-emerald-500 animate-fadeIn shadow-inner"
          >
            <td className="px-4 py-3 text-center text-[10px] font-black text-slate-300 italic">
              {index}.{pIdx + 1}
            </td>
            <td colSpan={2} className="px-4 py-3">
              <div className="text-[11px] font-black text-slate-500 uppercase italic">
                DATA PECAHAN LAINNYA
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-[11px] font-black text-slate-700 uppercase">
                {pec.newName}
              </div>
              <div className="text-[9px] font-bold text-slate-400">
                {pec.certificate}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-1 rounded border border-emerald-100 w-fit">
                {pec.landWide} / {pec.buildingWide} m²
              </div>
            </td>
            <td
              colSpan={3}
              className="px-4 py-3 italic text-[10px] text-slate-400"
            >
              Status Pecahan:{" "}
              <span className="font-black text-slate-600">
                {pec.addStatus || "in_progress"}
              </span>
            </td>
          </tr>
        ))}
    </React.Fragment>
  );
};

const ManageTask = () => {
  const initialFilters = {
    search: "",
    startDate: "",
    endDate: "",
    status: "",
    stage: "",
  };
  const [taskList, setTaskList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // --- FUNGSI UPDATE STATE LOKAL (TANPA RE-FETCH) ---
  // Fungsi ini akan dipanggil oleh Modal saat checkbox di klik
  const handleItemUpdate = useCallback((taskId, itemId, newStatus) => {
    setTaskList((prevList) =>
      prevList.map((task) => {
        if ((task.id || task._id) === taskId) {
          return {
            ...task,
            additionalData: task.additionalData.map((item) =>
              item._id === itemId ? { ...item, addStatus: newStatus } : item,
            ),
          };
        }
        return task;
      }),
    );
  }, []);

  // Search Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
        params: {
          search: debouncedSearch,
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
          currentStage: filters.stage,
          page: currentPage,
          limit: 10,
        },
      });
      setTaskList(data?.tasks || []);
      setTotalCount(data?.pagination?.totalData || 0);
    } catch (err) {
      toast.error("Sinkronisasi data gagal");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, filters, currentPage]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="max-w-[1600px] mx-auto py-8 px-6 space-y-8 animate-fadeIn">
        {/* HEADER SECTION - Tetap Sama */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              Monitoring Berkas
              <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full border-none font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Live Database
              </div>
            </h1>
            <p className="text-slate-400 text-xs font-bold mt-1 tracking-wide uppercase">
              Kelola dan pantau alur kerja pelayanan pajak secara real-time
            </p>
          </div>

          <button
            onClick={() => {
              setFilters(initialFilters);
              setCurrentPage(1);
            }}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-600 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all active:scale-95"
          >
            <HiOutlineRefresh
              className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            REFRESH DATABASE
          </button>
        </div>

        {/* FILTER CARD - Tetap Sama */}
        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <FilterInput
            label="Pencarian Cepat"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            icon={HiOutlineSearch}
            placeholder="Nopel, NOP, atau Nama..."
          />
          <FilterSelect
            label="Filter Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={[
              { v: "proses", l: "Dalam Proses" },
              { v: "revisi", l: "Perlu Perbaikan" },
              { v: "selesai", l: "Selesai (Final)" },
              { v: "ditolak", l: "Ditolak (Final)" },
            ]}
          />
          <FilterSelect
            label="Filter Tahapan"
            name="stage"
            value={filters.stage}
            onChange={handleFilterChange}
            options={[
              { v: "diinput", l: "1. Penginputan" },
              { v: "ditata", l: "2. Penataan" },
              { v: "diteliti", l: "3. Penelitian" },
              { v: "diarsipkan", l: "4. Pengarsipan" },
              { v: "dikirim", l: "5. Pengiriman" },
              { v: "diperiksa", l: "6. Pemeriksaan" },
              { v: "selesai", l: "7. Selesai" },
            ]}
          />
          <FilterInput
            label="Mulai Tanggal"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <FilterInput
            label="Sampai Tanggal"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>

        {/* TABLE SECTION - Tetap Sama */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-800 text-slate-300 uppercase text-[10px] font-black tracking-[0.15em]">
                  <th className="px-4 py-5 text-center w-12">#</th>
                  <th className="px-4 py-5">Tgl Masuk</th>
                  <th className="px-4 py-5">Nopel & NOP</th>
                  <th className="px-4 py-5">Nama Pemohon & Layanan</th>
                  <th className="px-4 py-5">Luas T / B</th>
                  <th className="px-4 py-5 text-center">Tahapan</th>
                  <th className="px-4 py-5 text-center">Status</th>
                  <th className="px-4 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan="8" className="px-6 py-8">
                            <div className="h-5 bg-slate-100 rounded-full w-full" />
                          </td>
                        </tr>
                      ))
                  : taskList.map((task, idx) => (
                      <TaskRow
                        key={task.id || task._id}
                        index={(currentPage - 1) * 10 + idx + 1}
                        task={task}
                        isExpanded={expandedRows[task.id || task._id]}
                        onToggle={() =>
                          setExpandedRows((p) => ({
                            ...p,
                            [task.id || task._id]: !p[task.id || task._id],
                          }))
                        }
                        onApprove={(t) => setSelectedTask(t)}
                      />
                    ))}
              </tbody>
            </table>
          </div>

          {/* EMPTY STATE - Tetap Sama */}
          {!isLoading && taskList.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-slate-400 space-y-4 bg-slate-50/20">
              <div className="p-6 bg-white rounded-full shadow-inner border border-slate-100">
                <HiOutlineInbox className="w-12 h-12 text-slate-200" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Tidak Ada Berkas Ditemukan
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  Sesuaikan filter atau kata kunci pencarian Anda
                </p>
              </div>
            </div>
          )}

          {/* PAGINATION FOOTER - Tetap Sama */}
          <div className="p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/30 gap-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                Total Berkas: {totalCount}
              </span>
            </div>
            <Pagination
              page={currentPage}
              totalPages={Math.ceil(totalCount / 10) || 1}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* MODAL VERIFIKASI (DIPERBARUI) */}
        {selectedTask && (
          <VerificationModal
            // Cari task terbaru dari taskList agar centang tetap sinkron
            taskData={taskList.find(
              (t) => (t.id || t._id) === (selectedTask.id || selectedTask._id),
            )}
            onClose={() => setSelectedTask(null)}
            onItemUpdate={handleItemUpdate} // PASSING FUNGSI SINKRONISASI
            onSuccess={() => {
              setSelectedTask(null);
              fetchTasks(); // Fetch ulang hanya saat final action (Approve/Reject/Revisi)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageTask;
