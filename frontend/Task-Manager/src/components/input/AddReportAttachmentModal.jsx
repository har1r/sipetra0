import React from "react";
import { HiOutlineDocumentAdd, HiOutlineLink, HiX } from "react-icons/hi";

const AddAttachmentModal = ({
  isOpen,
  formData,
  onUpdateField,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Tambah Lampiran
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
              Nopel: {formData.nopel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">
              Nama File
            </label>
            <div className="relative">
              <HiOutlineDocumentAdd className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                name="fileName"
                value={formData.fileName}
                onChange={(e) => onUpdateField(e.target.name, e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none transition-all"
                placeholder="SK Verifikasi"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">
              Link Google Drive
            </label>
            <div className="relative">
              <HiOutlineLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="url"
                name="driveLink"
                value={formData.driveLink}
                onChange={(e) => onUpdateField(e.target.name, e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none transition-all"
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            Simpan Lampiran
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAttachmentModal;
