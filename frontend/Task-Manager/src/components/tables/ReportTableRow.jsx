import React, { forwardRef } from "react";
import {
  HiOutlinePrinter,
  HiOutlineLink,
  HiOutlineExternalLink,
  HiOutlineTrash,
} from "react-icons/hi";
import { formatDateId } from "../../utils/formatDateId";

const ReportTableRow = ({ report, onPrint, onAddLink, onVoid }) => {
  const hasAttachment = !!report.attachment;

  return (
    // Perubahan hover ke indigo-50/50 agar beda dengan tabel atas
    <tr className="hover:bg-indigo-50/50 transition-all group cursor-pointer border-b border-slate-50 last:border-none">
      {/* Detail Batch & Admin */}
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-slate-700 leading-none group-hover:text-indigo-600 transition-colors">
            {report.batchId}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1.5 tracking-tighter flex items-center gap-1">
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            {report.generatedByName}
          </span>
        </div>
      </td>

      {/* Status - Menggunakan badge Indigo/Slate */}
      <td className="px-4 py-4 text-center">
        <span
          className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            report.status === "Selesai"
              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
              : "bg-slate-50 text-slate-500 border-slate-200"
          }`}
        >
          {report.status}
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold ring-1 ring-inset ring-slate-200/50 shadow-sm">
          {report.totalTasks}{" "}
          <span className="ml-1 text-[10px] text-slate-400 font-medium">
            Berkas
          </span>
        </span>
      </td>

      {/* Tanggal - Font sedikit lebih halus */}
      <td className="px-4 py-4 text-center text-[11px] font-medium text-slate-500 italic">
        {formatDateId(report.updatedAt)}
      </td>

      {/* Actions - Warna diubah ke Indigo & Blue */}
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end items-center gap-2.5">
          <button
            onClick={onPrint}
            className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-90"
          >
            <HiOutlinePrinter size={14} />
          </button>

          <button
            onClick={onAddLink}
            title={hasAttachment ? "Edit Link Drive" : "Tambah Link Drive"}
            className={`p-2 rounded-xl transition-all shadow-sm active:scale-90 border ${
              hasAttachment
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white"
                : "bg-white text-slate-400 border-slate-200 hover:text-indigo-500 hover:border-indigo-500"
            }`}
          >
            <HiOutlineLink size={14} />
          </button>

          {hasAttachment && (
            <a
              href={report.attachment.driveLink}
              target="_blank"
              rel="noreferrer"
              title="Buka Link Drive"
              className="p-2 rounded-xl bg-white text-blue-500 border border-blue-200 hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <HiOutlineExternalLink size={14} />
            </a>
          )}
          <button
            onClick={onVoid}
            disabled={report.status === "VOID"}
            className={`p-2 rounded-lg transition-all ${
              report.status === "VOID"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white"
            }`}
            title="Void Report"
          >
            <HiOutlineTrash size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ReportTableRow);
