import React from "react";
import {
  HiOutlineDocumentAdd,
  HiOutlineLink,
  HiX,
  HiOutlineExternalLink,
  HiOutlineTrash,
} from "react-icons/hi";

const AddAttachmentModal = ({
  isOpen,
  formData,
  onUpdateField,
  onClose,
  onSubmit,
  // Tambahkan props ini untuk menangani list dan delete
  attachments = [],
  onDelete,
  title = "Lampiran Berkas",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              Kelola tautan dokumen Google Drive
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Form Section */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">
                Nama File Baru
              </label>
              <div className="relative">
                <HiOutlineDocumentAdd className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  name="fileName"
                  value={formData.fileName}
                  onChange={(e) => onUpdateField(e.target.name, e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none transition-all shadow-sm"
                  placeholder="Contoh: SK Verifikasi"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none transition-all shadow-sm"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200/50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Simpan Lampiran
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-tighter">
              <span className="bg-white px-2 text-slate-400">
                Daftar Lampiran ({attachments.length})
              </span>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-2">
            {attachments.length > 0 ? (
              attachments.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all animate-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-700 truncate capitalize">
                      {item.fileName}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate font-mono tracking-tighter italic">
                      {item.driveLink}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={item.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white text-blue-500 rounded-lg border border-slate-200 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                      title="Buka PDF"
                    >
                      <HiOutlineExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      className="p-2 bg-white text-slate-400 rounded-lg border border-slate-200 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      title="Hapus"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[11px] text-slate-400 font-medium italic">
                  Belum ada lampiran tersimpan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Sistem Pengarsipan Digital
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddAttachmentModal;
