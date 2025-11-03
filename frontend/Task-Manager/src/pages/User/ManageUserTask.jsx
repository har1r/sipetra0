import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import TaskFilter from "../../components/filters/TaskFilter";
import Pagination from "../../components/ui/Pagination";
import ApprovalModal from "../../components/modals/ApprovalModal";
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContexts";

const TaskTable = React.lazy(() => import("../../components/tabels/TaskTable"));

const ManageUserTask = () => {
  const { user } = useContext(UserContext);
  const role = String(user?.role || "").toLowerCase();
  const isResearcher = role === "peneliti";

  // === STATE UTAMA ===
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [taskIdForApproval, setTaskIdForApproval] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // === STATE FILTER & PAGINATION ===
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

  // === STATE LOADING ===
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // === ABORT CONTROLLERS ===
  const fetchCtrlRef = useRef(null);
  const exportCtrlRef = useRef(null);

  // === FETCH TASKS ===
  const fetchUserTasks = useCallback(
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
        setSelectedTaskIds([]);
      } catch (error) {
        if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
          console.error("Error fetching user tasks:", error);
          toast.error("Gagal mengambil data permohonan");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchUserTasks(currentPage, appliedFilters);
    return () => {
      fetchCtrlRef.current?.abort();
      exportCtrlRef.current?.abort();
    };
  }, [currentPage, appliedFilters, fetchUserTasks]);

  useEffect(() => {
    if (!isLoading && isFiltering) setIsFiltering(false);
  }, [isLoading, isFiltering]);

  // === CHECKBOX HANDLERS (HANYA PENELITI) ===
  const toggleTaskSelection = useCallback(
    (taskId) => {
      if (!isResearcher) return;
      setSelectedTaskIds((prev) =>
        prev.includes(taskId)
          ? prev.filter((id) => id !== taskId)
          : [...prev, taskId]
      );
    },
    [isResearcher]
  );

  const toggleSelectAll = useCallback(
    (checked) => {
      if (!isResearcher) return;
      setSelectedTaskIds(checked ? tasks.map((t) => t._id) : []);
    },
    [tasks, isResearcher]
  );

  // === APPROVAL MODAL ===
  const openApprovalModal = useCallback((taskId) => {
    setTaskIdForApproval(taskId);
    setShowApprovalModal(true);
  }, []);

  // === DOWNLOAD HELPER ===
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

  // === EXPORT REKOMENDASI (KHUSUS PENELITI) ===
  const handleExportTasks = useCallback(
    async (taskIds) => {
      if (!isResearcher) {
        toast.info("Hanya role Peneliti yang dapat mengekspor data.");
        return;
      }

      const idsToExport =
        Array.isArray(taskIds) && taskIds.length > 0
          ? taskIds
          : selectedTaskIds;
      if (idsToExport.length === 0) {
        toast("Pilih minimal satu permohonan untuk diekspor.", { icon: "ℹ️" });
        return;
      }

      exportCtrlRef.current?.abort();
      const ctrl = new AbortController();
      exportCtrlRef.current = ctrl;
      setIsExporting(true);

      try {
        const res = await axiosInstance.post(
          API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
          { taskIds: idsToExport },
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
          const ts = new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .split(".")[0];
          filename =
            idsToExport.length > 1 ? `rekom-bulk-${ts}.zip` : `rekom-${ts}.pdf`;
        }

        downloadFile(res.data, filename);
        toast.success("Unduhan dimulai.");
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          toast.error("Gagal mengunduh rekomendasi.");
        }
      } finally {
        setIsExporting(false);
      }
    },
    [isResearcher, selectedTaskIds]
  );

  // === FILTER HANDLERS ===
  const applyFilters = useCallback(() => {
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

  // === RENDER ===
  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-5">
        <TaskFilter
          filters={filters}
          setFilters={setFilters}
          loading={isFiltering}
          onFilterSubmit={applyFilters}
          onFilterReset={resetFilters}
          userRole={role}
        />

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
                  handleDelete={undefined} // user tidak boleh hapus
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

        {showApprovalModal && (
          <ApprovalModal
            taskId={taskIdForApproval}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
              fetchUserTasks(currentPage, appliedFilters);
              setShowApprovalModal(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUserTask;
