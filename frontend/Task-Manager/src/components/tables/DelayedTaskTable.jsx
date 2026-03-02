import React from "react";
import { formatDateId } from "../../utils/formatDateId";

const DelayedTaskTable = ({ tasks = [] }) => {
  const isScrollable = tasks.length > 10;

  return (
    <div className="w-full bg-white/70 backdrop-blur-md rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
      {/* 1. Judul Alert (Statik) */}
      <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
        <h3 className="text-rose-800 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
          Alert: Berkas belum dikirim melebihi 2 minggu ({tasks.length})
        </h3>
      </div>

      {/* 2. Header Tabel (Statik & Terpisah dari Animasi) */}
      <div className="bg-white/90 border-b border-emerald-50 z-20">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="text-[11px] text-emerald-800 uppercase tracking-widest">
              <th className="px-6 py-3 font-bold w-[60px]">No</th>
              <th className="px-6 py-3 font-bold w-1/3">Nopel / NOP</th>
              <th className="px-6 py-3 font-bold w-1/4">Nama</th>
              <th className="px-6 py-3 font-bold w-1/4">Layanan</th>
              <th className="px-6 py-3 font-bold text-center w-1/6">Tahap</th>
              <th className="px-6 py-3 font-bold text-right w-1/4">Telat</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* 3. Area Scrollable (Hanya Body yang bergerak) */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "400px" }}
      >
        <div
          className={`w-full ${isScrollable ? "animate-vertical-scroll" : ""}`}
        >
          <table className="w-full text-left border-collapse table-fixed">
            <tbody>
              {/* Render data utama */}
              {tasks.map((task, idx) => (
                <DelayedTaskTableRow
                  key={`${task.id}-${idx}`}
                  task={task}
                  idx={idx}
                />
              ))}

              {/* Duplikasi data untuk looping (Seamless) */}
              {isScrollable &&
                tasks.map((task, idx) => (
                  <DelayedTaskTableRow
                    idx={idx}
                    key={`clone-${task.id}-${idx}`}
                    task={task}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DelayedTaskTableRow = ({ task, idx }) => {
  return (
    <tr className="border-b border-emerald-50/50 hover:bg-rose-50/30 transition-colors">
      <td className="px-6 py-4 w-[60px]">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-900">{idx + 1}</span>
        </div>
      </td>
      <td className="px-6 py-4 w-1/3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-900 truncate">
            {task.nopel}
          </span>
          <span className="text-[10px] text-emerald-600 font-mono truncate">
            {task.nop}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 w-1/4">
        <span className="text-xs font-medium text-emerald-800 block truncate">
          {task.name}
        </span>
      </td>
      <td className="px-6 py-4 w-1/4">
        <span className="text-xs font-medium text-emerald-800 block truncate">
          {task.title}
        </span>
      </td>
      <td className="px-6 py-4 text-center w-1/6">
        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 font-bold uppercase whitespace-nowrap">
          {task.currentStage}
        </span>
      </td>
      <td className="px-6 py-4 text-right w-1/4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-rose-600">
            {task.daysPending} Hari
          </span>
          <span className="text-[9px] text-slate-400 italic">
            {formatDateId(task.createdAt)}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(DelayedTaskTable);
