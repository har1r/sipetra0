import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const VerifikasiModal = ({ taskId, onSuccess, onClose }) => {
  const [task, setTask] = useState(null);
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(taskId)).then((res) => {
      setTask(res.data);
      if (res.data?.additionalData) {
        setChecks(
          res.data.additionalData.map((item) => item.status === "selesai"),
        );
      }
    });
  }, [taskId]);

  const isReady = useMemo(() => {
    if (task?.currentStage !== "selesai") return true;
    return checks.length > 0 && checks.every((c) => c === true);
  }, [checks, task]);

  const handleAction = async (action) => {
    if (action === "approved" && !isReady)
      return toast.error("Mohon centang semua pecahan terlebih dahulu!");

    setLoading(true);
    try {
      await axiosInstance.patch(API_PATHS.TASK.APPROVE_TASK(taskId), {
        action,
        note,
        itemApprovals: checks.map((c, i) => ({
          index: i,
          status: c ? "selesai" : "proses",
        })),
      });
      toast.success(`Berkas berhasil diproses`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses");
    } finally {
      setLoading(false);
    }
  };

  if (!task)
    return (
      <div className="p-10 text-center animate-pulse text-slate-400">
        Memuat data...
      </div>
    );

  return (
    <div className="p-1 space-y-5">
      <div className="border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Verifikasi Berkas</h2>
        <div className="flex gap-2 mt-1">
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
            {/* Konsisten menggunakan task.nopel sesuai data utama */}
            {task.nopel || task.mainData?.nopel}
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase">
            {task.currentStage}
          </span>
        </div>
      </div>

      {task.currentStage === "selesai" && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Checklist Kelengkapan Pecahan:
          </p>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {task.additionalData.map((item, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  checks[i]
                    ? "bg-emerald-50 border-emerald-500"
                    : "bg-white border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-600"
                  checked={checks[i]}
                  onChange={() => {
                    const newChecks = [...checks];
                    newChecks[i] = !newChecks[i];
                    setChecks(newChecks);
                  }}
                />
                <span className="text-sm font-medium text-slate-700">
                  {item.newName}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Catatan Pemeriksaan:
        </label>
        <textarea
          className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] bg-slate-50 focus:bg-white transition-all"
          placeholder="Tulis catatan tambahan..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600"
        >
          Batal
        </button>
        <button
          disabled={loading}
          onClick={() => handleAction("rejected")}
          className="px-5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        >
          Tolak
        </button>
        <button
          disabled={loading || (task.currentStage === "selesai" && !isReady)}
          onClick={() => handleAction("approved")}
          className={`px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 ${
            task.currentStage === "selesai" && !isReady
              ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
              : "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
          }`}
        >
          {loading ? "Proses..." : "Setujui"}
        </button>
      </div>
    </div>
  );
};

export default VerifikasiModal;
