import React from "react";
import { HiFilter } from "react-icons/hi";

const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5 w-full">
    <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest group-focus-within:text-emerald-600 transition-colors uppercase">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-10" : "px-4"} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-300 shadow-sm`}
      />
    </div>
  </div>
);

const FilterSection = ({ configs = [], filterDraft, setFilterDraft, onApply, isLoading }) => {
  const handleInputChange = (id, value) => {
    setFilterDraft((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="bg-slate-50/50 p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-inner">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {configs.map((field) => {
            if (field.type === "select") {
              return (
                <div key={field.id} className="group space-y-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-widest uppercase">
                    {field.label}
                  </label>
                  <div className="relative">
                    <select
                      value={filterDraft[field.id]}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:18px_18px] bg-[right_12px_center] bg-no-repeat"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            }

            return (
              <FilterInput
                key={field.id}
                label={field.label}
                icon={field.icon}
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={filterDraft[field.id] || ""}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
              />
            );
          })}

          <div className="flex items-end sm:col-span-full lg:col-span-1 lg:col-start-4 xl:col-start-5">
            <button
              onClick={onApply}
              disabled={isLoading}
              className="w-full h-[42px] px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <HiFilter className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Memuat..." : "Terapkan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FilterSection);
