import React from "react";
import { formatDateId } from "../../utils/formatDateId";

const DelayedTaskTable = ({ tasks = [] }) => {
  const isScrollable = tasks.length > 10;

  return (
    <div className="w-full bg-white rounded-[1.5rem] md:rounded-[2rem] border border-rose-200 shadow-md overflow-hidden">
      {/* 1. Header Alert - Responsive Padding */}
      <div className="bg-rose-600 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center">
        <h3 className="text-white font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 md:gap-3">
          <span className="flex h-2 w-2 rounded-full bg-white animate-ping"></span>
          <span className="truncate">Alert: Terlambat {">"} 14 Hari ({tasks.length})</span>
        </h3>
        <span className="text-[8px] md:text-[10px] bg-rose-700 text-rose-100 px-2 md:px-3 py-1 rounded-full font-bold whitespace-nowrap">
          PERLU TINDAKAN
        </span>
      </div>

      {/* 2. Wrapper Scroll Horizontal untuk Mobile */}
      <div className="w-full overflow-x-auto custom-scrollbar">
        {/* Min-width memastikan tabel tidak "penyok" di layar HP */}
        <div className="min-w-[800px] md:min-w-full">
          
          {/* Header Tabel Statik */}
          <div className="bg-slate-50 border-b border-slate-200">
            <table className="w-full text-left table-fixed">
              <thead>
                <tr className="text-[10px] md:text-[11px] text-slate-600 uppercase tracking-wider font-bold">
                  <th className="px-4 md:px-6 py-3 md:py-4 w-[50px] md:w-[60px]">No</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 w-1/3 text-slate-800">Nopel / NOP</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 w-1/4 text-slate-800">Nama Pemohon</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 w-1/4 text-slate-800">Layanan</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-center w-1/6 text-slate-800">Tahap</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-right w-1/4 text-slate-800">Telat</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* 3. Area Scrollable Vertical */}
          <div
            className="relative w-full overflow-hidden bg-white"
            style={{ height: "400px" }}
          >
            <div
              className={`w-full ${isScrollable ? "animate-vertical-scroll" : ""}`}
            >
              <table className="w-full text-left border-collapse table-fixed">
                <tbody>
                  {tasks.map((task, idx) => (
                    <DelayedTaskTableRow
                      key={`${task.id}-${idx}`}
                      task={task}
                      idx={idx}
                    />
                  ))}

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
      </div>
      
      {/* 4. Mobile Indicator (Hanya muncul di layar kecil) */}
      <div className="md:hidden bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-center">
        <p className="text-[9px] font-bold text-slate-400 italic uppercase tracking-tighter">
          ← Geser untuk melihat detail data →
        </p>
      </div>
    </div>
  );
};

const DelayedTaskTableRow = ({ task, idx }) => {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors duration-150">
      <td className="px-4 md:px-6 py-3 md:py-4 w-[50px] md:w-[60px]">
        <span className="text-xs md:text-sm font-bold text-slate-400">
          {(idx + 1).toString().padStart(2, '0')}
        </span>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 w-1/3">
        <div className="flex flex-col">
          <span className="text-xs md:text-sm font-bold text-slate-900 truncate">
            {task.nopel}
          </span>
          <span className="text-[9px] md:text-[11px] text-emerald-700 font-mono font-bold truncate">
            {task.nop}
          </span>
        </div>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 w-1/4">
        <span className="text-xs md:text-sm font-semibold text-slate-700 block truncate capitalize">
          {task.name?.toLowerCase()}
        </span>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 w-1/4">
        <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-tight block truncate">
          {task.title}
        </span>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 text-center w-1/6">
        <span className="text-[9px] md:text-[10px] px-2 py-0.5 md:py-1 rounded-md bg-amber-100 text-amber-800 font-black uppercase border border-amber-200 inline-block whitespace-nowrap">
          {task.currentStage}
        </span>
      </td>
      <td className="px-4 md:px-6 py-3 md:py-4 text-right w-1/4">
        <div className="flex flex-col items-end">
          <span className="text-sm md:text-base font-black text-rose-600 leading-none">
            {task.daysPending} Hari
          </span>
          <span className="text-[9px] md:text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
            {formatDateId(task.createdAt)}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(DelayedTaskTable);