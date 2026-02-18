import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClipboardDocumentCheck,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import toast from "react-hot-toast";

const VerificationModal = ({ taskData, onSuccess, onClose, onItemUpdate }) => {
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(null);

  // State khusus untuk Pop-up Konfirmasi Reject
  const [showConfirmReject, setShowConfirmReject] = useState(false);

  useEffect(() => {
    if (taskData?.additionalData) {
      setChecks(
        taskData.additionalData.map((item) => item.addStatus === "approved"),
      );
    }
  }, [taskData]);

  const toggleItemStatus = async (index, itemId) => {
    const currentStatus = checks[index];
    const newStatus = !currentStatus ? "approved" : "in_progress";

    const newChecks = [...checks];
    newChecks[index] = !currentStatus;
    setChecks(newChecks);

    setItemLoading(itemId);
    try {
      const taskId = taskData?._id || taskData?.id;
      await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
        isPartialUpdate: true,
        itemUpdates: [{ itemId: itemId, status: newStatus }],
      });
      if (onItemUpdate) onItemUpdate(taskId, itemId, newStatus);
      toast.success(`${taskData.additionalData[index].newName} diperbarui`, {
        duration: 1500,
        position: "top-right",
      });
    } catch (err) {
      const rollbackChecks = [...checks];
      rollbackChecks[index] = currentStatus;
      setChecks(rollbackChecks);
      toast.error(err.response?.data?.message || "Gagal menyimpan perubahan", {
        position: "top-right",
      });
    } finally {
      setItemLoading(null);
    }
  };

  const isPemeriksa = taskData.currentStage === "diperiksa";
  const canApprove = isPemeriksa
    ? checks.length > 0 && checks.every((v) => v === true)
    : true;

  const handleFinalAction = async (action) => {
    // Validasi catatan wajib untuk Reject & Revised
    if ((action === "rejected" || action === "revised") && !note.trim()) {
      return toast.error("Catatan wajib diisi untuk tindakan ini!", {
        position: "top-right",
      });
    }

    // LOGIKA BARU: Munculkan konfirmasi HANYA jika action adalah 'rejected'
    if (action === "rejected" && !showConfirmReject) {
      setShowConfirmReject(true);
      return;
    }

    const taskId = taskData?._id || taskData?.id;
    setLoading(true);
    const toastId = toast.loading("Memproses berkas...", {
      position: "top-right",
    });

    try {
      await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
        action,
        note: note.trim(),
        isPartialUpdate: false,
      });

      toast.success("Status berkas berhasil diperbarui", {
        id: toastId,
        position: "top-right",
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses tindakan", {
        id: toastId,
        position: "top-right",
      });
    } finally {
      setLoading(false);
      setShowConfirmReject(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
      {/* --- POP UP KONFIRMASI REJECT (HANYA UNTUK REJECT) --- */}
      {showConfirmReject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-rose-50 text-rose-500">
                <HiOutlineExclamationTriangle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  Tolak Permohonan?
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Tindakan ini bersifat{" "}
                  <span className="text-rose-600 font-bold">FINAL</span>. Berkas
                  akan ditolak secara permanen dan tidak dapat diproses lagi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => setShowConfirmReject(false)}
                  className="py-3 px-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleFinalAction("rejected")}
                  className="py-3 px-4 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                >
                  Ya, Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL UTAMA --- */}
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 overflow-hidden relative">
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Verifikasi Berkas
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              NOPEL:{" "}
              <span className="text-slate-600 font-bold">
                {taskData.mainData?.nopel}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <HiOutlineXMark size={24} />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Stage Indicator */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
            <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
              <HiOutlineClipboardDocumentCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none">
                Tahapan Saat Ini
              </p>
              <p className="text-sm font-black text-emerald-900 uppercase">
                {taskData.currentStage}
              </p>
            </div>
          </div>

          {/* Item Validation */}
          {isPemeriksa && (
            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  Validasi Pecahan
                </p>
                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Auto-Save Active
                </p>
              </div>
              <div className="grid gap-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                {taskData.additionalData.map((item, i) => (
                  <label
                    key={item._id}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${checks[i] ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${checks[i] ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                      />
                      <div className="flex flex-col text-left">
                        <span
                          className={`text-sm font-bold ${checks[i] ? "text-emerald-900" : "text-slate-600"}`}
                        >
                          {item.newName}
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          Luas: {item.landWide} m²
                        </span>
                      </div>
                    </div>
                    {itemLoading === item._id ? (
                      <HiOutlineArrowPath
                        size={20}
                        className="text-emerald-500 animate-spin"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded-lg accent-emerald-500"
                        checked={checks[i] || false}
                        onChange={() => toggleItemStatus(i, item._id)}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Note Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 text-slate-400">
              <HiOutlineChatBubbleBottomCenterText size={16} />
              <p className="text-[11px] font-black uppercase tracking-[0.15em]">
                Catatan Verifikator
              </p>
            </div>
            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all resize-none"
              placeholder="Wajib diisi jika revisi atau tolak..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={loading}
                onClick={() => handleFinalAction("revised")}
                className="py-3.5 bg-white text-amber-600 border-2 border-amber-100 rounded-2xl font-bold hover:bg-amber-50 transition-all text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                Minta Revisi
              </button>
              <button
                disabled={loading}
                onClick={() => handleFinalAction("rejected")}
                className="py-3.5 bg-white text-rose-600 border-2 border-rose-100 rounded-2xl font-bold hover:bg-rose-50 transition-all text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                Tolak Berkas
              </button>
            </div>

            <button
              disabled={loading || !canApprove}
              onClick={() => handleFinalAction("approved")}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${canApprove ? "bg-slate-900 text-white hover:bg-emerald-600 shadow-emerald-200/50" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}`}
            >
              {loading ? (
                <HiOutlineArrowPath size={20} className="animate-spin" />
              ) : (
                <>
                  <HiOutlineCheckCircle size={20} />
                  <span>Setujui Tahapan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
