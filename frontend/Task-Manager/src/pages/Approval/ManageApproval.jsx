import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useId,
  memo,
} from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { toast } from "react-toastify";
import { formatDateId } from "../../utils/formatDateId";

/* ================= Info Row ================= */
const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-[fit-content(16ch)_minmax(0,1fr)] sm:grid-cols-[fit-content(17ch)_minmax(0,1fr)] md:grid-cols-[fit-content(18ch)_minmax(0,1fr)] gap-x-2 items-start text-sm">
    <span className="font-medium text-slate-700 whitespace-normal break-words">
      {label}
    </span>
    <span className="text-slate-900 before:content-[':'] before:mr-1 before:text-slate-400 min-w-0 break-words">
      {value ?? "-"}
    </span>
  </div>
);

/* ================= Tombol aksi ================= */
const ActionButton = memo(
  ({ action, loadingAction, onClick, children, color = "green" }) => {
    const isLoading = loadingAction === action;
    const base =
      "px-4 py-2 rounded text-white disabled:opacity-50 focus:outline-none focus-visible:ring w-full sm:w-auto";
    const colorCls =
      color === "red"
        ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400"
        : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-400";

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-busy={isLoading}
        className={`${base} ${colorCls}`}
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
ActionButton.displayName = "ActionButton";

const ManageApproval = ({ taskId, onSuccess, onClose }) => {
  const [note, setNote] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [task, setTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(true);

  const noteId = useId();
  const abortRef = useRef(null);

  const formatTitle = useCallback(
    (t) =>
      String(t || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    []
  );

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
        setTask(res.data);
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

  const createdAt = useMemo(
    () => (task?.createdAt ? formatDateId(task.createdAt) : "-"),
    [task?.createdAt]
  );

  const handleApproval = useCallback(
    async (action) => {
      if (!["approved", "rejected"].includes(action)) {
        toast.error("Tindakan tidak valid");
        return;
      }
      if (loadingAction) return;

      // Cek special case stage 'diteliti'
      if (
        task?.currentStage === "diteliti" &&
        action === "approved" &&
        !task.noSuratPengantar
      ) {
        toast.info(
          "Task tetap lanjut tapi menunggu nomor surat pengantar sebelum dianggap selesai."
        );
      }

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
    [loadingAction, note, task, taskId, onClose, onSuccess]
  );

  if (loadingTask) {
    return (
      <div className="space-y-5">
        <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-[70%] max-w-xs bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
        <div>
          <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
          <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-full sm:w-24 bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-5">
      <h3 id="approval-title" className="text-lg font-semibold text-slate-800">
        Approval Permohonan
      </h3>

      {/* Info Task */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-sm space-y-2">
        <InfoRow label="Nopel" value={task.mainData?.nopel} />
        <InfoRow label="NOP" value={task.mainData?.nop} />
        <InfoRow label="Nama" value={task.additionalData?.[0]?.newName} />
        <InfoRow label="Jenis Permohonan" value={formatTitle(task.title)} />
        <InfoRow label="Tanggal Diajukan" value={createdAt} />
        <InfoRow label="Tahapan Saat Ini" value={task.currentStage} />
        {task.currentStage === "diteliti" && !task.noSuratPengantar && (
          <div className="text-sm text-yellow-600 font-medium mt-1">
            Menunggu nomor surat pengantar sebelum dianggap selesai
          </div>
        )}
      </div>

      {/* Catatan */}
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
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-24"
          placeholder="Masukkan catatan jika diperlukan..."
        />
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring w-full sm:w-auto"
        >
          Batal
        </button>
        <ActionButton
          action="rejected"
          loadingAction={loadingAction}
          onClick={() => handleApproval("rejected")}
          color="red"
        >
          Tolak
        </ActionButton>
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
  );
};

export default ManageApproval;
// import React, {
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   useId,
//   useRef,
//   memo,
// } from "react";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import { toast } from "react-toastify";
// import { formatDateId } from "../../utils/formatDateId";

// /* =========================
//    InfoRow — SELALU 2 KOLOM
//    ========================= */
// const InfoRow = ({ label, value }) => (
//   <div
//     className="
//       grid
//       grid-cols-[fit-content(16ch)_minmax(0,1fr)]
//       sm:grid-cols-[fit-content(17ch)_minmax(0,1fr)]
//       md:grid-cols-[fit-content(18ch)_minmax(0,1fr)]
//       gap-x-2 items-start text-sm
//     "
//   >
//     <span className="font-medium text-slate-700 whitespace-normal break-words">
//       {label}
//     </span>
//     <span className="text-slate-900 before:content-[':'] before:mr-1 before:text-slate-400 min-w-0 break-words">
//       {value ?? "-"}
//     </span>
//   </div>
// );

// /* Tombol aksi — full width di mobile */
// const ActionButton = memo(
//   ({ action, loadingAction, onClick, children, color = "green" }) => {
//     const isLoading = loadingAction === action;
//     const base =
//       "px-4 py-2 rounded text-white disabled:opacity-50 focus:outline-none focus-visible:ring w-full sm:w-auto";
//     const colorCls =
//       color === "red"
//         ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400"
//         : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-400";
//     return (
//       <button
//         type="button"
//         onClick={onClick}
//         disabled={isLoading}
//         aria-busy={isLoading}
//         className={`${base} ${colorCls}`}
//       >
//         {isLoading
//           ? action === "approved"
//             ? "Menyetujui..."
//             : "Menolak..."
//           : children}
//       </button>
//     );
//   }
// );
// ActionButton.displayName = "ActionButton";

// const ManageApproval = ({ taskId, onSuccess, onClose }) => {
//   const [note, setNote] = useState("");
//   const [loadingAction, setLoadingAction] = useState(""); // "approved" | "rejected" | ""
//   const [task, setTask] = useState(null);
//   const [loadingTask, setLoadingTask] = useState(true);

//   const noteId = useId();
//   const abortRef = useRef(null);

//   const formatTitle = useCallback(
//     (t) =>
//       String(t || "")
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (c) => c.toUpperCase()),
//     []
//   );

//   // Fetch task detail (abort-safe)
//   useEffect(() => {
//     if (!taskId) return;

//     const ctrl = new AbortController();
//     abortRef.current?.abort();
//     abortRef.current = ctrl;

//     const run = async () => {
//       try {
//         setLoadingTask(true);
//         const res = await axiosInstance.get(
//           API_PATHS.TASK.GET_TASK_BY_ID(taskId),
//           { signal: ctrl.signal }
//         );
//         setTask(res.data);
//       } catch (err) {
//         if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
//           return;
//         toast.error(
//           err?.response?.data?.message || "Gagal memuat data permohonan"
//         );
//         onClose?.();
//       } finally {
//         setLoadingTask(false);
//       }
//     };

//     run();
//     return () => ctrl.abort();
//   }, [taskId, onClose]);

//   const createdAt = useMemo(
//     () => (task?.createdAt ? formatDateId(task.createdAt) : "-"),
//     [task?.createdAt]
//   );

//   const handleApproval = useCallback(
//     async (action) => {
//       if (!["approved", "rejected"].includes(action)) {
//         toast.error("Tindakan tidak valid");
//         return;
//       }
//       if (loadingAction) return;

//       setLoadingAction(action);
//       try {
//         const res = await axiosInstance.patch(
//           API_PATHS.TASK.APPROVE_TASK(taskId),
//           { action, note }
//         );
//         toast.success(res?.data?.message || `Task berhasil di-${action}`);
//         onSuccess?.();
//         onClose?.();
//       } catch (err) {
//         toast.error(
//           err?.response?.data?.message || "Gagal memperbarui approval"
//         );
//       } finally {
//         setLoadingAction("");
//       }
//     },
//     [loadingAction, note, onClose, onSuccess, taskId]
//   );

//   if (loadingTask) {
//     // Skeleton ringkas
//     return (
//       <div className="space-y-5">
//         <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
//         <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
//           {Array.from({ length: 4 }).map((_, i) => (
//             <div
//               key={i}
//               className="h-4 w-[70%] max-w-xs bg-slate-200 rounded animate-pulse"
//             />
//           ))}
//         </div>
//         <div>
//           <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
//           <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
//         </div>
//         <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
//           {Array.from({ length: 3 }).map((_, i) => (
//             <div
//               key={i}
//               className="h-9 w-full sm:w-24 bg-slate-200 rounded animate-pulse"
//             />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (!task) return null;

//   return (
//     <div className="space-y-5">
//       <h3 id="approval-title" className="text-lg font-semibold text-slate-800">
//         Approval Permohonan
//       </h3>

//       {/* Informasi Task */}
//       <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-sm space-y-2">
//         <InfoRow label="Nopel" value={task.mainData?.nopel} />
//         <InfoRow label="NOP" value={task.mainData?.nop} />
//         <InfoRow label="Nama" value={task.additionalData?.[0]?.newName} />
//         <InfoRow label="Jenis Permohonan" value={formatTitle(task.title)} />
//         <InfoRow label="Tanggal Diajukan" value={createdAt} />
//         <InfoRow label="Tahapan Saat Ini" value={task.currentStage} />
//       </div>

//       {/* Catatan */}
//       <div>
//         <label
//           htmlFor={noteId}
//           className="block text-sm font-medium text-slate-700 mb-1"
//         >
//           Catatan (Opsional)
//         </label>
//         <textarea
//           id={noteId}
//           rows={4}
//           value={note}
//           onChange={(e) => setNote(e.target.value)}
//           className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-24"
//           placeholder="Masukkan catatan jika diperlukan..."
//         />
//       </div>

//       {/* Tombol Aksi */}
//       <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
//         <button
//           type="button"
//           onClick={onClose}
//           className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring w-full sm:w-auto"
//         >
//           Batal
//         </button>
//         <ActionButton
//           action="rejected"
//           loadingAction={loadingAction}
//           onClick={() => handleApproval("rejected")}
//           color="red"
//         >
//           Tolak
//         </ActionButton>
//         <ActionButton
//           action="approved"
//           loadingAction={loadingAction}
//           onClick={() => handleApproval("approved")}
//           color="green"
//         >
//           Setujui
//         </ActionButton>
//       </div>
//     </div>
//   );
// };

// export default ManageApproval;
