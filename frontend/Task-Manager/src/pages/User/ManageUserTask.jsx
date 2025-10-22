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
const TaskTable = React.lazy(() => import("../../components/tabels/TaskTable"));
import Pagination from "../../components/ui/Pagination";
import ApprovalModal from "../../components/modals/ApprovalModal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/UserContexts";

import TableSkeleton from "../../components/Skeletons/TableSkeleton";

const ManageUserTask = () => {
  const { user } = useContext(UserContext);
  const role = String(user?.role || "").toLowerCase();
  const isResearcher = role === "peneliti";

  // data utama
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);

  // pagination & filter (samakan struktur ManageTasks)
  const [page, setPage] = useState(1);
  const limit = 10;

  const [filters, setFilters] = useState({
    nopel: "",
    title: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  });
  const [appliedFilters, setAppliedFilters] = useState({
      nopel: "",
      title: "",
      startDate: "",
      endDate: "",
      sortBy: "createdAt",
      order: "desc",
  });

  // selection (dibolehkan hanya untuk peneliti di handler)
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // modal approval
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // loading
  const [loading, setLoading] = useState(false);

  const [filtering, setFiltering] = useState(false);
  
  // loading & abort (export)
  const [exporting, setExporting] = useState(false);
  const exportCtrlRef = useRef(null);
  
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(total) / limit)),
    [total]
  );
  
  const ctrlRef = useRef(null);
  // fetcher stabil (samakan pola)
  const fetchUserTasks = useCallback(
    async (p, f) => {
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;

      setLoading(true);
      try {
        const res = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
          params: { page: p, limit, ...f },
          signal: ctrl.signal,
        });

        const data = res?.data || {};

        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTotal(Number(data.total || 0));
        setSelectedTaskIds([]); // reset seleksi ketika data berubah
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          console.error("Error fetching user dashboard:", err);
          toast.error("Gagal mengambil data");
        }
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // initial & re-fetch saat page/filters berubah
  useEffect(() => {
    fetchUserTasks(page, appliedFilters);
    return () => {
      ctrlRef.current?.abort();
      exportCtrlRef.current?.abort();
    };
  }, [page, appliedFilters, fetchUserTasks]);

  useEffect(() => {
      if (!loading && filtering) setFiltering(false);
  }, [loading, filtering]);

  // checkbox handlers (aktif hanya jika peneliti)
  const onToggleRow = useCallback(
    (id) => {
      if (!isResearcher) return;
      setSelectedTaskIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    },
    [isResearcher]
  );
  const onToggleAll = useCallback(
    (checked) => {
      if (!isResearcher) return;
      setSelectedTaskIds(checked ? tasks.map((t) => t._id) : []);
    },
    [tasks, isResearcher]
  );

  // approval (hapus delete untuk user agar tidak ada pengurangan fungsi keamanan)
  const openApprovalModal = useCallback((id) => {
    setSelectedTaskId(id);
    setShowApprovalModal(true);
  }, []);

  const handleDelete = undefined; // user tidak boleh menghapus

  // ——— Helper: unduh blob dengan nama file yang aman ———
  const downloadBlob = (blob, filenameFallback = "download.bin") => {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFallback;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // ——— Ekspor rekom (bulk/single) ———
  const handleExport = useCallback(
    async (ids) => {
      // aktif tapi dibatasi peneliti (kebijakan akses)
      if (!isResearcher) {
        toast("Hanya role Peneliti yang dapat mengekspor.", { icon: "🔒" });
        return;
      }
      const list = Array.isArray(ids) && ids.length ? ids : selectedTaskIds;
      if (!list || list.length === 0) {
        toast("Pilih minimal 1 permohonan untuk diunduh.", { icon: "ℹ️" });
        return;
      }

      // Batalkan eksport sebelumnya jika masih jalan
      exportCtrlRef.current?.abort();
      const ctrl = new AbortController();
      exportCtrlRef.current = ctrl;

      setExporting(true);
      try {
        const res = await axiosInstance.post(
          API_PATHS.REPORTS.EXPORT_SELECTED_TASKS,
          { taskIds: list },
          { responseType: "blob", signal: ctrl.signal }
        );

        // Tentukan nama file dari header
        const cd =
          res.headers?.["content-disposition"] ||
          res.headers?.get?.("content-disposition");
        let filename = "";
        if (cd) {
          const match = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(
            cd
          );
          filename = decodeURIComponent(match?.[1] || match?.[2] || "");
        }
        // Fallback nama file berdasarkan content-type & timestamp
        if (!filename) {
          const ct =
            res.headers?.["content-type"] ||
            res.headers?.get?.("content-type") ||
            "";
          const ts = new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\..+/, "");
          filename = ct.includes("zip")
            ? `rekom-bulk-${ts}.zip`
            : `rekom-${list.length > 1 ? "bulk-" : ""}${ts}.pdf`;
        }

        downloadBlob(res.data, filename);
        toast.success("Unduhan dimulai.");
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          // dibatalkan—diamkan
        } else if (
          err?.response?.data &&
          err.response.headers?.["content-type"]?.includes("application/json")
        ) {
          try {
            const text = await err.response.data.text?.();
            const msg = JSON.parse(text)?.message || "Gagal mengunduh rekom.";
            toast.error(msg);
          } catch {
            toast.error("Gagal mengunduh rekom.");
          }
        } else {
          toast.error("Gagal mengunduh rekom.");
        }
      } finally {
        setExporting(false);
      }
    },
    [isResearcher, selectedTaskIds]
  );

  // === APPLY / RESET FILTERS ===
    const applyFilters = useCallback(() => {
      setFiltering(true);          // <- hanya lock form saat benar2 memfilter
      setPage(1);                  // reset ke halaman 1
      setAppliedFilters(filters);  // terapkan draft
      // fetch dipicu oleh useEffect; flag 'filtering' akan dimatikan saat loading false
    }, [filters]);
  
    const resetFilters = useCallback(() => {
      setFiltering(true);
      const reset = {
        nopel: "",
        title: "",
        startDate: "",
        endDate: "",
        sortBy: "createdAt",
        order: "desc",
      };
      setFilters(reset);           // reset draft di form
      setAppliedFilters(reset);    // terapkan reset sebagai applied
      setPage(1);
      // fetch dipicu oleh useEffect
    }, []);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-5">
        {/* Filter */}
        <TaskFilter
          filters={filters}
          setFilters={setFilters}
          loading={filtering}
          onFilterSubmit={applyFilters}
          onFilterReset={resetFilters}
        />

        {/* Tabel */}
        <Suspense fallback={<TableSkeleton rows={10} cols={9} />}>
          <div className="relative mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {loading && (
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/60 backdrop-blur-[1px]">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            )}
            {tasks.length > 0 ? (
              <>
                <TaskTable
                  tasks={tasks}
                  selectedTaskIds={selectedTaskIds}
                  onToggleRow={onToggleRow}
                  onToggleAll={onToggleAll}
                  handleDelete={handleDelete}
                  openApprovalModal={openApprovalModal}
                  page={page}
                  limit={limit}
                  onExport={handleExport}
                  exporting={exporting}
                  showExportButton={true}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  disabled={loading}
                  onPageChange={(next) => {
                    const clamped = Math.max(1, Math.min(totalPages, next));
                    if (clamped !== page) setPage(clamped);
                  }}
                />
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Belum ada data yang bisa dtampilkan.
              </div>
            )}
          </div>
        </Suspense>

        {/* Modal Approval */}
        {showApprovalModal && (
          <ApprovalModal
            taskId={selectedTaskId}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
              fetchUserTasks(page, appliedFilters);
              setShowApprovalModal(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUserTask;
