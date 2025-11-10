import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  memo,
  Suspense,
} from "react";
import toast from "react-hot-toast";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { formatDateId } from "../../utils/formatDateId";

/* ================= Skeleton Loader ================= */
const ModalSkeleton = () => (
  <div className="space-y-5">
    <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
    <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-[70%] bg-slate-200 rounded animate-pulse"
        />
      ))}
    </div>
    <div>
      <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
      <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="flex justify-end gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-9 w-24 bg-slate-200 rounded animate-pulse"
        />
      ))}
    </div>
  </div>
);

/* ================= Info Row ================= */
const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[fit-content(17ch)_minmax(0,1fr)] gap-x-2 items-start text-sm">
    <span className="font-medium text-slate-700 whitespace-normal break-words">
      {label}
    </span>
    <span className="text-slate-900 before:content-[':'] before:mr-1 before:text-slate-400 min-w-0 break-words">
      {value ?? "-"}
    </span>
  </div>
);

/* ================= Tombol Aksi ================= */
const ActionButton = memo(
  ({ action, loadingAction, onClick, children, color = "green" }) => {
    const isLoading = loadingAction === action;
    const base =
      "px-4 py-2 rounded text-white disabled:opacity-50 focus:outline-none focus-visible:ring w-full sm:w-auto transition-all duration-200";
    const colorCls =
      color === "red"
        ? "bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 focus-visible:ring-red-400"
        : "bg-gradient-to-r from-emerald-400 via-green-500 to-lime-500 hover:brightness-110 focus-visible:ring-emerald-400";

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`${base} ${colorCls}`}
        displayName={"ActionButton"}
      >
        {isLoading
          ? action === "approved"
            ? "Menyetujui..."
            : "Menolak..."
          : children}
      </button>
    );
  }
);

/* ================= Komponen Utama ================= */
const ApprovalModal = ({ taskId, onClose, onSuccess, userRole }) => {
  const [note, setNote] = useState("");
  const [task, setTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingAction, setLoadingAction] = useState("");

  const noteId = useId();
  const abortRef = useRef(null);
  const dialogRef = useRef(null);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyPress = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose]);

  // Nonaktifkan scroll saat modal terbuka
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* === Fetch task by ID === */
  useEffect(() => {
    if (!taskId) return;
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;

    const run = async () => {
      try {
        setLoadingTask(true);
        const res = await axiosInstance.get(
          API_PATHS.TASK.GET_TASK_BY_ID(taskId),
          { signal: ctrl.signal }
        );
        setTask(res?.data || null);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
          return;
        toast.error(
          err?.response?.data?.message || "Gagal memuat data permohonan"
        );
        onClose?.();
      } finally {
        setLoadingTask(false);
      }
    };

    run();
    return () => ctrl.abort();
  }, [taskId, onClose]);

  const formatTitle = useCallback(
    (t) =>
      String(t || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    []
  );

  const createdAt = useMemo(
    () => (task?.createdAt ? formatDateId(task.createdAt) : "-"),
    [task?.createdAt]
  );

  /* === Handle Approve/Reject === */
  const handleApproval = useCallback(
    async (action) => {
      if (!["approved", "rejected"].includes(action)) {
        toast.error("Tindakan tidak valid");
        return;
      }

      // Batasi reject hanya untuk peneliti di stage 'diteliti'
      const isPenelitiReject =
        userRole === "peneliti" && task?.currentStage === "diteliti";
      if (action === "rejected" && !isPenelitiReject && userRole !== "admin") {
        toast.error(
          "Hanya peneliti di tahap 'diteliti' yang dapat melakukan penolakan."
        );
        return;
      }

      if (loadingAction) return;
      setLoadingAction(action);

      try {
        const res = await axiosInstance.patch(
          API_PATHS.TASK.APPROVE_TASK(taskId),
          { action, note }
        );
        toast.success(res?.data?.message || `Task berhasil di-${action}`);
        onSuccess?.();
        onClose?.();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Gagal memperbarui approval"
        );
      } finally {
        setLoadingAction("");
      }
    },
    [loadingAction, note, task, taskId, userRole, onClose, onSuccess]
  );

  if (!taskId) return null;
  console.log("🚀 Render ApprovalModal untuk taskId:" + task);

  /* === Pastikan struktur data selalu aman === */
  const safeMain = task?.mainData || {};
  const safeAdditional = Array.isArray(task?.additionalData)
    ? task.additionalData[0] || {}
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md outline-none border border-emerald-100 focus:outline-none"
        tabIndex={-1}
      >
        <Suspense fallback={<ModalSkeleton />}>
          {loadingTask ? (
            <ModalSkeleton />
          ) : !task ? (
            <p className="text-center text-slate-600">
              Data permohonan tidak ditemukan.
            </p>
          ) : (
            <div className="space-y-5">
              <h3
                id="approval-title"
                className="text-xl font-bold text-slate-800"
              >
                Approval Permohonan
              </h3>

              {/* === Info Utama === */}
              <div className="bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-100 rounded-md p-4 text-sm space-y-2 shadow-sm">
                <InfoRow label="Nopel" value={safeMain.nopel} />
                <InfoRow label="NOP" value={safeMain.nop} />
                <InfoRow label="Nama Baru" value={safeAdditional.newName} />
                <InfoRow label="Nama Lama" value={safeMain.oldName} />
                <InfoRow label="Alamat" value={safeMain.address} />
                <InfoRow label="Desa" value={safeMain.village} />
                <InfoRow label="Kecamatan" value={safeMain.subdistrict} />
                <InfoRow
                  label="Jenis Permohonan"
                  value={formatTitle(task.title)}
                />
                <InfoRow label="Tanggal Diajukan" value={createdAt} />
                <InfoRow label="Tahapan Saat Ini" value={task.currentStage} />
                <InfoRow
                  label="Status Keseluruhan"
                  value={task.overallStatus}
                />
              </div>

              {/* === Catatan === */}
              <div>
                <label
                  htmlFor={noteId}
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Catatan (Opsional)
                </label>
                <textarea
                  id={noteId}
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y min-h-24"
                  placeholder="Masukkan catatan jika diperlukan..."
                />
              </div>

              {/* === Tombol Aksi === */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring w-full sm:w-auto"
                >
                  Batal
                </button>

                {/* Tampilkan tombol reject hanya jika peneliti di tahap 'diteliti' */}
                {["peneliti", "admin"].includes(userRole) &&
                  task.currentStage === "diteliti" && (
                    <ActionButton
                      action="rejected"
                      loadingAction={loadingAction}
                      onClick={() => handleApproval("rejected")}
                      color="red"
                    >
                      Tolak
                    </ActionButton>
                  )}

                <ActionButton
                  action="approved"
                  loadingAction={loadingAction}
                  onClick={() => handleApproval("approved")}
                  color="green"
                >
                  Setujui
                </ActionButton>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default ApprovalModal;
