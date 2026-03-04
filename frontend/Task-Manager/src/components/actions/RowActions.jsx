import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import UserContext from "../../contexts/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const RowActions = ({ task, onApprove }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isTerminal = ["approved", "rejected"].includes(task.overallStatus);
  const isFinalApproved = task.overallStatus === "approved";
  const isFinalRejected = task.overallStatus === "rejected";
  const isRevised = task.overallStatus === "revised";
  const canVerify = task.uiHelpers?.isAccessible;

  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isPenginput = role === "penginput";

  const canEdit =
    isAdmin || (isPenginput && (task.currentStage === "diinput" || isRevised));

  const executeDelete = async () => {
    setIsDeleting(true);
    const toastId = toast.loading("Menghapus berkas...");
    try {
      await axiosInstance.delete(
        API_PATHS.TASK.DELETE_TASK(task.id || task._id),
      );
      toast.success("Berkas berhasil dimusnahkan", { id: toastId });
      setShowConfirmDelete(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus berkas", {
        id: toastId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Menggunakan styling tombol dari kode pertama namun dengan ukuran tetap (w-10 h-10) untuk layout vertikal
  const btnBase =
    "w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center border shadow-sm active:scale-90 bg-white";

  return (
    <>
      <div className="flex flex-col gap-2 items-center">
        {/* --- TOMBOL LIHAT DETAIL --- */}
        <button
          onClick={() => navigate(`/task-detail/${task.id || task._id}`)}
          className={`${btnBase} border-slate-200 text-slate-500 hover:border-slate-800 hover:text-slate-800`}
          title="Lihat Detail"
        >
          <HiOutlineEye size={18} />
        </button>

        {/* --- TOMBOL EDIT --- */}
        {!isTerminal && canEdit && (
          <button
            onClick={() => navigate(`/task/update/${task.id || task._id}`)}
            className={`${btnBase} border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-500`}
            title="Edit Data Berkas"
          >
            <HiOutlinePencilSquare size={18} />
          </button>
        )}

        {/* --- TOMBOL TRIGGER DELETE --- */}
        {isAdmin && (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className={`${btnBase} border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600`}
            title="Hapus Permanen"
          >
            <HiOutlineTrash size={18} />
          </button>
        )}

        {/* --- VERIFIKASI (LAYOUT VERTIKAL) --- */}
        {!isTerminal && canVerify && (
          <button
            onClick={onApprove}
            className={`w-10 h-10 rounded-xl transition-all border flex items-center justify-center shadow-md active:scale-95 ${
              isRevised
                ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:shadow-amber-200"
                : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-200"
            }`}
            title={isRevised ? "Perbaiki" : "Verifikasi"}
          >
            {isRevised ? (
              <HiOutlineArrowPath size={18} className="animate-spin-slow" />
            ) : (
              <HiOutlineCheckCircle size={18} />
            )}
          </button>
        )}

        {/* --- STATUS LABELS (VERTIKAL) --- */}
        {isFinalApproved && (
          <div
            className="flex flex-col items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl cursor-default"
            title="Verified"
          >
            <HiOutlineCheckCircle size={18} />
          </div>
        )}

        {isFinalRejected && (
          <div
            className="flex flex-col items-center justify-center w-10 h-10 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl cursor-default"
            title="Rejected"
          >
            <HiOutlineExclamationCircle size={18} />
          </div>
        )}

        {!isTerminal && !canVerify && (
          <div
            className="flex flex-col items-center justify-center w-10 h-10 bg-slate-50 text-slate-300 border border-slate-100 rounded-xl cursor-not-allowed opacity-60"
            title="Waiting"
          >
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* --- MODAL KONFIRMASI HAPUS (Gaya Desain Kode 1) --- */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <HiOutlineTrash size={40} />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                Hapus Berkas?
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 px-4">
                Tindakan ini bersifat{" "}
                <span className="text-rose-600 font-bold">permanen</span>. Data
                yang dihapus tidak dapat dipulihkan.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={executeDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <HiOutlineArrowPath className="animate-spin" size={16} />
                  ) : (
                    "Ya, Hapus Permanen"
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RowActions;
