import React, { Suspense, useEffect, useRef } from "react";

// Lazy load komponen ManageApproval
const ManageApproval = React.lazy(() => import("../../pages/Approval/ManageApproval"));

/** Skeleton ringan untuk isi modal saat lazy component dimuat */
const ModalSkeleton = () => (
  <div className="space-y-5">
    <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
    <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 w-[70%] bg-slate-200 rounded animate-pulse" />
      ))}
    </div>
    <div>
      <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
      <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
    </div>
    <div className="flex justify-end gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

/**
 * Modal approval task
 * Props:
 * - taskId: ID task yang di-approve (string)
 * - onClose: tutup modal
 * - onSuccess: callback setelah approve/reject sukses (mis. reload data)
 */
const ApprovalModal = ({ taskId, onClose, onSuccess }) => {
  const dialogRef = useRef(null);

  // Tutup dengan ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fokus awal & lock scroll body saat modal terbuka
  useEffect(() => {
    dialogRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  if (!taskId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
    >
      <div
        ref={dialogRef}
        className="bg-white p-6 rounded-md shadow-lg w-full max-w-md outline-none"
        tabIndex={-1}
      >
        <Suspense fallback={<ModalSkeleton />}>
          <ManageApproval taskId={taskId} onClose={onClose} onSuccess={onSuccess} />
        </Suspense>
      </div>
    </div>
  );
};

export default ApprovalModal;


