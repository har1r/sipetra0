import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import Pagination from "../../components/ui/Pagination";
import ApprovalModal from "../../components/modals/ApprovalModal";
import RowActions from "../../components/actions/RowActions";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import UserContext from "../../context/UserContexts";

import toast from "react-hot-toast";

const dateFormatter = new Intl.DateTimeFormat("id-ID");
const MAX_LIMIT = 10;
const ALLOWED_SORT_FIELDS = ["createdAt", "title", "currentStage"];

const ManageUserTask = () => {
  const { user } = useContext(UserContext);
  const userRole = (user?.role || "").toLowerCase();
  const isResearcher = userRole === "peneliti";

  const [taskList, setTaskList] = useState([]);
  const [totalTaskCount, setTotalTaskCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(MAX_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedTaskForApproval, setSelectedTaskForApproval] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState({
    title: "",
    newName: "",
    nopel: "",
    currentStage: "",
    overallStatus: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const abortControllerRef = useRef(null);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTaskCount / limit)),
    [totalTaskCount, limit]
  );

  const buildQueryParams = useCallback(() => {
    const params = {
      page: currentPage,
      limit,
      sortBy: ALLOWED_SORT_FIELDS.includes(taskFilters.sortBy)
        ? taskFilters.sortBy
        : "createdAt",
      order: taskFilters.order === "asc" ? "asc" : "desc",
    };
    if (taskFilters.title) params.title = taskFilters.title;
    if (taskFilters.newName) params.newName = taskFilters.newName;
    if (taskFilters.nopel) params.nopel = taskFilters.nopel;
    if (taskFilters.currentStage)
      params.currentStage = taskFilters.currentStage;
    if (taskFilters.overallStatus)
      params.overallStatus = taskFilters.overallStatus;
    if (taskFilters.startDate) params.startDate = taskFilters.startDate;
    if (taskFilters.endDate) params.endDate = taskFilters.endDate;
    return params;
  }, [taskFilters, currentPage, limit]);

  const fetchTaskList = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const params = buildQueryParams();
      const response = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
        params,
        signal: controller.signal,
      });
      console.log("📄 ManageUserTask fetched:", response?.data);
      setTaskList(
        Array.isArray(response?.data?.tasks) ? response?.data?.tasks : []
      );
      setTotalTaskCount(Number(response?.data?.total || 0));
    } catch (error) {
      if (error.code === "ERR_CANCELED") return;
      console.error("❌ ManageTask Error:", error.message);
      const backendMsg = error?.response?.data?.message;
      toast.error(
        backendMsg ||
          "Gagal mendapatakan data berkas permohonan. Coba lagi nanti."
      );
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchTaskList();
    return () => abortControllerRef.current?.abort();
  }, [fetchTaskList, currentPage, taskFilters.sortBy, taskFilters.order]);

  const applyFilters = () => {
    setCurrentPage(1);
    fetchTaskList();
  };

  const resetFilters = () => {
    setTaskFilters({
      title: "",
      newName: "",
      nopel: "",
      currentStage: "",
      overallStatus: "",
      startDate: "",
      endDate: "",
      sortBy: "createdAt",
      order: "desc",
    });
    setCurrentPage(1);
  };

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusColorClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "selesai") return "bg-emerald-100 text-emerald-800";
    if (s === "ditolak") return "bg-rose-100 text-rose-800";
    return "bg-amber-100 text-amber-800";
  };

  const filterInputClass =
    "w-full rounded-lg border border-emerald-300 bg-white/80 px-3 py-2 text-sm placeholder-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition";

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-800 flex items-center gap-3">
              Kelola Permohonan
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full mt-2"></div>
            <p className="text-sm text-slate-600 mt-2">
              Lihat, filter, dan kelola semua berkas permohonan.
            </p>
          </div>
          <button
            className="rounded-lg bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 
              text-white px-4 py-2 text-sm font-semibold shadow hover:brightness-95 transition"
            onClick={() =>
              setTaskFilters((prev) => ({
                ...prev,
                order: prev.order === "asc" ? "desc" : "asc",
              }))
            }
          >
            Sort: {taskFilters.sortBy} · {taskFilters.order}
          </button>
        </div>

        {/* Filter Panel */}
        <div className="mb-6 rounded-3xl bg-white/70 backdrop-blur-md border border-emerald-200/50 shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              className={filterInputClass}
              placeholder="Jenis Permohonan..."
              value={taskFilters.title}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, title: e.target.value }))
              }
            />

            <input
              className={filterInputClass}
              placeholder="Nama Permohonan..."
              value={taskFilters.newName}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, newName: e.target.value }))
              }
            />

            <input
              className={filterInputClass}
              placeholder="Nomor Pelayanan..."
              value={taskFilters.nopel}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, nopel: e.target.value }))
              }
            />

            <select
              className={filterInputClass}
              value={taskFilters.currentStage}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, currentStage: e.target.value }))
              }
            >
              <option value="">Semua Tahapan</option>
              <option value="ditata">Ditata</option>
              <option value="diteliti">Diteliti</option>
              <option value="diarsipkan">Diarsipkan</option>
              <option value="dikirim">Dikirim</option>
              <option value="selesai">Selesai</option>
            </select>

            <select
              className={filterInputClass}
              value={taskFilters.overallStatus}
              onChange={(e) =>
                setTaskFilters((p) => ({
                  ...p,
                  overallStatus: e.target.value,
                }))
              }
            >
              <option value="">Semua Status</option>
              <option value="Diproses">Diproses</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Selesai">Selesai</option>
            </select>

            <input
              className={filterInputClass}
              type="date"
              value={taskFilters.startDate}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, startDate: e.target.value }))
              }
            />

            <input
              className={filterInputClass}
              type="date"
              value={taskFilters.endDate}
              onChange={(e) =>
                setTaskFilters((p) => ({ ...p, endDate: e.target.value }))
              }
            />

            <div className="flex items-center gap-2">
              <select
                className={filterInputClass}
                value={taskFilters.sortBy}
                onChange={(e) =>
                  setTaskFilters((p) => ({ ...p, sortBy: e.target.value }))
                }
              >
                <option value="createdAt">Tanggal</option>
                <option value="title">Judul</option>
                <option value="currentStage">Tahapan</option>
              </select>
              <button
                onClick={applyFilters}
                className="rounded-lg bg-emerald-500 text-white 
                  px-3 py-2 text-sm font-medium shadow hover:brightness-105 transition"
              >
                Terapkan
              </button>
              <button
                onClick={resetFilters}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-emerald-200/50 shadow-lg p-4 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 rounded-3xl">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-emerald-50 text-emerald-900">
                <tr>
                  <th className="px-3 py-2 text-center">No</th>
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">NOPEL</th>
                  <th className="px-3 py-2">NOP</th>
                  <th className="px-3 py-2">Nama Baru</th>
                  <th className="px-3 py-2">Nama Lama</th>
                  <th className="px-3 py-2 text-center">Luas Tanah</th>
                  <th className="px-3 py-2 text-center">Luas Bangunan</th>
                  <th className="px-3 py-2">Jenis Permohonan</th>
                  <th className="px-3 py-2 text-center">Tahapan</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-emerald-50/30">
                {taskList.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                )}

                {taskList.map((task, index) => {
                  const id =
                    task.id || task._id || `row-${currentPage}-${index}`;
                  const mainDetail =
                    Array.isArray(task.additionalData) && task.additionalData[0]
                      ? task.additionalData[0]
                      : {};
                  const createdAt = task.createdAt
                    ? dateFormatter.format(new Date(task.createdAt))
                    : "-";
                  const isOpen = Boolean(expandedRows[id]);

                  return (
                    <React.Fragment key={id}>
                      <tr
                        className="relative hover:bg-emerald-50"
                      >
                        <td className="border-b px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>{(currentPage - 1) * limit + index + 1}</span>

                            {Array.isArray(task.additionalData) &&
                              task.additionalData.length > 1 && (
                                <button
                                  onClick={() => toggleRowExpand(id)}
                                  className="text-xs px-2 py-0.5 rounded transition hover:bg-emerald-50 text-emerald-700"
                                >
                                  {isOpen ? "▼" : "▶"}
                                </button>
                              )}
                          </div>
                        </td>
                        <td className="border-b px-3 py-2">{createdAt}</td>
                        <td className="border-b px-3 py-2">
                          {task.nopel ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2">
                          {task.nop ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2">
                          {mainDetail.newName ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2">
                          {task.oldName ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2 text-center">
                          {mainDetail.landWide ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2 text-center">
                          {mainDetail.buildingWide ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2">
                          {task.title ?? "-"}
                        </td>
                        <td className="border-b px-3 py-2 text-center">
                          <span className="rounded-full bg-lime-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            {task.currentStage ?? "-"}
                          </span>
                        </td>
                        <td className="border-b px-3 py-2 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorClass(
                              task.status
                            )}`}
                          >
                            {task.status ?? "-"}
                          </span>
                        </td>
                        <td className="border-b px-3 py-2 text-center">
                          <RowActions
                            id={id}
                            showDetail
                            showEdit
                            showApproval
                            showDeleteBtn={false}
                            onApprove={() => {
                              setSelectedTaskForApproval(id);
                              setIsApprovalModalOpen(true);
                            }}
                            disabled={!task.isAccessible}
                          />
                        </td>
                      </tr>

                      {/* Additional Rows */}
                      {isOpen &&
                        Array.isArray(task.additionalData) &&
                        task.additionalData.slice(1).map((part, idx) => (
                          <tr
                            key={`${id}-part-${idx}`}
                            className="!bg-lime-50 hover:!bg-lime-100 transition"
                          >
                            <td></td>
                            <td className="border-b px-3 py-2 text-slate-600">
                              Pecahan {idx + 2}
                            </td>
                            <td className="border-b px-3 py-2">{task.nopel}</td>
                            <td className="border-b px-3 py-2">{task.nop}</td>
                            <td className="border-b px-3 py-2">
                              {part.newName ?? "-"}
                            </td>
                            <td className="border-b px-3 py-2">
                              {task.oldName ?? "-"}
                            </td>
                            <td className="border-b px-3 py-2 text-center">
                              {part.landWide ?? "-"}
                            </td>
                            <td className="border-b px-3 py-2 text-center">
                              {part.buildingWide ?? "-"}
                            </td>
                            <td className="border-b px-3 py-2">
                              {task.title ?? "-"}
                            </td>
                            <td className="border-b px-3 py-2 text-center">
                              <span className="rounded-full bg-lime-100 px-2 py-1 text-xs text-emerald-700">
                                {task.currentStage}
                              </span>
                            </td>
                            <td className="border-b px-3 py-2 text-center">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorClass(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <div>
              Menampilkan{" "}
              {(currentPage - 1) * limit + (taskList.length > 0 ? 1 : 0)} -{" "}
              {(currentPage - 1) * limit + taskList.length} dari{" "}
              {totalTaskCount}
            </div>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(p) =>
                setCurrentPage(Math.max(1, Math.min(totalPages, p)))
              }
            />
          </div>{" "}
        </div>

        {/* =======================
             Approval Modal         ======================== */}
        {isApprovalModalOpen && (
          <ApprovalModal
            taskId={selectedTaskForApproval}
            onClose={() => setIsApprovalModalOpen(false)}
            onSuccess={() => {
              fetchTaskList();
              setIsApprovalModalOpen(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUserTask;
