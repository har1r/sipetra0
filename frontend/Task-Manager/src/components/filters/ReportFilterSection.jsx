import React from "react";
import { HiOutlineSearch, HiFilter } from "react-icons/hi";

const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors uppercase">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm`}
      />
    </div>
  </div>
);

const ReportFilterSection = ({ filterDraft, setFilterDraft, onApply }) => {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col lg:flex-row items-end gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow w-full">
        <FilterInput
          label="Pencarian Nopel"
          icon={HiOutlineSearch}
          placeholder="Masukkan Nopel..."
          value={filterDraft.nopel}
          onChange={(e) =>
            setFilterDraft({ ...filterDraft, nopel: e.target.value })
          }
        />
        <FilterInput
          label="Mulai Tanggal"
          type="date"
          value={filterDraft.startDate}
          onChange={(e) =>
            setFilterDraft({ ...filterDraft, startDate: e.target.value })
          }
        />
        <FilterInput
          label="Sampai Tanggal"
          type="date"
          value={filterDraft.endDate}
          onChange={(e) =>
            setFilterDraft({ ...filterDraft, endDate: e.target.value })
          }
        />
        <div className="group space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest uppercase">
            Urutan
          </label>
          <select
            value={filterDraft.sortOrder}
            onChange={(e) =>
              setFilterDraft({ ...filterDraft, sortOrder: e.target.value })
            }
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm"
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>
      <button
        onClick={onApply}
        className="w-full lg:w-auto px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        <HiFilter className="w-4 h-4" /> Filter
      </button>
    </div>
  );
};

export default ReportFilterSection;
