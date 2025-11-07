import React, { useRef, useEffect, useMemo, useState } from "react";
import RowActions from "../actions/RowActions";

const dateFormatter = new Intl.DateTimeFormat("id-ID");

function TaskTable({
  tasks = [],

  selectedIds = [],
  onToggleRow = () => {},
  onToggleAll = () => {},

  onDelete = () => {},
  onOpenApproval = () => {},
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
  const headerCheckboxRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- COUNTERS ---
  const totalRows = tasks.length;
  const selectedCount = selectedIds.length;

  const allSelected =
    showCheckbox && totalRows > 0 && selectedCount === totalRows;

  const someSelected =
    showCheckbox && selectedCount > 0 && selectedCount < totalRows;

  const startIndex = (page - 1) * limit;

  const canExport = useMemo(
    () => selectedCount > 0 && !exporting,
    [selectedCount, exporting]
  );

  // --- CHECKBOX INDETERMINATE ---
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  // --- BADGE COLOR ---
  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "selesai") return "bg-emerald-100 text-emerald-800";
    if (s === "ditolak") return "bg-rose-100 text-rose-800";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <div className="relative overflow-x-auto">
      {/* ======== Toolbar ======== */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {totalRows > 0 ? `Menampilkan ${totalRows} baris` : "Tidak ada data."}
        </p>

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
            >
              {exporting ? "Mengunduh…" : "Unduh Rekom"}
            </button>
          </div>
        )}
      </div>

      {/* ======== MAIN TABLE ======== */}
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-slate-100 text-slate-900">
          <tr>
            {showCheckbox && (
              <th className="border-b px-3 py-2 text-center w-10">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                />
              </th>
            )}

            <th className="border-b px-3 py-2 w-10">No</th>
            <th className="border-b px-3 py-2">Tanggal</th>
            <th className="border-b px-3 py-2">NOPEL</th>
            <th className="border-b px-3 py-2">NOP</th>
            <th className="border-b px-3 py-2">Nama Baru</th>
            <th className="border-b px-3 py-2">Nama Lama</th>
            <th className="border-b px-3 py-2">Luas Tanah</th>
            <th className="border-b px-3 py-2">Luas Bangunan</th>
            <th className="border-b px-3 py-2">Jenis Permohonan</th>
            <th className="border-b px-3 py-2 text-center">Tahapan</th>
            <th className="border-b px-3 py-2 text-center">Status</th>
            <th className="border-b px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
          {tasks.map((task, i) => {
            const id = task.id;
            const isSelected = selectedIds.includes(id);

            const main = task.mainData || {};
            const firstAdditional = task.additionalData?.[0] || {};

            const oldName = main.oldName ?? "-";

            return (
              <React.Fragment key={id}>
                {/* ✅ ROW UTAMA */}
                <tr className="transition-colors hover:bg-indigo-50/40">
                  {showCheckbox && (
                    <td className="border-b px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleRow(id)}
                      />
                    </td>
                  )}

                  <td className="border-b px-3 py-2">{startIndex + i + 1}</td>

                  <td className="border-b px-3 py-2">
                    {task.createdAt
                      ? dateFormatter.format(new Date(task.createdAt))
                      : "-"}
                  </td>

                  <td className="border-b px-3 py-2">{main.nopel ?? "-"}</td>
                  <td className="border-b px-3 py-2">{main.nop ?? "-"}</td>

                  <td className="border-b px-3 py-2">
                    {firstAdditional.newName ?? "-"}
                  </td>

                  <td className="border-b px-3 py-2">{oldName}</td>

                  <td className="border-b px-3 py-2">
                    {firstAdditional.landWide ?? "-"}
                  </td>

                  <td className="border-b px-3 py-2">
                    {firstAdditional.buildingWide ?? "-"}
                  </td>

                  <td className="border-b px-3 py-2 capitalize">
                    {task.title ?? "-"}
                  </td>

                  <td className="border-b px-3 py-2 text-center">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs">
                      {task.currentStage ?? "-"}
                    </span>
                  </td>

                  <td className="border-b px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {task.status ?? "-"}
                    </span>
                  </td>

                  <td className="border-b px-3 py-2">
                    <RowActions
                      id={id}
                      showDetail={showDetail}
                      showEdit={showEdit}
                      showApproval={showApproval}
                      showDeleteBtn={showDeleteBtn}
                      onApprove={onOpenApproval}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>

                {/* ✅ ROW BARIS TAMBAHAN */}
                {task.additionalData?.slice(1).map((item, idx) => (
                  <tr
                    key={`${id}-additional-${idx}`}
                    className="bg-slate-50/70"
                  >
                    {showCheckbox && <td className="border-b"></td>}
                    <td className="border-b"></td>

                    <td className="border-b px-3 py-2 text-slate-600">
                      Detail {idx + 1}
                    </td>

                    <td className="border-b"></td>
                    <td className="border-b"></td>

                    <td className="border-b px-3 py-2">
                      {item.newName ?? "-"}
                    </td>

                    <td className="border-b px-3 py-2">{oldName}</td>

                    <td className="border-b px-3 py-2">
                      {item.landWide ?? "-"}
                    </td>

                    <td className="border-b px-3 py-2">
                      {item.buildingWide ?? "-"}
                    </td>

                    <td className="border-b"></td>
                    <td className="border-b"></td>
                    <td className="border-b"></td>
                    <td className="border-b"></td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* ======== Modal Export ======== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-[90%] max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Konfirmasi Unduh</h3>
            <p className="mb-4 text-sm text-slate-600">
              Apakah berkas yang Anda pilih sudah benar?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg bg-slate-200 px-3 py-1.5 hover:bg-slate-300"
              >
                Cek Lagi
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  onExport(selectedIds);
                }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
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

// const dateFormatter = new Intl.DateTimeFormat("id-ID");

// function TaskTable({
//   tasks = [],
//   selectedTaskIds = [],
//   onToggleRow = () => {},
//   onToggleAll = () => {},
//   handleDelete = () => {},
//   openApprovalModal = () => {},
//   onExport = () => {},
//   exporting = false,
//   page = 1,
//   limit = 10,
//   showCheckbox = true,
//   showDetail = true,
//   showEdit = true,
//   showDeleteBtn = true,
//   showApproval = true,
//   showExportButton = true,
// }) {
//   const headerCheckboxRef = useRef(null);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);

//   const totalRows = tasks.length;
//   const selectedCount = selectedTaskIds.length;
//   const allSelected =
//     showCheckbox && totalRows > 0 && selectedCount === totalRows;
//   const someSelected =
//     showCheckbox && selectedCount > 0 && selectedCount < totalRows;

//   useEffect(() => {
//     if (headerCheckboxRef.current)
//       headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
//   }, [someSelected, allSelected]);

//   const startIndex = (Math.max(1, +page) - 1) * Math.max(1, +limit);
//   const canExport = useMemo(
//     () => selectedCount > 0 && !exporting,
//     [selectedCount, exporting]
//   );

//   const getStatusColor = (status) => {
//     const state = status?.toLowerCase();
//     if (state === "selesai") return "bg-emerald-100 text-emerald-800";
//     if (state === "ditolak") return "bg-rose-100 text-rose-800";
//     return "bg-amber-100 text-amber-800";
//   };

//   return (
//     <div className="relative overflow-x-auto">
//       {/* Toolbar atas */}
//       <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//         <div className="text-sm text-slate-600">
//           {totalRows > 0 ? `Menampilkan ${totalRows} baris` : "Tidak ada data."}
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
//               title="Unduh rekomendasi PDF"
//             >
//               {exporting ? "Mengunduh…" : "Unduh Rekom"}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Tabel utama */}
//       <table className="min-w-full text-sm">
//         <thead className="sticky top-0 bg-slate-100 text-slate-800">
//           <tr>
//             {showCheckbox && (
//               <th className="border-b px-3 py-2 text-center">
//                 <input
//                   ref={headerCheckboxRef}
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
//             <th className="border-b px-3 py-2 text-center">Status</th>
//             <th className="border-b px-3 py-2 text-center">Aksi</th>
//           </tr>
//         </thead>

//         <tbody className="[&>tr:nth-child(even)]:bg-slate-50">
//           {tasks.map((task, index) => {
//             const taskId = task?._id;
//             const isSelected = selectedTaskIds.includes(taskId);

//             return (
//               <tr
//                 key={taskId || index}
//                 className="transition-colors hover:bg-indigo-50/40"
//               >
//                 {showCheckbox && (
//                   <td className="border-b px-3 py-2 text-center">
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       onChange={() => onToggleRow(taskId)}
//                       aria-label={`Pilih task ${taskId}`}
//                     />
//                   </td>
//                 )}

//                 <td className="border-b px-3 py-2">{startIndex + index + 1}</td>

//                 <td className="border-b px-3 py-2">
//                   {task?.createdAt
//                     ? dateFormatter.format(new Date(task.createdAt))
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

//                 <td className="border-b px-3 py-2 capitalize">
//                   {task?.title || "-"}
//                 </td>

//                 <td className="border-b px-3 py-2 text-center">
//                   <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
//                     {task?.currentStage ?? "-"}
//                   </span>
//                 </td>

//                 <td className="border-b px-3 py-2 text-center">
//                   <span
//                     className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
//                       task?.status
//                     )}`}
//                   >
//                     {task?.status || "Diproses"}
//                   </span>
//                 </td>

//                 <td className="border-b px-3 py-2">
//                   <RowActions
//                     id={taskId}
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

//       {/* Modal Konfirmasi Unduh */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="w-[90%] max-w-sm rounded-2xl bg-white p-6 shadow-lg">
//             <h3 className="mb-2 text-lg font-semibold text-slate-800">
//               Konfirmasi Unduh
//             </h3>
//             <p className="mb-5 text-sm text-slate-600">
//               Apakah berkas yang Anda pilih sudah benar?
//             </p>

//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-300"
//               >
//                 Cek Lagi
//               </button>
//               <button
//                 onClick={() => {
//                   setShowConfirmModal(false);
//                   onExport(selectedTaskIds);
//                 }}
//                 className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white transition hover:bg-indigo-700"
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
