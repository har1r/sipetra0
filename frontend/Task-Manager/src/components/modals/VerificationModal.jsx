import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const VerificationModal = ({ taskData, onSuccess, onClose, onItemUpdate }) => {
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(null);

  useEffect(() => {
    if (taskData?.additionalData) {
      setChecks(taskData.additionalData.map(item => item.addStatus === "approved"));
    }
  }, [taskData]);

  const toggleItemStatus = async (index, itemId) => {
    const currentStatus = checks[index];
    const newStatus = !currentStatus ? "approved" : "in_progress";
    
    setItemLoading(itemId);
    try {
      const taskId = taskData?._id || taskData?.id;
      
      await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
        action: "update_items",
        itemUpdates: [{
          itemId: itemId,
          status: newStatus
        }]
      });

      // Update lokal state modal
      const newChecks = [...checks];
      newChecks[index] = !currentStatus;
      setChecks(newChecks);
      
      // SINKRONISASI KE PARENT: Update data di list induk agar tidak hilang saat modal tutup/buka
      if (onItemUpdate) {
        onItemUpdate(taskId, itemId, newStatus);
      }
      
      toast.success(`Status ${taskData.additionalData[index].newName} diperbarui`);
    } catch (err) {
      toast.error("Gagal memperbarui status item");
    } finally {
      setItemLoading(null);
    }
  };

  const isPemeriksa = taskData.currentStage === "diperiksa";
  const canApprove = isPemeriksa ? (checks.length > 0 && checks.every(v => v === true)) : true;

  const handleFinalAction = async (action) => {
    const taskId = taskData?._id || taskData?.id;
    if ((action === "rejected" || action === "revised") && !note.trim()) {
      return toast.error("Harap berikan catatan/alasan!");
    }

    setLoading(true);
    try {
      await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
        action,
        note: note.trim()
      });
      
      toast.success("Tugas berhasil diproses");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg p-7 space-y-6 shadow-2xl animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-black text-slate-800">Verifikasi Berkas</h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
            {taskData.currentStage}
          </span>
        </div>

        {/* Validasi Item */}
        {isPemeriksa && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validasi Item (Auto-Save):</p>
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 space-y-2 max-h-48 overflow-y-auto">
              {taskData.additionalData.map((item, i) => (
                <div 
                  key={item._id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${checks[i] ? 'border-emerald-500 bg-emerald-50/50' : 'bg-white border-slate-200'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-700">{item.newName}</span>
                    <span className="text-[10px] text-slate-500">{item.landWide} m²</span>
                  </div>
                  
                  {itemLoading === item._id ? (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                      checked={checks[i] || false} 
                      onChange={() => toggleItemStatus(i, item._id)} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catatan */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Catatan Akhir:</p>
          <textarea 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px] outline-none focus:bg-white transition-all" 
            placeholder="Masukkan alasan jika revisi/tolak..." 
            value={note} 
            onChange={e => setNote(e.target.value)} 
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button 
              disabled={loading} 
              type="button"
              onClick={() => handleFinalAction("revised")} 
              className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 border border-amber-200 transition-all text-sm active:scale-95 disabled:opacity-50"
            >
              Minta Revisi
            </button>
            <button 
              disabled={loading} 
              type="button"
              onClick={() => handleFinalAction("rejected")} 
              className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 border border-rose-200 transition-all text-sm active:scale-95 disabled:opacity-50"
            >
              Tolak Permanen
            </button>
          </div>

          <button 
            disabled={loading || !canApprove} 
            type="button"
            onClick={() => handleFinalAction("approved")} 
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] ${
              canApprove 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {loading ? "Menyimpan..." : "Setujui & Selesaikan"}
          </button>

          <button 
            type="button"
            disabled={loading}
            onClick={onClose} 
            className="w-full py-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-slate-600 transition-colors disabled:opacity-30"
          >
             Kembali / Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
// import React, { useState, useEffect } from "react";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import toast from "react-hot-toast";

// const VerificationModal = ({ taskData, onSuccess, onClose }) => {
//   const [note, setNote] = useState("");
//   const [checks, setChecks] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [itemLoading, setItemLoading] = useState(null); // Untuk spinner per item

//   useEffect(() => {
//     if (taskData?.additionalData) {
//       setChecks(taskData.additionalData.map(item => item.addStatus === "approved"));
//     }
//   }, [taskData]);

//   // --- LOGIKA BARU: UPDATE STATUS ITEM SECARA INSTAN ---
//   const toggleItemStatus = async (index, itemId) => {
//     const currentStatus = checks[index];
//     const newStatus = !currentStatus ? "approved" : "in_progress";
    
//     setItemLoading(itemId); // Tandai item mana yang sedang loading
//     try {
//       const taskId = taskData?._id || taskData?.id;
      
//       // Kirim update khusus untuk satu item ini saja ke backend
//       // Kita manfaatkan payload itemUpdates tapi isinya cuma 1 item
//       await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
//         action: "update_items", // Kita buatkan trigger khusus di backend jika perlu, atau gunakan action netral
//         itemUpdates: [{
//           itemId: itemId,
//           status: newStatus
//         }]
//       });

//       // Update state lokal jika sukses
//       const newChecks = [...checks];
//       newChecks[index] = !currentStatus;
//       setChecks(newChecks);
      
//       toast.success(`Status ${taskData.additionalData[index].newName} diperbarui`);
//     } catch (err) {
//       toast.error("Gagal memperbarui status item");
//     } finally {
//       setItemLoading(null);
//     }
//   };

//   const isPemeriksa = taskData.currentStage === "diperiksa";
//   const canApprove = isPemeriksa ? (checks.length > 0 && checks.every(v => v === true)) : true;

//   const handleFinalAction = async (action) => {
//     const taskId = taskData?._id || taskData?.id;
//     if ((action === "rejected" || action === "revised") && !note.trim()) {
//       return toast.error("Harap berikan catatan/alasan!");
//     }

//     setLoading(true);
//     try {
//       await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
//         action,
//         note: note.trim()
//         // itemUpdates tidak perlu dikirim lagi karena sudah di-save satu-satu sebelumnya
//       });
      
//       toast.success("Tugas berhasil diproses");
//       onSuccess();
//       onClose();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Gagal memproses");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//       <div className="bg-white rounded-[2rem] w-full max-w-lg p-7 space-y-6 shadow-2xl animate-in zoom-in duration-200">
        
//         {/* Header */}
//         <div className="flex justify-between items-center border-b pb-4">
//           <h2 className="text-xl font-black text-slate-800">Verifikasi Berkas</h2>
//           <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
//             {taskData.currentStage}
//           </span>
//         </div>

//         {/* Validasi Item Pecahan dengan Instant Save */}
//         {isPemeriksa && (
//           <div className="space-y-3">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validasi Item (Auto-Save):</p>
//             <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 space-y-2 max-h-48 overflow-y-auto">
//               {taskData.additionalData.map((item, i) => (
//                 <div 
//                   key={item._id} 
//                   className={`flex items-center justify-between p-3 rounded-xl border transition-all ${checks[i] ? 'border-emerald-500 bg-emerald-50/50' : 'bg-white border-slate-200'}`}
//                 >
//                   <div className="flex flex-col">
//                     <span className="text-[12px] font-bold text-slate-700">{item.newName}</span>
//                     <span className="text-[10px] text-slate-500">{item.landWide} m²</span>
//                   </div>
                  
//                   {itemLoading === item._id ? (
//                     <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
//                   ) : (
//                     <input 
//                       type="checkbox" 
//                       className="w-5 h-5 accent-emerald-500 cursor-pointer" 
//                       checked={checks[i] || false} 
//                       onChange={() => toggleItemStatus(i, item._id)} 
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Catatan */}
//         <div className="space-y-2">
//           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Catatan Akhir:</p>
//           <textarea 
//             className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px] outline-none focus:bg-white transition-all" 
//             placeholder="Masukkan alasan jika revisi/tolak..." 
//             value={note} 
//             onChange={e => setNote(e.target.value)} 
//           />
//         </div>

//         {/* Tombol Aksi */}
//         {/* Tombol Aksi */}
//         <div className="flex flex-col gap-3">
//           {/* Baris Utama: Minta Revisi & Tolak */}
//           <div className="flex gap-2">
//             <button 
//               disabled={loading} 
//               type="button"
//               onClick={() => handleFinalAction("revised")} 
//               className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold hover:bg-amber-100 border border-amber-200 transition-all text-sm active:scale-95 disabled:opacity-50"
//             >
//               Minta Revisi
//             </button>
//             <button 
//               disabled={loading} 
//               type="button"
//               onClick={() => handleFinalAction("rejected")} 
//               className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 border border-rose-200 transition-all text-sm active:scale-95 disabled:opacity-50"
//             >
//               Tolak Permanen
//             </button>
//           </div>

//           {/* Tombol Utama: Setujui */}
//           <button 
//             disabled={loading || !canApprove} 
//             type="button"
//             onClick={() => handleFinalAction("approved")} 
//             className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] ${
//               canApprove 
//                 ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' 
//                 : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
//             }`}
//           >
//             {loading ? (
//               <div className="flex items-center justify-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 <span>Menyimpan...</span>
//               </div>
//             ) : "Setujui & Selesaikan"}
//           </button>

//           {/* TOMBOL BATAL/TUTUP: Menghindari User Terkunci */}
//           <button 
//             type="button"
//             disabled={loading}
//             onClick={onClose} 
//             className="w-full py-2 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] hover:text-slate-600 transition-colors disabled:opacity-30"
//           >
//              Kembali / Tutup Jendela
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VerificationModal;