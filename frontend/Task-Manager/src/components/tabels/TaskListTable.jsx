// Styled TaskListTable - Emerald/Lime dashboard theme
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BiSolidDetail } from "react-icons/bi";

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID");
const getApplicantName = (task) => {
  const additional = task?.additionalData || [];
  return additional.length ? additional[0]?.newName || "-" : "-";
};

const highlightText = (text = "", query = "") => {
  if (!query) return text || "-";
  const str = String(text ?? "");
  const index = str.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return str || "-";

  return (
    <>
      {str.slice(0, index)}
      <mark className="bg-lime-200/70 text-emerald-900 px-0.5 rounded">
        {str.slice(index, index + query.length)}
      </mark>
      {str.slice(index + query.length)}
    </>
  );
};

const TaskListTable = ({
  tableData = [],
  page = 1,
  limit = 10,
  searchNopel = "",
  onSearchNopel,
  loading = false,
}) => {
  const [localQuery, setLocalQuery] = useState(searchNopel);
  const tasks = useMemo(
    () => (Array.isArray(tableData) ? tableData : []),
    [tableData]
  );
  const startIndex = (Number(page) - 1) * Number(limit);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchNopel?.(localQuery.trim());
  };

  const handleResetSearch = () => {
    setLocalQuery("");
    onSearchNopel?.("");
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-emerald-200/50 bg-white/70 backdrop-blur-sm p-4 shadow-md hover:shadow-lg transition-all duration-200">
      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Cari NOPel..."
          className="w-full max-w-xs rounded-xl border border-emerald-300 bg-white/70 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400"
        >
          Cari
        </button>

        {searchNopel && (
          <button
            type="button"
            onClick={handleResetSearch}
            className="rounded-xl border border-lime-400 bg-lime-100/50 px-4 py-2 text-sm text-emerald-700 shadow hover:bg-lime-200 focus:ring-2 focus:ring-lime-400"
          >
            Reset
          </button>
        )}
      </form>

      {/* Table */}
      <table className="min-w-full text-sm rounded-xl overflow-hidden">
        <thead className="sticky top-0 bg-emerald-50 text-emerald-900 border-b border-emerald-200/70">
          <tr>
            <th className="px-3 py-2 text-left">No</th>
            <th className="px-3 py-2 text-left">Tanggal</th>
            <th className="px-3 py-2 text-left">Nopel</th>
            <th className="px-3 py-2 text-left">NOP</th>
            <th className="px-3 py-2 text-left">Nama</th>
            <th className="px-3 py-2 text-left">Jenis</th>
            <th className="px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(even)]:bg-emerald-50/30">
          {tasks.map((task, index) => {
            const nopel = task?.mainData?.nopel ?? "-";
            const createdDate = task?.createdAt
              ? DATE_FORMATTER.format(new Date(task.createdAt))
              : "-";
            const applicantName = getApplicantName(task);
            const title = task?.title || "-";

            const isWarning =
              task?.createdAt &&
              Date.now() - new Date(task.createdAt).getTime() >
                5 * 24 * 60 * 60 * 1000;

            return (
              <tr
                key={task?._id || `${startIndex}-${index}`}
                className={`transition-colors ${
                  isWarning
                    ? "bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100"
                    : "hover:bg-emerald-50"
                }`}
              >
                <td className="px-3 py-2 border-b">{startIndex + index + 1}</td>
                <td className="px-3 py-2 border-b">{createdDate}</td>
                <td className="px-3 py-2 border-b">
                  {highlightText(nopel, searchNopel)}
                </td>
                <td className="px-3 py-2 border-b">
                  {task?.mainData?.nop ?? "-"}
                </td>
                <td
                  className="px-3 py-2 border-b max-w-[220px] truncate"
                  title={applicantName}
                >
                  {applicantName}
                </td>
                <td
                  className="px-3 py-2 border-b max-w-[260px] truncate capitalize"
                  title={title}
                >
                  {title}
                </td>

                <td className="px-3 py-2 border-b">
                  <div className="flex justify-center">
                    <Link
                      to={`/task-detail/${task?._id}`}
                      className={`rounded-full p-2 shadow transition ${
                        isWarning
                          ? "bg-yellow-100 hover:bg-yellow-200"
                          : "bg-emerald-100 hover:bg-emerald-200"
                      }`}
                      title="Detail"
                    >
                      <BiSolidDetail
                        className={`text-xl ${
                          isWarning ? "text-yellow-600" : "text-emerald-700"
                        }`}
                      />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}

          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-3 py-2 border-b">
                    <div className="h-3 w-24 animate-pulse rounded bg-emerald-200/40" />
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(TaskListTable);
// import React, { useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { BiSolidDetail } from "react-icons/bi";

// /* ===========================
//    Utility: Date & Text Format
//    =========================== */
// const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID");

// const getApplicantName = (task) => {
//   const additional = task?.additionalData || [];
//   return additional.length ? additional[0]?.newName || "-" : "-";
// };

// /** Highlight util (case-insensitive) */
// const highlightText = (text = "", query = "") => {
//   if (!query) return text || "-";
//   const str = String(text ?? "");
//   const index = str.toLowerCase().indexOf(query.toLowerCase());
//   if (index === -1) return str || "-";

//   return (
//     <>
//       {str.slice(0, index)}
//       <mark className="bg-yellow-200 px-0.5 rounded">
//         {str.slice(index, index + query.length)}
//       </mark>
//       {str.slice(index + query.length)}
//     </>
//   );
// };

// /* ===========================
//    Main Component
//    =========================== */
// /**
//  * Props:
//  * - tableData: any[]
//  * - page?: number
//  * - limit?: number
//  * - searchNopel?: string
//  * - onSearchNopel?: (q: string) => void
//  * - loading?: boolean
//  */
// const TaskListTable = ({
//   tableData = [],
//   page = 1,
//   limit = 10,
//   searchNopel = "",
//   onSearchNopel,
//   loading = false,
// }) => {
//   const [localQuery, setLocalQuery] = useState(searchNopel);
//   const tasks = useMemo(
//     () => (Array.isArray(tableData) ? tableData : []),
//     [tableData]
//   );
//   const startIndex = (Number(page) - 1) * Number(limit);

//   /* ===========================
//      Event Handlers
//      =========================== */
//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     onSearchNopel?.(localQuery.trim());
//   };

//   const handleResetSearch = () => {
//     setLocalQuery("");
//     onSearchNopel?.("");
//   };

//   /* ===========================
//      Render
//      =========================== */
//   return (
//     <div className="overflow-x-auto">
//       {/* =====================
//           Search Bar (NOPel)
//          ===================== */}
//       <form
//         onSubmit={handleSearchSubmit}
//         className="mb-3 flex items-center gap-2"
//       >
//         <input
//           type="text"
//           value={localQuery}
//           onChange={(e) => setLocalQuery(e.target.value)}
//           placeholder="nopel"
//           className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           aria-label="Cari NOPel"
//         />
//         <button
//           type="submit"
//           className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//         >
//           Cari
//         </button>
//         {searchNopel && (
//           <button
//             type="button"
//             onClick={handleResetSearch}
//             className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
//           >
//             Reset
//           </button>
//         )}
//       </form>

//       {/* =====================
//           Table
//          ===================== */}
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 bg-slate-100 text-slate-800">
//           <tr>
//             <th className="border-b px-3 py-2 text-left">No</th>
//             <th className="border-b px-3 py-2 text-left">Tanggal</th>
//             <th className="border-b px-3 py-2 text-left">Nopel</th>
//             <th className="border-b px-3 py-2 text-left">NOP</th>
//             <th className="border-b px-3 py-2 text-left">Nama</th>
//             <th className="border-b px-3 py-2 text-left">Jenis</th>
//             <th className="border-b px-3 py-2 text-center">Aksi</th>
//           </tr>
//         </thead>

//         <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//           {tasks.map((task, index) => {
//             const nopel = task?.mainData?.nopel ?? "-";
//             const createdDate = task?.createdAt
//               ? DATE_FORMATTER.format(new Date(task.createdAt))
//               : "-";
//             const applicantName = getApplicantName(task);
//             const title = task?.title || "-";

//             // =======================
//             // Highlight Warning Logic
//             // =======================
//             // Misal: Beri warna kuning jika data lebih dari 5 hari belum diproses
//             const isWarning =
//               task?.createdAt &&
//               Date.now() - new Date(task.createdAt).getTime() >
//                 5 * 24 * 60 * 60 * 1000;

//             return (
//               <tr
//                 key={task?._id || `${startIndex}-${index}`}
//                 className={`transition-colors ${
//                   isWarning
//                     ? "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-400"
//                     : "hover:bg-indigo-50/40"
//                 }`}
//               >
//                 <td className="border-b px-3 py-2">{startIndex + index + 1}</td>
//                 <td className="border-b px-3 py-2">{createdDate}</td>
//                 <td className="border-b px-3 py-2">
//                   {highlightText(nopel, searchNopel)}
//                 </td>
//                 <td className="border-b px-3 py-2">
//                   {task?.mainData?.nop ?? "-"}
//                 </td>
//                 <td className="border-b px-3 py-2">
//                   <div className="max-w-[220px] truncate" title={applicantName}>
//                     {applicantName}
//                   </div>
//                 </td>
//                 <td className="border-b px-3 py-2 capitalize">
//                   <div className="max-w-[260px] truncate" title={title}>
//                     {title}
//                   </div>
//                 </td>
//                 <td className="border-b px-3 py-2">
//                   <div className="flex justify-center gap-2">
//                     <Link
//                       to={`/task-detail/${task?._id}`}
//                       className={`rounded-full p-2 transition ${
//                         isWarning
//                           ? "bg-yellow-100 hover:bg-yellow-200"
//                           : "bg-blue-100 hover:bg-blue-200"
//                       }`}
//                       title="Detail"
//                     >
//                       <BiSolidDetail
//                         className={`text-xl ${
//                           isWarning ? "text-yellow-600" : "text-blue-600"
//                         }`}
//                       />
//                     </Link>
//                   </div>
//                 </td>
//               </tr>
//             );
//           })}

//           {/* Loader State (Optional Placeholder) */}
//           {loading &&
//             Array.from({ length: 3 }).map((_, i) => (
//               <tr key={`skeleton-${i}`}>
//                 {Array.from({ length: 7 }).map((__, j) => (
//                   <td key={j} className="px-3 py-2 border-b">
//                     <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
//                   </td>
//                 ))}
//               </tr>
//             ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default React.memo(TaskListTable);
