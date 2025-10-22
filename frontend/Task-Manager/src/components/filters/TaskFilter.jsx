import React, { useId } from "react";
import { FaFilter, FaPlus } from "react-icons/fa6";
import { toast } from "react-toastify";
// import { Link } from "react-router-dom"; // 👉 pakai ini kalau kamu pakai React Router

const TaskFilter = ({
  filters = {
    nopel: "",
    title: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    order: "desc",
  },
  setFilters = () => {},
  onFilterSubmit = () => {},
  onFilterReset = () => {},
  loading = false,
}) => {
  const idNopel = useId();
  const idTitle = useId();
  const idStart = useId();
  const idEnd = useId();
  const idOrder = useId();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
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
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        {/* Kiri: Judul */}
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-indigo-600/10 text-indigo-600">
              <FaFilter aria-hidden />
            </span>
            <h3 className="text-base font-semibold text-slate-900">
              Filter Permohonan
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Saring berdasarkan nopel, jenis permohonan, rentang tanggal, dan
            urutan.
          </p>
        </div>

        {/* 🔹 Tambahan tombol Buat Permohonan */}
        <a
          href="/task/create" // ganti dengan path sesuai kebutuhan
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 md:mt-0"
        >
          <FaPlus className="h-4 w-4" aria-hidden />
          <span>Buat Permohonan</span>
        </a>

        {/* 👉 Jika pakai React Router:
        <Link
          to="/buat-permohonan"
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 md:mt-0"
        >
          <FaPlus className="h-4 w-4" aria-hidden />
          <span>Buat Permohonan</span>
        </Link> */}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 items-end gap-3 p-5 md:grid-cols-12 md:gap-4">
        {/* Nopel */}
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
            onChange={handleChange}
            placeholder="Masukkan Nopel"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Title */}
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
            onChange={handleChange}
            placeholder="Misal: pembetulan"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Start Date */}
        <div className="md:col-span-2">
          <label
            htmlFor={idStart}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Mulai
          </label>
          <input
            id={idStart}
            type="date"
            name="startDate"
            value={filters.startDate || ""}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* End Date */}
        <div className="md:col-span-2">
          <label
            htmlFor={idEnd}
            className="mb-1 block text-[13px] font-medium text-slate-700"
          >
            Selesai
          </label>
          <input
            id={idEnd}
            type="date"
            name="endDate"
            value={filters.endDate || ""}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Order */}
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
            onChange={handleChange}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
          title="Terapkan Filter"
        >
          <FaFilter className="h-4 w-4" aria-hidden />
          <span>{loading ? "Memfilter…" : "Filter"}</span>
        </button>

        <button
          type="button"
          onClick={onFilterReset}
          disabled={loading}
          title="Reset filter"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default React.memo(TaskFilter);

// import React, { useId, useMemo } from "react";
// import { FaFilter } from "react-icons/fa6";
// import { toast } from "react-toastify";

// const TaskFilter = ({
//   filters = { nopel: "", title: "", startDate: "", endDate: "", sortBy: "createdAt", order: "desc" },
//   setFilters = () => {},
//   onFilterSubmit = () => {},
//   onFilterReset = () => {},
//   loading = false,
// }) => {
//   // ID unik untuk label–input
//   const idNopel   = useId();
//   const idTitle   = useId();
//   const idStart   = useId();
//   const idEnd     = useId();
//   const idOrder   = useId();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const { startDate, endDate } = filters || {};
//     if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
//       toast.error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
//       return;
//     }
//     onFilterSubmit();
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm"
//     >
//       {/* Header */}
//       <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4">
//         <div className="inline-flex items-center gap-2">
//           <span className="inline-grid h-7 w-7 place-items-center rounded-lg bg-indigo-600/10 text-indigo-600">
//             <FaFilter aria-hidden />
//           </span>
//           <h3 className="text-base font-semibold text-slate-900">Filter Permohonan</h3>
//         </div>
//         <p className="text-xs text-slate-600">
//           Saring berdasarkan nopel, jenis permohonan, rentang tanggal, dan urutan.
//         </p>
//       </div>

//       {/* Body */}
//       <div className="grid grid-cols-1 items-end gap-3 p-5 md:grid-cols-12 md:gap-4">
//         {/* Nopel */}
//         <div className="md:col-span-3">
//           <label htmlFor={idNopel} className="mb-1 block text-[13px] font-medium text-slate-700">
//             Nopel
//           </label>
//           <input
//             id={idNopel}
//             name="nopel"
//             value={filters.nopel || ""}
//             onChange={handleChange}
//             placeholder="Masukkan Nopel"
//             autoComplete="off"
//             className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
//           />
//         </div>

//         {/* Title */}
//         <div className="md:col-span-3">
//           <label htmlFor={idTitle} className="mb-1 block text-[13px] font-medium text-slate-700">
//             Jenis Permohonan
//           </label>
//           <input
//             id={idTitle}
//             name="title"
//             value={filters.title || ""}
//             onChange={handleChange}
//             placeholder="Misal: pembetulan"
//             autoComplete="off"
//             className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
//           />
//         </div>

//         {/* Start Date */}
//         <div className="md:col-span-2">
//           <label htmlFor={idStart} className="mb-1 block text-[13px] font-medium text-slate-700">
//             Mulai
//           </label>
//           <input
//             id={idStart}
//             type="date"
//             name="startDate"
//             value={filters.startDate || ""}
//             onChange={handleChange}
//             className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
//           />
//         </div>

//         {/* End Date */}
//         <div className="md:col-span-2">
//           <label htmlFor={idEnd} className="mb-1 block text-[13px] font-medium text-slate-700">
//             Selesai
//           </label>
//           <input
//             id={idEnd}
//             type="date"
//             name="endDate"
//             value={filters.endDate || ""}
//             onChange={handleChange}
//             className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
//           />
//         </div>

//         {/* Order */}
//         <div className="md:col-span-2">
//           <label htmlFor={idOrder} className="mb-1 block text-[13px] font-medium text-slate-700">
//             Urutan
//           </label>
//           <select
//             id={idOrder}
//             name="order"
//             value={filters.order || "desc"}
//             onChange={handleChange}
//             className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition"
//           >
//             <option value="desc">Terbaru</option>
//             <option value="asc">Terlama</option>
//           </select>
//         </div>
//       </div>

//       {/* Footer / Actions */}
//       <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-5 py-4">
//         <button
//           type="submit"
//           disabled={loading}
//           className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
//           title="Terapkan Filter"
//         >
//           <FaFilter className="h-4 w-4" aria-hidden />
//           <span>{loading ? "Memfilter…" : "Filter"}</span>
//         </button>

//         <button
//           type="button"
//           onClick={onFilterReset}
//           disabled={loading}
//           title="Reset filter"
//           className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-60"
//         >
//           Reset
//         </button>
//       </div>
//     </form>
//   );
// };

// export default React.memo(TaskFilter);
