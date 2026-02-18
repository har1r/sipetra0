import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HiOutlineCheckCircle, 
  HiOutlineEye, 
  HiOutlineExclamationCircle, 
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTrash, // Icon Trash
} from "react-icons/hi2";
import UserContext from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance"; // Import untuk aksi delete
import { API_PATHS } from "../../utils/apiPaths"; // Import path API
import toast from "react-hot-toast";

const RowActions = ({ task, onApprove }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false); // State loading lokal

  // 1. Cek Status Final (Terminal)
  const isFinalApproved = task.status === "SELESAI";
  const isFinalRejected = task.status === "DITOLAK";
  const isTerminal = isFinalApproved || isFinalRejected;
  
  // 2. Cek Status Revisi
  const isRevised = task.status === "REVISI" || task.overallStatus === "revised";
  
  // 3. Hak Akses Verifikasi
  const canVerify = task.isAccessible;

  // 4. Logika Hak Akses Edit & Delete
  const isAdmin = user?.role === "admin";
  const isPenginput = user?.role === "penginput";
  
  const canEdit = isAdmin || (isPenginput && (task.currentStage === "diinput" || isRevised));

  // --- Fungsi Handle Delete ---
  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus berkas NOPEL: ${task.mainData?.nopel || 'ini'} secara permanen?`)) return;
    
    setIsDeleting(true);
    try {
      await axiosInstance.delete(API_PATHS.TASK.DELETE_TASK(task._id || task.id));
      toast.success("Berkas berhasil dihapus");
      // Me-refresh halaman agar data tabel terupdate
      window.location.reload(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus berkas");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Tombol Lihat Detail */}
      <button 
        onClick={() => navigate(`/task-detail/${task.id || task._id}`)}
        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group" 
        title="Lihat Detail"
      >
        <HiOutlineEye size={20} />
      </button>

      {/* --- TOMBOL EDIT --- */}
      {!isTerminal && canEdit && (
        <button 
          onClick={() => navigate(`/task/update/${task.id || task._id}`)}
          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group border border-transparent hover:border-blue-100" 
          title="Edit Berkas"
        >
          <HiOutlinePencilSquare size={20} />
        </button>
      )}

      {/* --- TOMBOL DELETE (KHUSUS ADMIN) --- */}
      {isAdmin && (
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all group disabled:opacity-50" 
          title="Hapus Berkas"
        >
          <HiOutlineTrash size={20} className={isDeleting ? "animate-pulse" : ""} />
        </button>
      )}

      {/* LOGIKA AKSI VERIFIKASI */}
      {!isTerminal && canVerify && (
        <button 
          onClick={onApprove} 
          className={`p-2.5 rounded-xl transition-all border flex items-center gap-1 group shadow-sm ${
            isRevised 
              ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-600 hover:text-white hover:border-amber-600" 
              : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
          }`} 
          title={isRevised ? "Klik untuk proses perbaikan revisi" : "Verifikasi Berkas"}
        >
          {isRevised ? (
            <HiOutlineArrowPath size={20} className="animate-spin-slow" />
          ) : (
            <HiOutlineCheckCircle size={20} />
          )}
          
          <span className="text-[10px] font-black ml-0.5 hidden group-hover:block uppercase tracking-wider">
            {isRevised ? "Tindak Lanjut" : "Verifikasi"}
          </span>
        </button>
      )}

      {/* LABEL STATUS FINAL: SELESAI */}
      {isFinalApproved && (
        <div 
          className="p-2.5 text-emerald-500 bg-emerald-50 rounded-xl border border-emerald-100 shadow-inner cursor-default" 
          title="Berkas Selesai (Final)"
        >
          <HiOutlineCheckCircle size={20} />
        </div>
      )}

      {/* LABEL STATUS FINAL: DITOLAK */}
      {isFinalRejected && (
        <div 
          className="p-2.5 text-rose-500 bg-rose-50 rounded-xl border border-rose-100 shadow-inner cursor-default" 
          title="Berkas Ditolak Permanen"
        >
          <HiOutlineExclamationCircle size={20} />
        </div>
      )}

      {/* LABEL MENUNGGU */}
      {!isTerminal && !canVerify && (
         <div 
           className="p-2.5 text-slate-300 opacity-40 cursor-not-allowed" 
           title="Menunggu giliran atau butuh akses khusus"
         >
            <HiOutlineCheckCircle size={20} />
         </div>
      )}
    </div>
  );
};

export default RowActions;