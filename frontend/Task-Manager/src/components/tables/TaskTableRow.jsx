import React from "react";
import {
  HiOutlinePrinter,
  HiOutlineLink,
  HiOutlineExternalLink,
} from "react-icons/hi";
import { FaSquareCheck, FaRegSquare } from "react-icons/fa6";
import { formatDateId } from "../../utils/formatDateId";

const TaskTableRow = ({ task, isSelected, onSelect, onPrint, onAddLink }) => {
  const hasAttachment = task.attachment.length > 0;

  const renderBatchStatus = () => {
    if (task.reportId) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-tight">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          {task.displayBatchId}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
        Antrean
      </span>
    );
  };

  return (
    <tr
      className={`hover:bg-slate-50/80 transition-all group cursor-pointer ${
        isSelected ? "bg-emerald-50/30" : ""
      }`}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <td
        className="px-6 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSelect}
          className="text-lg transition-all active:scale-90"
        >
          {isSelected ? (
            <FaSquareCheck className="text-emerald-600 animate-in zoom-in duration-200" />
          ) : (
            <FaRegSquare className="text-slate-200 group-hover:text-emerald-200" />
          )}
        </button>
      </td>

      {/* Identitas Berkas */}
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-slate-700 leading-none">
            {task.mainData?.nopel}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1 tracking-tighter">
            {task.mainData?.nop}
          </span>
        </div>
      </td>

      {/* WP & Layanan */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-700 uppercase leading-tight">
            {task.additionalData?.[0]?.newName || "TANPA NAMA"}
          </span>
          <span className="inline-flex w-fit px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-tighter">
            {task.title}
          </span>
        </div>
      </td>

      {/* Batch ID */}
      <td className="px-4 py-4 text-center">{renderBatchStatus()}</td>

      {/* Tanggal */}
      <td className="px-4 py-4 text-center text-[11px] font-bold text-slate-600">
        {formatDateId(task.updatedAt)}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center items-center gap-2">
          {task.title === "Mutasi Sebagian" && (
            <button
              onClick={onPrint}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <HiOutlinePrinter size={14} />
            </button>
          )}

          <button
            onClick={onAddLink}
            title={hasAttachment ? "Edit Link Drive" : "Tambah Link Drive"}
            className={`p-2 rounded-lg transition-all shadow-sm active:scale-90 border ${
              hasAttachment
                ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white"
                : "bg-white text-slate-400 border-slate-200 hover:text-emerald-500 hover:border-emerald-500"
            }`}
          >
            <HiOutlineLink size={14} />
          </button>

          {/* {hasAttachment && (
            <a
              href={task.attachment.driveLink}
              target="_blank"
              rel="noreferrer"
              title="Buka Link Drive"
              className="p-2 rounded-lg bg-white text-blue-500 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <HiOutlineExternalLink size={14} />
            </a>
          )} */}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(TaskTableRow);
