import React, { useRef, useEffect, useMemo, useState } from "react";
import RowActions from "../actions/RowActions";

const DF_ID = new Intl.DateTimeFormat("id-ID");

function TaskTable({
  tasks = [],
  selectedTaskIds = [],
  onToggleRow = () => {},
  onToggleAll = () => {},
  handleDelete = () => {},
  openApprovalModal = () => {},
  onExport = () => {},
  exporting = false,
  page = 1,
  limit = 10,
  showCheckbox = true,
  showDetail = true,
  showEdit = true,
  showDeleteBtn = true,
  showApproval = true,
  showExportButton = true,
}) {
  const rows = Array.isArray(tasks) ? tasks : [];

  const total = rows.length;
  const selectedCount = selectedTaskIds.length;
  const allSelected = showCheckbox && total > 0 && selectedCount === total;
  const someSelected =
    showCheckbox && selectedCount > 0 && selectedCount < total;

  const headerRef = useRef(null);
  useEffect(() => {
    if (headerRef.current)
      headerRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  const indexOffset = (Math.max(1, +page) - 1) * Math.max(1, +limit);
  const canExport = useMemo(
    () => selectedCount > 0 && !exporting,
    [selectedCount, exporting]
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- Utility: warna label status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "selesai":
        return "bg-emerald-100 text-emerald-800";
      case "ditolak":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  return (
    <div className="overflow-x-auto relative">
      {/* Toolbar atas tabel */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          {total > 0 ? `Menampilkan ${total} baris` : "Tidak ada data."}
        </div>

        {showExportButton && (
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                selectedCount
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Dipilih: {selectedCount}
            </span>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={!canExport}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                canExport
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-slate-200 text-slate-600 cursor-not-allowed"
              }`}
              aria-label="Unduh rekomendasi PDF"
              title="Unduh rekomendasi PDF"
            >
              {exporting ? "Mengunduh…" : "Unduh Rekom"}
            </button>
          </div>
        )}
      </div>

      {/* Tabel */}
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-slate-100 text-slate-800">
          <tr>
            {showCheckbox && (
              <th className="border-b px-3 py-2 text-center">
                <input
                  ref={headerRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  aria-label="Pilih semua"
                />
              </th>
            )}
            <th className="border-b px-3 py-2 text-left">No</th>
            <th className="border-b px-3 py-2 text-left">Tanggal</th>
            <th className="border-b px-3 py-2 text-left">NOPEL</th>
            <th className="border-b px-3 py-2 text-left">NOP</th>
            <th className="border-b px-3 py-2 text-left">Nama Pemohon</th>
            <th className="border-b px-3 py-2 text-left">Jenis Permohonan</th>
            <th className="border-b px-3 py-2 text-center">Tahapan</th>
            <th className="border-b px-3 py-2 text-center">Status</th>
            <th className="border-b px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
          {rows.map((task, idx) => {
            const id = task?._id;
            const isChecked = selectedTaskIds.includes(id);

            return (
              <tr
                key={id || idx}
                className="hover:bg-indigo-50/40 transition-colors"
              >
                {showCheckbox && (
                  <td className="border-b px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleRow(id)}
                      aria-label={`Pilih task ${id}`}
                    />
                  </td>
                )}

                <td className="border-b px-3 py-2">{indexOffset + idx + 1}</td>

                <td className="border-b px-3 py-2">
                  {task?.createdAt
                    ? DF_ID.format(new Date(task.createdAt))
                    : "-"}
                </td>

                <td className="border-b px-3 py-2">
                  {task?.mainData?.nopel ?? "-"}
                </td>
                <td className="border-b px-3 py-2">
                  {task?.mainData?.nop ?? "-"}
                </td>

                <td className="border-b px-3 py-2">
                  {task?.additionalData?.[0]?.newName || "-"}
                </td>

                <td className="border-b px-3 py-2 capitalize">{task?.title}</td>

                <td className="border-b px-3 py-2 text-center">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {task?.currentStage ?? "-"}
                  </span>
                </td>

                {/* Kolom status baru */}
                <td className="border-b px-3 py-2 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      task?.status
                    )}`}
                  >
                    {task?.status || "Diproses"}
                  </span>
                </td>

                <td className="border-b px-3 py-2">
                  <RowActions
                    id={id}
                    showDetail={showDetail}
                    showEdit={showEdit}
                    showApproval={showApproval}
                    showDeleteBtn={showDeleteBtn}
                    onApprove={openApprovalModal}
                    onDelete={handleDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal Konfirmasi Export */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-lg w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Konfirmasi Unduh
            </h3>
            <p className="text-slate-600 text-sm mb-5">
              Apakah berkas yang Anda pilih sudah benar?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
              >
                Cek Lagi
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  onExport(selectedTaskIds);
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(TaskTable);
// import React, { useRef, useEffect, useMemo, useState } from "react";
// import RowActions from "../actions/RowActions";

// // Formatter tanggal “sekali per modul”
// const DF_ID = new Intl.DateTimeFormat("id-ID");

// function TaskTable({
//   tasks = [],
//   selectedTaskIds = [],
//   onToggleRow = () => {},
//   onToggleAll = () => {},
//   handleDelete = () => {},
//   openApprovalModal = () => {},
//   onExport = () => {}, // handler export dari parent
//   exporting = false, // state loading export dari parent (opsional)
//   page = 1,
//   limit = 10,
//   showCheckbox = true,
//   showDetail = true,
//   showEdit = true,
//   showDeleteBtn = true,
//   showApproval = true,
//   showExportButton = true, // bisa sembunyikan tombol export bila perlu
// }) {
//   const rows = Array.isArray(tasks) ? tasks : [];

//   // meta select
//   const total = rows.length;
//   const selectedCount = selectedTaskIds.length;
//   const allSelected = showCheckbox && total > 0 && selectedCount === total;
//   const someSelected =
//     showCheckbox && selectedCount > 0 && selectedCount < total;

//   // header checkbox indeterminate
//   const headerRef = useRef(null);
//   useEffect(() => {
//     if (headerRef.current)
//       headerRef.current.indeterminate = someSelected && !allSelected;
//   }, [someSelected, allSelected]);

//   const indexOffset = (Math.max(1, +page) - 1) * Math.max(1, +limit);
//   const canExport = useMemo(
//     () => selectedCount > 0 && !exporting,
//     [selectedCount, exporting]
//   );

//   // State untuk modal konfirmasi
//   const [showConfirmModal, setShowConfirmModal] = useState(false);

//   return (
//     <div className="overflow-x-auto relative">
//       {/* Toolbar atas tabel */}
//       <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//         <div className="text-sm text-slate-600">
//           {total > 0 ? `Menampilkan ${total} baris` : "Tidak ada data."}
//         </div>

//         {showExportButton && (
//           <div className="flex items-center gap-2">
//             <span
//               className={`rounded-full px-2.5 py-1 text-xs font-medium ${
//                 selectedCount
//                   ? "bg-emerald-50 text-emerald-700"
//                   : "bg-slate-100 text-slate-600"
//               }`}
//             >
//               Dipilih: {selectedCount}
//             </span>

//             <button
//               type="button"
//               onClick={() => setShowConfirmModal(true)}
//               disabled={!canExport}
//               className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
//                 canExport
//                   ? "bg-indigo-600 text-white hover:bg-indigo-700"
//                   : "bg-slate-200 text-slate-600 cursor-not-allowed"
//               }`}
//               aria-label="Unduh rekomendasi PDF"
//               title="Unduh rekomendasi PDF"
//             >
//               {exporting ? "Mengunduh…" : "Unduh Rekom"}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Tabel */}
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 bg-slate-100 text-slate-800">
//           <tr>
//             {showCheckbox && (
//               <th className="border-b px-3 py-2 text-center">
//                 <input
//                   ref={headerRef}
//                   type="checkbox"
//                   checked={allSelected}
//                   onChange={(e) => onToggleAll(e.target.checked)}
//                   aria-label="Pilih semua"
//                 />
//               </th>
//             )}
//             <th className="border-b px-3 py-2 text-left">No</th>
//             <th className="border-b px-3 py-2 text-left">Tanggal</th>
//             <th className="border-b px-3 py-2 text-left">NOPEL</th>
//             <th className="border-b px-3 py-2 text-left">NOP</th>
//             <th className="border-b px-3 py-2 text-left">Nama Pemohon</th>
//             <th className="border-b px-3 py-2 text-left">Jenis Permohonan</th>
//             <th className="border-b px-3 py-2 text-center">Tahapan</th>
//             <th className="border-b px-3 py-2 text-center">Aksi</th>
//           </tr>
//         </thead>

//         <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//           {rows.map((task, idx) => {
//             const id = task?._id;
//             const isChecked = selectedTaskIds.includes(id);

//             return (
//               <tr
//                 key={id || idx}
//                 className="hover:bg-indigo-50/40 transition-colors"
//               >
//                 {showCheckbox && (
//                   <td className="border-b px-3 py-2 text-center">
//                     <input
//                       type="checkbox"
//                       checked={isChecked}
//                       onChange={() => onToggleRow(id)}
//                       aria-label={`Pilih task ${id}`}
//                     />
//                   </td>
//                 )}

//                 <td className="border-b px-3 py-2">{indexOffset + idx + 1}</td>

//                 <td className="border-b px-3 py-2">
//                   {task?.createdAt
//                     ? DF_ID.format(new Date(task.createdAt))
//                     : "-"}
//                 </td>

//                 <td className="border-b px-3 py-2">
//                   {task?.mainData?.nopel ?? "-"}
//                 </td>
//                 <td className="border-b px-3 py-2">
//                   {task?.mainData?.nop ?? "-"}
//                 </td>

//                 <td className="border-b px-3 py-2">
//                   {task?.additionalData?.[0]?.newName || "-"}
//                 </td>

//                 <td className="border-b px-3 py-2 capitalize">{task?.title}</td>

//                 <td className="border-b px-3 py-2 text-center">
//                   <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
//                     {task?.currentStage ?? "Selesai"}
//                   </span>
//                 </td>

//                 <td className="border-b px-3 py-2">
//                   <RowActions
//                     id={id}
//                     showDetail={showDetail}
//                     showEdit={showEdit}
//                     showApproval={showApproval}
//                     showDeleteBtn={showDeleteBtn}
//                     onApprove={openApprovalModal}
//                     onDelete={handleDelete}
//                   />
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>

//       {/* Modal Konfirmasi Export */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white rounded-2xl p-6 shadow-lg w-[90%] max-w-sm">
//             <h3 className="text-lg font-semibold text-slate-800 mb-2">
//               Konfirmasi Unduh
//             </h3>
//             <p className="text-slate-600 text-sm mb-5">
//               Apakah berkas yang Anda pilih sudah benar?
//             </p>

//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="px-3 py-1.5 rounded-lg text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
//               >
//                 Cek Lagi
//               </button>
//               <button
//                 onClick={() => {
//                   setShowConfirmModal(false);
//                   onExport(selectedTaskIds);
//                 }}
//                 className="px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition"
//               >
//                 Lanjut
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default React.memo(TaskTable);
