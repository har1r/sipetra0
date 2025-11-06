import React, { useId } from "react";
import { FaFilter, FaPlus } from "react-icons/fa6";

import { Link } from "react-router-dom"; // ✅ Tambahkan ini

const TaskFilter = ({
  filters,
  setFilters,
  onFilterSubmit,
  onFilterReset,
  loading = false,
  userRole,
}) => {
  console.log("User Role in TaskFilter:", userRole);
  const idNopel = useId();
  const idTitle = useId();
  const idStartDate = useId();
  const idEndDate = useId();
  const idOrder = useId();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const { startDate, endDate } = filters || {};
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    onFilterSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Kelola Permohonan
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Kelola permohonan yang sudah masuk.
          </p>
        </div>

        {/* ✅ Ganti dari <a> ke <Link> supaya tidak refresh */}
        {userRole === "penginput" || userRole === "admin" ? (
          <Link
            to="/task/create"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 md:mt-0"
          >
            <FaPlus className="h-4 w-4" aria-hidden />
            <span>Buat Permohonan</span>
          </Link>
        ) : null}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 items-end gap-3 p-5 md:grid-cols-12 md:gap-4">
        {/* Input fields */}
        <div className="md:col-span-3">
          <label
            htmlFor={idNopel}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Nopel
          </label>
          <input
            id={idNopel}
            name="nopel"
            value={filters.nopel || ""}
            onChange={handleInputChange}
            placeholder="nopel"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor={idTitle}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Jenis Permohonan
          </label>
          <input
            id={idTitle}
            name="title"
            value={filters.title || ""}
            onChange={handleInputChange}
            placeholder="jenis permohonan"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={idStartDate}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Mulai
          </label>
          <input
            id={idStartDate}
            type="date"
            name="startDate"
            value={filters.startDate || ""}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={idEndDate}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Selesai
          </label>
          <input
            id={idEndDate}
            type="date"
            name="endDate"
            value={filters.endDate || ""}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={idOrder}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Urutan
          </label>
          <select
            id={idOrder}
            name="order"
            value={filters.order || "desc"}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
        >
          <span>Cari</span>
        </button>

        <button
          type="button"
          onClick={onFilterReset}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default React.memo(TaskFilter);
