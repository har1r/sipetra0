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
import TableSkeleton from "../../components/Skeletons/TableSkeleton";
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
  const role = String(user?.role || "").toLowerCase();
  const isResearcher = role === "peneliti";

  // ====== UI / Data state ======
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(MAX_LIMIT); // backend max limit

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // reserved if needed

  // collapse state for rows { [id]: boolean }
  const [openRows, setOpenRows] = useState({});

  // approval modal
  const [approvalTaskId, setApprovalTaskId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // filter state (maps to controller query params)
  const [filters, setFilters] = useState({
    title: "",
    newName: "",
    nopel: "",
    currentStage: "",
    overallStatus: "", // Diproses / Ditolak / Selesai
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  });

  // local abort controllers
  const fetchCtrl = useRef(null);

  // pagination totalPages
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  // helper: build query params from filters + page
  const buildQueryParams = useCallback(() => {
    const p = {
      page,
      limit,
      sortBy: ALLOWED_SORT_FIELDS.includes(filters.sortBy)
        ? filters.sortBy
        : "createdAt",
      order: filters.order === "asc" ? "asc" : "desc",
    };

    if (filters.title) p.title = filters.title;
    if (filters.newName) p.newName = filters.newName;
    if (filters.nopel) p.nopel = filters.nopel;
    if (filters.currentStage) p.currentStage = filters.currentStage;
    if (filters.overallStatus) p.overallStatus = filters.overallStatus;
    if (filters.startDate) p.startDate = filters.startDate;
    if (filters.endDate) p.endDate = filters.endDate;

    return p;
  }, [filters, page, limit]);

  // fetch tasks from API
  const fetchTasks = useCallback(
    async (opts = {}) => {
      fetchCtrl.current?.abort();
      const controller = new AbortController();
      fetchCtrl.current = controller;

      setLoading(true);
      try {
        const params = opts.params ?? buildQueryParams();
        const { data } = await axiosInstance.get(API_PATHS.TASK.GET_ALL_TASKS, {
          params,
          signal: controller.signal,
        });

        // expect { tasks: [], total, page, limit, ... }
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setTotal(Number(data.total || 0));
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
          // aborted — ignore
        } else {
          console.error("Fetch tasks error:", err);
          toast.error("Gagal mengambil data. Coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams]
  );

  // initial fetch & when page/filters change
  useEffect(() => {
    fetchTasks();
    return () => {
      fetchCtrl.current?.abort();
    };
  }, [fetchTasks, page, filters.sortBy, filters.order]);

  // filter submit handler
  const handleApplyFilters = useCallback(() => {
    setPage(1);
    // buildQueryParams uses filters state, so just fetch
    fetchTasks();
  }, [fetchTasks]);

  const handleResetFilters = useCallback(() => {
    setFilters({
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
    setPage(1);
  }, []);

  // collapse toggle
  const toggleCollapse = useCallback((id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // open approval modal
  const openApproval = useCallback((taskId) => {
    setApprovalTaskId(taskId);
    setShowApprovalModal(true);
  }, []);

  // helper: status color classes
  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "selesai") return "bg-emerald-100 text-emerald-800";
    if (s === "ditolak") return "bg-rose-100 text-rose-800";
    return "bg-amber-100 text-amber-800";
  };

  console.log("isi tasks:", tasks);
  // basic table row renderer following backend formatting rules:
  // main row uses mainData + additionalData[0]
  // additional rows (slice(1)) override newName, landWide, buildingWide; oldName always from mainData.oldName
  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="mt-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manage Tasks</h1>
            <p className="text-sm text-slate-600 mt-1">
              Daftar permohonan — lihat, filter, dan navigasi halaman
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 text-white px-3 py-2 text-sm font-semibold shadow hover:brightness-95 transition"
              onClick={() => {
                setFilters((f) => ({
                  ...f,
                  order: f.order === "asc" ? "desc" : "asc",
                }));
              }}
              title="Toggle sort order"
            >
              Sort: {filters.sortBy} · {filters.order}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Cari judul..."
              value={filters.title}
              onChange={(e) =>
                setFilters((p) => ({ ...p, title: e.target.value }))
              }
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Nama baru..."
              value={filters.newName}
              onChange={(e) =>
                setFilters((p) => ({ ...p, newName: e.target.value }))
              }
            />
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="NOPEL..."
              value={filters.nopel}
              onChange={(e) =>
                setFilters((p) => ({ ...p, nopel: e.target.value }))
              }
            />
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.currentStage}
              onChange={(e) =>
                setFilters((p) => ({ ...p, currentStage: e.target.value }))
              }
            >
              <option value="">Semua Tahapan</option>
              <option value="verifikasi">Verifikasi</option>
              <option value="proses">Proses</option>
              <option value="selesai">Selesai</option>
            </select>

            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.overallStatus}
              onChange={(e) =>
                setFilters((p) => ({ ...p, overallStatus: e.target.value }))
              }
            >
              <option value="">Semua Status</option>
              <option value="Diproses">Diproses</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Selesai">Selesai</option>
            </select>

            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
            />

            <input
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
            />

            <div className="flex items-center gap-2">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, sortBy: e.target.value }))
                }
              >
                <option value="createdAt">Tanggal</option>
                <option value="title">Judul</option>
                <option value="currentStage">Tahapan</option>
              </select>

              <button
                onClick={handleApplyFilters}
                className="rounded-lg bg-emerald-500 text-white px-3 py-2 text-sm font-medium shadow hover:brightness-105 transition"
              >
                Terapkan
              </button>

              <button
                onClick={handleResetFilters}
                className="rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Card: table */}
        <div className="rounded-xl border bg-white p-3 shadow-sm relative">
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 rounded-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-900">
                <tr>
                  <th className="border-b px-3 py-2 w-10 text-center">No</th>
                  <th className="border-b px-3 py-2 text-left">Tanggal</th>
                  <th className="border-b px-3 py-2 text-left">NOPEL</th>
                  <th className="border-b px-3 py-2 text-left">NOP</th>
                  <th className="border-b px-3 py-2 text-left">Nama Baru</th>
                  <th className="border-b px-3 py-2 text-left">Nama Lama</th>
                  <th className="border-b px-3 py-2 text-center">Luas Tanah</th>
                  <th className="border-b px-3 py-2 text-center">
                    Luas Bangunan
                  </th>
                  <th className="border-b px-3 py-2 text-left">
                    Jenis Permohonan
                  </th>
                  <th className="border-b px-3 py-2 text-center">Tahapan</th>
                  <th className="border-b px-3 py-2 text-center">Status</th>
                  <th className="border-b px-3 py-2 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
                {tasks.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  tasks.map((t, i) => {
                    const id = t.id ?? t._id ?? `${i}`;
                    const firstAdd = Array.isArray(t.additionalData)
                      ? t.additionalData[0] ?? {}
                      : {};

                    const createdAt = t.createdAt
                      ? dateFormatter.format(new Date(t.createdAt))
                      : "-";
                    const newNameMain = firstAdd.newName ?? "-";
                    const oldName = t.oldName ?? "-";
                    const landMain = firstAdd.landWide ?? "-";
                    const buildMain = firstAdd.buildingWide ?? "-";

                    const isOpen = Boolean(openRows[id]);

                    return (
                      <React.Fragment key={id}>
                        <tr className="transition-colors hover:bg-indigo-50/40">
                          <td className="border-b px-3 py-2 text-left">
                            {(page - 1) * limit + i + 1}
                          </td>
                          <td className="border-b px-3 py-2">{createdAt}</td>
                          <td className="border-b px-3 py-2">
                            {t.nopel ?? "-"}
                          </td>
                          <td className="border-b px-3 py-2">{t.nop ?? "-"}</td>
                          <td className="border-b px-3 py-2">{newNameMain}</td>
                          <td className="border-b px-3 py-2">{oldName}</td>
                          <td className="border-b px-3 py-2 text-center">
                            {landMain}
                          </td>
                          <td className="border-b px-3 py-2 text-center">
                            {buildMain}
                          </td>
                          <td className="border-b px-3 py-2">
                            {t.title ?? "-"}
                          </td>
                          <td className="border-b px-3 py-2 text-center">
                            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs">
                              {t.currentStage ?? "-"}
                            </span>
                          </td>
                          <td className="border-b px-3 py-2 text-center">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                                t.status
                              )}`}
                            >
                              {t.status ?? "-"}
                            </span>
                          </td>
                          <td className="border-b px-3 py-2">
                            <div className="flex items-center gap-2">
                              <RowActions
                                id={id}
                                showDetail={true}
                                showEdit={true}
                                showApproval={true}
                                showDeleteBtn={false}
                                onApprove={() => openApproval(id)}
                                onDelete={() => {}}
                              />

                              {Array.isArray(t.additionalData) &&
                                t.additionalData.length > 1 && (
                                  <button
                                    onClick={() => toggleCollapse(id)}
                                    className="text-xs px-2 py-1 rounded hover:bg-slate-100"
                                    aria-expanded={isOpen}
                                    title={
                                      isOpen
                                        ? "Tutup detail"
                                        : "Tampilkan detail"
                                    }
                                  >
                                    {isOpen ? "▼" : "▶"}
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>

                        {/* additional rows (slice(1)) */}
                        {isOpen &&
                          Array.isArray(t.additionalData) &&
                          t.additionalData.slice(1).map((ad, idx) => (
                            <tr
                              key={`${id}-ad-${idx}`}
                              className="bg-slate-50/70"
                            >
                              <td className="border-b"></td>
                              <td className="border-b px-3 py-2 text-slate-600">
                                Pecahan {idx + 2}
                              </td>
                              <td className="border-b px-3 py-2">{t.nopel}</td>
                              <td className="border-b px-3 py-2">{t.nop}</td>

                              {/* newName from ad */}
                              <td className="border-b px-3 py-2">
                                {ad.newName ?? "-"}
                              </td>

                              {/* oldName always from main */}
                              <td className="border-b px-3 py-2">{oldName}</td>

                              <td className="border-b px-3 py-2 text-center">
                                {ad.landWide ?? "-"}
                              </td>
                              <td className="border-b px-3 py-2 text-center">
                                {ad.buildingWide ?? "-"}
                              </td>
                              <td className="border-b px-3 py-2">
                                {t.title ?? "-"}
                              </td>
                              <td className="border-b px-3 py-2 text-center">
                                <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs">
                                  {t.currentStage ?? "-"}
                                </span>
                              </td>
                              <td className="border-b px-3 py-2 text-center">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                                    t.status
                                  )}`}
                                >
                                  {t.status ?? "-"}
                                </span>
                              </td>
                              <td className="border-b"></td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Menampilkan {(page - 1) * limit + (tasks.length > 0 ? 1 : 0)} -{" "}
              {(page - 1) * limit + tasks.length} dari {total}
            </div>

            <div>
              <Pagination
                page={page}
                totalPages={totalPages}
                disabled={loading}
                onPageChange={(p) =>
                  setPage(Math.max(1, Math.min(totalPages, p)))
                }
              />
            </div>
          </div>
        </div>

        {/* Approval modal */}
        {showApprovalModal && (
          <ApprovalModal
            taskId={approvalTaskId}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
              fetchTasks();
              setShowApprovalModal(false);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageUserTask;
