import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import TaskFilter from "../../components/filters/TaskFilter";
import Pagination from "../../components/ui/Pagination";
import ApprovalModal from "../../components/modals/ApprovalModal";
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const TaskTable = React.lazy(() => import("../../components/tabels/TaskTable"));

const ManageTasks = () => {
  // === State Utama ===
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [taskIdForApproval, setTaskIdForApproval] = useState(null);

  // === Modal Konfirmasi Hapus ===
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState(null);

  // === State Filter & Pagination ===
  const defaultFilter = {
    nopel: "",
    title: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  };
  const [filters, setFilters] = useState(defaultFilter);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilter);

  const limit = 10;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTasks / limit)),
    [totalTasks]
  );

  // === State Loading ===
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // === Abort Controllers ===
  const fetchCtrlRef = useRef(null);
  const exportCtrlRef = useRef(null);

  // === Fetch Tasks ===
  const fetchTasks = useCallback(
    async (page, appliedFilter) => {
      fetchCtrlRef.current?.abort();
      const ctrl = new AbortController();
      fetchCtrlRef.current = ctrl;
      setIsLoading(true);

      try {
        const { data } = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
          params: { page, limit, ...appliedFilter },
          signal: ctrl.signal,
        });

        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTotalTasks(Number(data.total || 0));
        setSelectedTaskIds([]); // reset seleksi
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          console.error("Error fetching tasks:", error);
          toast.error("Gagal mengambil data permohonan");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchTasks(currentPage, appliedFilters);
    return () => {
      fetchCtrlRef.current?.abort();
      exportCtrlRef.current?.abort();
    };
  }, [currentPage, appliedFilters, fetchTasks]);

  useEffect(() => {
    if (!isLoading && isFiltering) setIsFiltering(false);
  }, [isLoading, isFiltering]);

  // === Checkbox Selection ===
  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const toggleSelectAll = useCallback(
    (checked) => setSelectedTaskIds(checked ? tasks.map((t) => t._id) : []),
    [tasks]
  );

  // === Approval ===
  const openApprovalModal = useCallback((taskId) => {
    setTaskIdForApproval(taskId);
    setShowApprovalModal(true);
  }, []);

  // === Delete Task (tanpa window.confirm) ===
  const handleDeleteTask = useCallback(async () => {
    if (!taskIdToDelete) return;

    try {
      await axiosInstance.delete(API_PATHS.TASK.DELETE_TASK(taskIdToDelete));
      toast.success("Permohonan berhasil dihapus");
      fetchTasks(currentPage, appliedFilters);
    } catch {
      toast.error("Gagal menghapus permohonan");
    } finally {
      setTaskIdToDelete(null);
      setShowDeleteConfirm(false);
    }
  }, [taskIdToDelete, fetchTasks, currentPage, appliedFilters]);

  // === Download Helper ===
  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // === Export Rekomendasi ===
  const handleExportTasks = useCallback(async (taskIds) => {
    exportCtrlRef.current?.abort();
    const ctrl = new AbortController();
    exportCtrlRef.current = ctrl;
    setIsExporting(true);

    try {
      const res = await axiosInstance.post(
        API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
        { taskIds },
        { responseType: "blob", signal: ctrl.signal }
      );

      const cd = res.headers?.["content-disposition"];
      let filename = "";

      if (cd) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
          cd
        );
        filename = decodeURIComponent(match?.[1] || match?.[2] || "");
      }

      if (!filename) {
        const ts = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
        filename =
          taskIds.length > 1 ? `rekom-bulk-${ts}.zip` : `rekom-${ts}.pdf`;
      }

      downloadFile(res.data, filename);
      toast.success("Mengunduh");
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error(
          "Gagal mengunduh rekomendasi, pastikan jenis permohonan sama."
        );
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  // === Filter Actions ===
  const applyFilterChanges = useCallback(() => {
    setIsFiltering(true);
    setCurrentPage(1);
    setAppliedFilters(filters);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setIsFiltering(true);
    setFilters(defaultFilter);
    setAppliedFilters(defaultFilter);
    setCurrentPage(1);
  }, []);

  // === Render ===
  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-5">
        {/* Filter Section */}
        <TaskFilter
          filters={filters}
          setFilters={setFilters}
          loading={isFiltering}
          onFilterSubmit={applyFilterChanges}
          onFilterReset={resetFilters}
        />

        {/* Table Section */}
        <Suspense fallback={<TableSkeleton rows={10} cols={9} />}>
          <div className="relative mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {isLoading && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-[1px] rounded-xl">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            )}

            {tasks.length > 0 ? (
              <>
                <TaskTable
                  tasks={tasks}
                  selectedTaskIds={selectedTaskIds}
                  onToggleRow={toggleTaskSelection}
                  onToggleAll={toggleSelectAll}
                  handleDelete={(taskId) => {
                    setTaskIdToDelete(taskId);
                    setShowDeleteConfirm(true);
                  }}
                  openApprovalModal={openApprovalModal}
                  page={currentPage}
                  limit={limit}
                  onExport={handleExportTasks}
                  exporting={isExporting}
                  showExportButton
                />

                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  disabled={isLoading}
                  onPageChange={(nextPage) => {
                    const validPage = Math.max(
                      1,
                      Math.min(totalPages, nextPage)
                    );
                    if (validPage !== currentPage) setCurrentPage(validPage);
                  }}
                />
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data yang bisa ditampilkan.
              </div>
            )}
          </div>
        </Suspense>

        {/* Modal Approval */}
        {showApprovalModal && (
          <ApprovalModal
            taskId={taskIdForApproval}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
              fetchTasks(currentPage, appliedFilters);
              setShowApprovalModal(false);
            }}
          />
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                Konfirmasi Hapus
              </h3>
              <p className="mb-5 text-sm text-slate-600">
                Apakah Anda yakin ingin menghapus permohonan ini?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;
