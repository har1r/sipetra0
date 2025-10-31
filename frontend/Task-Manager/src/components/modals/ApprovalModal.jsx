import React, { Suspense, useRef, useEffect } from "react";

// Lazy load komponen utama
const ManageApproval = React.lazy(() =>
  import("../../pages/Approval/ManageApproval")
);

// Skeleton loader saat ManageApproval dimuat
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

const ApprovalModal = ({ taskId, onClose, onSuccess }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!taskId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white p-6 rounded-md shadow-lg w-full max-w-md outline-none"
        tabIndex={-1}
      >
        <Suspense fallback={<ModalSkeleton />}>
          <ManageApproval
            taskId={taskId}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default ApprovalModal;
// import React, { Suspense, useEffect, useRef } from "react";

// // Lazy load komponen utama
// const ManageApproval = React.lazy(() =>
//   import("../../pages/Approval/ManageApproval")
// );

// /** Skeleton loader saat komponen ManageApproval dimuat */
// const ModalSkeleton = () => (
//   <div className="space-y-5">
//     <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
//     <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
//       {Array.from({ length: 4 }).map((_, index) => (
//         <div
//           key={index}
//           className="h-4 w-[70%] bg-slate-200 rounded animate-pulse"
//         />
//       ))}
//     </div>
//     <div>
//       <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
//       <div className="h-20 w-full bg-slate-100 rounded animate-pulse" />
//     </div>
//     <div className="flex justify-end gap-2">
//       {Array.from({ length: 3 }).map((_, index) => (
//         <div
//           key={index}
//           className="h-9 w-24 bg-slate-200 rounded animate-pulse"
//         />
//       ))}
//     </div>
//   </div>
// );

// /**
//  * Modal persetujuan task
//  * @param {string} taskId - ID task yang sedang diproses
//  * @param {Function} onClose - Fungsi untuk menutup modal
//  * @param {Function} onSuccess - Callback setelah aksi approve/reject berhasil
//  */
// const ApprovalModal = ({ taskId, onClose, onSuccess }) => {
//   const dialogRef = useRef(null);

//   // Tutup modal dengan tombol ESC
//   useEffect(() => {
//     const handleKeyPress = (event) => {
//       if (event.key === "Escape") onClose?.();
//     };
//     window.addEventListener("keydown", handleKeyPress);
//     return () => window.removeEventListener("keydown", handleKeyPress);
//   }, [onClose]);

//   // Kunci scroll body & fokuskan dialog saat modal terbuka
//   useEffect(() => {
//     const previousOverflow = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     dialogRef.current?.focus();

//     return () => {
//       document.body.style.overflow = previousOverflow;
//     };
//   }, []);

//   if (!taskId) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
//       onClick={(e) => e.target === e.currentTarget && onClose?.()}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="approval-modal-title"
//     >
//       <div
//         ref={dialogRef}
//         className="bg-white p-6 rounded-md shadow-lg w-full max-w-md outline-none"
//         tabIndex={-1}
//       >
//         <Suspense fallback={<ModalSkeleton />}>
//           <ManageApproval
//             taskId={taskId}
//             onClose={onClose}
//             onSuccess={onSuccess}
//           />
//         </Suspense>
//       </div>
//     </div>
//   );
// };

// export default ApprovalModal;
