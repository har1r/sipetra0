import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaHashtag, FaRegUser, FaMapMarkerAlt, FaHome,
  FaBuilding, FaFileSignature, FaRegStickyNote
} from "react-icons/fa";
import { FaClipboardList, FaPlus, FaRotate } from "react-icons/fa6";
import { HiOutlineX } from "react-icons/hi";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { TITLE_OPTIONS, SUBDISTRICT_OPTIONS } from "../../utils/data";
import { toTitle, toUpper, toNumber } from "../../utils/string";

const INITIAL_ADDITIONAL = {
  newName: "",
  landWide: "",
  buildingWide: "",
  certificate: "",
  note: "",
};

const UpdateTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Form States
  const [title, setTitle] = useState("");
  const [globalNote, setGlobalNote] = useState("");
  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
    oldlandWide: "",
    oldbuildingWide: "",
  });
  const [additionalData, setAdditionalData] = useState([{ ...INITIAL_ADDITIONAL }]);

  // --- Fetch Data ---
  const fetchTask = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id));
      const task = res.data;

      setTitle(task.title || "");
      setGlobalNote(task.globalNote || "");
      setMainData({
        nopel: task.mainData?.nopel || "",
        nop: task.mainData?.nop || "",
        oldName: task.mainData?.oldName || "",
        address: task.mainData?.address || "",
        village: task.mainData?.village || "",
        subdistrict: task.mainData?.subdistrict || "",
        oldlandWide: task.mainData?.oldlandWide || "",
        oldbuildingWide: task.mainData?.oldbuildingWide || "",
      });

      if (task.additionalData?.length > 0) {
        setAdditionalData(task.additionalData);
      }
    } catch (err) {
      toast.error("Gagal memuat data berkas.");
      navigate("/manage-task/task");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // --- Handlers ---
  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainData(prev => ({ ...prev, [name]: value }));
    if (errors[`main_${name}`]) {
      setErrors(prev => {
        const { [`main_${name}`]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAdditionalChange = (e, index) => {
    const { name, value } = e.target;
    const updated = [...additionalData];
    updated[index][name] = value;
    setAdditionalData(updated);

    const errKey = `extra_${name}_${index}`;
    if (errors[errKey]) {
      setErrors(prev => {
        const { [errKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!title) newErrors.title = true;

    Object.entries(mainData).forEach(([key, value]) => {
      if (value === undefined || value === null || value.toString().trim() === "") {
        newErrors[`main_${key}`] = true;
      }
    });

    additionalData.forEach((item, idx) => {
      ["newName", "certificate", "landWide", "buildingWide"].forEach(field => {
        if (!item[field] || item[field].toString().trim() === "") {
          newErrors[`extra_${field}_${idx}`] = true;
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast.error("Lengkapi semua kolom wajib!");

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        globalNote: globalNote.trim(),
        mainData: {
          ...mainData,
          nopel: toUpper(mainData.nopel),
          oldName: toTitle(mainData.oldName),
          address: toTitle(mainData.address),
          oldlandWide: toNumber(mainData.oldlandWide),
          oldbuildingWide: toNumber(mainData.oldbuildingWide),
        },
        additionalData: additionalData.map(item => ({
          ...item,
          newName: toTitle(item.newName),
          landWide: toNumber(item.landWide),
          buildingWide: toNumber(item.buildingWide),
          certificate: toUpper(item.certificate),
        })),
      };

      await axiosInstance.patch(API_PATHS.TASK.UPDATE_TASK(id), payload);
      toast.success("Berkas berhasil diperbarui!");
      navigate("/manage-task/task");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui berkas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
          <FaRotate className="animate-spin mb-4" size={32} />
          <p className="font-medium">Memuat data berkas...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <FaClipboardList className="text-blue-600" /> Edit Permohonan
                </h2>
                <div className="h-1.5 w-12 bg-blue-500 rounded-full mt-2" />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                ID: {id.substring(0, 8)}...
              </span>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Jenis Permohonan */}
              <div className="grid grid-cols-1 gap-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Jenis Permohonan *</label>
                <SelectField
                  value={title}
                  error={errors.title}
                  onChange={(e) => setTitle(e.target.value)}
                  options={TITLE_OPTIONS}
                  label="Jenis Permohonan"
                />
              </div>

              {/* Data Utama Section */}
              <section className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FaHome size={14}/></span>
                  Data Utama Objek Pajak
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField icon={FaHashtag} name="nopel" label="No. Pelayanan (NOPEL)" value={mainData.nopel} onChange={handleMainChange} error={errors.main_nopel} />
                  <InputField icon={FaFileSignature} name="nop" label="Nomor Objek Pajak (NOP)" value={mainData.nop} onChange={handleMainChange} error={errors.main_nop} />
                  <InputField icon={FaRegUser} name="oldName" label="Nama Wajib Pajak (Lama)" value={mainData.oldName} onChange={handleMainChange} error={errors.main_oldName} />
                  <InputField icon={FaMapMarkerAlt} name="address" label="Alamat Objek" value={mainData.address} onChange={handleMainChange} error={errors.main_address} />
                  <InputField icon={FaHome} name="village" label="Kelurahan / Desa" value={mainData.village} onChange={handleMainChange} error={errors.main_village} />
                  <SelectField name="subdistrict" label="Kecamatan" value={mainData.subdistrict} options={SUBDISTRICT_OPTIONS} onChange={handleMainChange} error={errors.main_subdistrict} />
                  <InputField icon={FaMapMarkerAlt} name="oldlandWide" type="number" label="Luas Tanah (Lama)" value={mainData.oldlandWide} onChange={handleMainChange} error={errors.main_oldlandWide} />
                  <InputField icon={FaHome} name="oldbuildingWide" type="number" label="Luas Bangunan (Lama)" value={mainData.oldbuildingWide} onChange={handleMainChange} error={errors.main_oldbuildingWide} />
                </div>
              </section>

              {/* Data Pecahan Section */}
              <section className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><FaBuilding size={14}/></span>
                  Rincian Pecahan
                </h3>
                <div className="space-y-4">
                  {additionalData.map((item, idx) => (
                    <AdditionalRow
                      key={idx} index={idx} item={item} errors={errors}
                      onChange={handleAdditionalChange}
                      onRemove={(i) => setAdditionalData(prev => prev.filter((_, index) => index !== i))}
                      canRemove={additionalData.length > 1}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAdditionalData(p => [...p, { ...INITIAL_ADDITIONAL }])}
                  className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <FaPlus size={12} /> Tambah Baris Pecahan
                </button>
              </section>

              {/* Global Note */}
              <section className="space-y-3 pt-4">
                <label className="font-bold text-slate-700 flex items-center gap-2">
                  <FaRegStickyNote className="text-slate-400" /> Catatan Tambahan (Opsional)
                </label>
                <InputField as="textarea" name="globalNote" label="Berikan keterangan tambahan jika diperlukan..." value={globalNote} onChange={(e) => setGlobalNote(e.target.value)} />
              </section>

              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 flex items-center gap-3"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Guide */}
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-7 rounded-[2rem] sticky top-24 shadow-2xl overflow-hidden">
            <h4 className="font-bold mb-6 flex items-center gap-2 text-blue-400 relative">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> Mode Edit
            </h4>
            <ul className="text-xs space-y-5 opacity-80 leading-relaxed relative">
              <li className="flex gap-3">
                <span className="font-bold text-blue-400">!</span>
                <span>Perubahan data akan memicu pemeriksaan ulang oleh tim terkait.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-400">!</span>
                <span>Jika berkas sebelumnya berstatus <b>Revisi</b>, menyimpan perubahan akan mengembalikan status ke <b>Proses</b>.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

// --- Helper Components (Gunakan yang sama dengan CreateTask) ---

const InputField = ({ icon: Icon, label, error, as = "input", ...props }) => (
  <div className="w-full">
    <div className="relative group">
      {Icon && <Icon className={`absolute left-4 ${as === "textarea" ? "top-4" : "top-3.5"} ${error ? "text-red-500" : "text-slate-400 group-focus-within:text-blue-500"} transition-colors`} />}
      {as === "textarea" ? (
        <textarea
          className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-2xl outline-none transition-all text-sm min-h-[100px] 
            ${error ? "border-red-500 bg-red-50" : "border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"}`}
          placeholder={label} {...props}
        />
      ) : (
        <input
          className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-2xl outline-none transition-all text-sm
            ${error ? "border-red-500 bg-red-50" : "border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"}`}
          placeholder={label} {...props}
        />
      )}
    </div>
  </div>
);

const SelectField = ({ label, options, error, ...props }) => (
  <select
    className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none text-sm cursor-pointer transition-all
      ${error ? "border-red-500 bg-red-50" : "border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"}`}
    {...props}
  >
    <option value="">-- Pilih {label} --</option>
    {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
  </select>
);

const AdditionalRow = ({ index, item, onChange, onRemove, canRemove, errors }) => {
  const hasError = Object.keys(errors).some(key => key.includes(`_${index}`));
  
  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all space-y-5 shadow-sm 
      ${hasError ? "bg-red-50/50 border-red-100" : "bg-white border-slate-100 hover:border-blue-100"}`}>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold">
            {index + 1}
          </span>
          <h4 className="text-sm font-bold text-slate-700">Detail Objek Pecahan</h4>
        </div>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <HiOutlineX size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField icon={FaRegUser} name="newName" label="Nama Baru" value={item.newName} onChange={(e) => onChange(e, index)} error={errors[`extra_newName_${index}`]} />
        <InputField icon={FaFileSignature} name="certificate" label="No. Sertifikat" value={item.certificate} onChange={(e) => onChange(e, index)} error={errors[`extra_certificate_${index}`]} />
        <InputField icon={FaMapMarkerAlt} name="landWide" label="Luas Tanah" type="number" value={item.landWide} onChange={(e) => onChange(e, index)} error={errors[`extra_landWide_${index}`]} />
        <InputField icon={FaBuilding} name="buildingWide" label="Luas Bangunan" type="number" value={item.buildingWide} onChange={(e) => onChange(e, index)} error={errors[`extra_buildingWide_${index}`]} />
      </div>

      <InputField as="textarea" name="note" label="Catatan khusus objek ini (Opsional)" value={item.note} onChange={(e) => onChange(e, index)} />
    </div>
  );
};

export default UpdateTask;