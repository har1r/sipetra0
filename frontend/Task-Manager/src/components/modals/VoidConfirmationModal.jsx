import React, { useState, useEffect } from "react";
import { HiOutlineExclamation } from "react-icons/hi";

const VoidConfirmationModal = ({ isOpen, batchId, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState("");
  
  useEffect(() => { if (!isOpen) setInputValue(""); }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-rose-100">
        {/* Warning Header */}
        <div className="p-6 bg-rose-50 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <HiOutlineExclamation className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Batalkan Report?</h3>
          <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed">
            Aksi ini akan merubah status <span className="font-bold text-rose-600">{batchId}</span> menjadi VOID dan melepaskan semua permohonan di dalamnya.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Ketik <span className="text-rose-600 font-black">VOID</span> untuk konfirmasi
            </label>
            <input
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center text-rose-600 focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              placeholder="Ketik VOID di sini..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              disabled={inputValue !== "VOID"}
              onClick={onConfirm}
              className={`flex-[2] py-3 rounded-xl text-xs font-bold shadow-lg transition-all ${
                inputValue === "VOID"
                  ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200 active:scale-95"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
              }`}
            >
              Ya, Batalkan Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoidConfirmationModal;