import React, { useState, useEffect, useCallback, useContext } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import VerifikasiModal from "../../components/modals/VerificationModal";
import RowActions from "../../components/actions/RowActions";
import UserContext from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";
import toast from "react-hot-toast";

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const ManageTask = () => {
  const { user } = useContext(UserContext);
  const userRole = (user?.role || "").toLowerCase();

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
        params: {
          nopel: filters.search,
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status, // Sekarang mengirim: in_progress, approved, rejected
          currentStage: filters.stage,
          page: currentPage,
          limit: 10,
        },
      });
      setTaskList(res.data?.tasks || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data dari server");
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
    toast.success("Filter telah direset");
  };

  const toggleRow = (id) => setExpandedRows((p) => ({ ...p, [id]: !p[id] }));

  const handleApproveClick = (task) => {
    setSelectedTaskId(task._id || task.id);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="max-w-7xl mx-auto py-6 space-y-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Monitoring Berkas
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Kelola dan pantau progres permohonan secara real-time.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 hover:text-emerald-600 transition-all shadow-sm"
          >
            <RefreshIcon /> Reset Data
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Cari Nopel
            </label>
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="No. Pelayanan..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Status Berkas
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="in_progress">Proses</option>
              <option value="approved">Selesai</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Tahapan
            </label>
            <select
              name="stage"
              value={filters.stage}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none cursor-pointer"
            >
              <option value="">Semua Tahap</option>
              <option value="diinput">Peneliti (Diinput)</option>
              <option value="ditata">Penata (Ditata)</option>
              <option value="diteliti">Peneliti (Diteliti)</option>
              <option value="diarsipkan">Pengarsip (Diarsipkan)</option>
              <option value="dikirim">Pengirim (Dikirim)</option>
              <option value="selesai">Selesai (Pengecekan)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Mulai Tanggal
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b">
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Informasi Berkas</th>
                  <th className="px-6 py-4">Pemohon Utama</th>
                  <th className="px-6 py-4 text-center">Luas (T/B)</th>
                  <th className="px-6 py-4 text-center">Tahapan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      Memuat data...
                    </td>
                  </tr>
                ) : taskList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center py-16 text-slate-400"
                    >
                      Data tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  taskList.map((task) => {
                    const id = task._id || task.id;
                    const primaryData = task.additionalData?.[0] || {};
                    const hasPecahan = task.additionalData?.length > 1;

                    return (
                      <React.Fragment key={id}>
                        <tr className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">
                            {task.createdAt
                              ? formatDateId(task.createdAt)
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-700">
                              {task.mainData?.nopel || task.nopel}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {task.mainData?.nop || task.nop}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-slate-600">
                                {primaryData.newName || "-"}
                              </span>
                              {hasPecahan && (
                                <button
                                  onClick={() => toggleRow(id)}
                                  className="w-fit text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100"
                                >
                                  {expandedRows[id]
                                    ? "Tutup Detail"
                                    : `+${task.additionalData.length - 1} Pecahan`}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs font-bold text-slate-700">
                              {primaryData.landWide || 0} m²
                            </div>
                            <div className="text-[10px] text-emerald-600">
                              {primaryData.buildingWide || 0} m² (Bgn)
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                              {task.currentStage}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-[11px]">
                            <span
                              className={
                                task.overallStatus === "approved"
                                  ? "text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"
                                  : task.overallStatus === "rejected"
                                    ? "text-rose-600 bg-rose-50 px-2 py-1 rounded-md"
                                    : "text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                              }
                            >
                              {/* Transform enum ke tampilan user-friendly */}
                              {task.overallStatus === "in_progress"
                                ? "PROSES"
                                : task.overallStatus === "approved"
                                  ? "SELESAI"
                                  : "DITOLAK"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <RowActions
                              task={task}
                              onApprove={() => handleApproveClick(task)}
                            />
                          </td>
                        </tr>
                        {/* Detail Pecahan */}
                        {expandedRows[id] &&
                          task.additionalData.slice(1).map((pec, pIdx) => (
                            <tr
                              key={pIdx}
                              className="bg-slate-50/50 text-slate-500 border-l-4 border-indigo-400"
                            >
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2 text-[10px] italic text-right">
                                Pecahan {pIdx + 2} →
                              </td>
                              <td className="px-6 py-2 text-[10px] font-bold text-slate-700">
                                {pec.newName}
                              </td>
                              <td className="px-6 py-2 text-center text-[10px] font-medium text-indigo-600">
                                T: {pec.landWide || 0} m² / B:{" "}
                                {pec.buildingWide || 0} m²
                              </td>
                              <td colSpan={3}></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-400 italic">
            Menampilkan {taskList.length} dari {totalCount} data berkas
          </p>
          <Pagination
            page={currentPage}
            totalPages={Math.ceil(totalCount / 10)}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-8 border border-slate-100">
              <VerifikasiModal
                taskId={selectedTaskId}
                userRole={userRole}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedTaskId(null);
                }}
                onSuccess={() => {
                  setIsModalOpen(false);
                  setSelectedTaskId(null);
                  fetchTasks();
                  toast.success("Status berkas diperbarui");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageTask;
