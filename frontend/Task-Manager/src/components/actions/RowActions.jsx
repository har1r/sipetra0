import React from "react";
import { CheckCircleIcon, EyeIcon } from "@heroicons/react/24/outline";

const RowActions = ({ task, onApprove }) => {
  // Tombol checklist HANYA hilang jika status database benar-benar SELESAI/DITOLAK
  const isFinal = task.status === "SELESAI" || task.status === "DITOLAK";

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        title="Lihat Detail"
        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
        onClick={() =>
          (window.location.href = `/dashboard/tasks/${task._id || task.id}`)
        }
      >
        <EyeIcon className="w-5 h-5" />
      </button>

      {!isFinal && (
        <button
          type="button"
          title="Verifikasi"
          onClick={onApprove}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <CheckCircleIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default RowActions;
