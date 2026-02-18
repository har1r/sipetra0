import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaHashtag,
  FaRegUser,
  FaMapMarkerAlt,
  FaHome,
  FaDatabase,
  FaFileSignature,
  FaRegStickyNote,
  FaMap,
} from "react-icons/fa";
import { FaClipboardList, FaPlus } from "react-icons/fa6";
import { HiOutlineX } from "react-icons/hi";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { TITLE_OPTIONS, SUBDISTRICT_OPTIONS } from "../../utils/data";
import { toTitle, toUpper, toNumber } from "../../utils/string";

const INITIAL_ADDITIONAL_ITEM = {
  newName: "",
  landWide: "",
  buildingWide: "",
  certificate: "",
  addStatus: "in_progress",
  note: "",
};

const UpdateTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Unified State (Identik dengan CreateTask)
  const [formData, setFormData] = useState({
    title: "",
    mainData: {
      nopel: "",
      nop: "",
      oldName: "",
      address: "",
      village: "",
      subdistrict: "",
      oldlandWide: "",
      oldbuildingWide: "",
    },
    globalNote: "",
  });

  const [additionalData, setAdditionalData] = useState([]);

  // --- Logic Variable ---
  const isPengaktifan = formData.title.toLowerCase().includes("pengaktifan");

  // --- Real-time Calculation ---
  const landStats = useMemo(() => {
    const totalAllocated = additionalData.reduce(
      (sum, item) => sum + toNumber(item.landWide),
      0,
    );
    const limit = toNumber(formData.mainData.oldlandWide);
    const remaining = limit - totalAllocated;
    return { totalAllocated, remaining, limit };
  }, [additionalData, formData.mainData.oldlandWide]);

  // --- Fetch Data ---
  const fetchTask = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id));
      const task = res.data.data;
      console.log("Fetched Task:", task);

      if (!task) {
        toast.error("Data tidak ditemukan.");
        return navigate("/manage-task/task");
      }

      setFormData({
        title: task.title || "",
        globalNote: task.globalNote || "",
        mainData: {
          nopel: task.mainData?.nopel || "",
          nop: task.mainData?.nop || "",
          oldName: task.mainData?.oldName || "",
          address: task.mainData?.address || "",
          village: task.mainData?.village || "",
          subdistrict: task.mainData?.subdistrict || "",
          oldlandWide: task.mainData?.oldlandWide || 0,
          oldbuildingWide: task.mainData?.oldbuildingWide || 0,
        },
      });

      setAdditionalData(
        task.additionalData?.length > 0
          ? task.additionalData
          : [{ ...INITIAL_ADDITIONAL_ITEM }],
      );
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
    if (name === "title" || name === "globalNote") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        mainData: { ...prev.mainData, [name]: value },
      }));
    }

    const errorKey = name === "title" ? "title" : `main_${name}`;
    if (errors[errorKey]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[errorKey];
      setErrors(updatedErrors);
    }
  };

  const handleAdditionalChange = (e, index) => {
    const { name, value } = e.target;
    const updated = [...additionalData];
    updated[index] = { ...updated[index], [name]: value };
    setAdditionalData(updated);

    const errorKey = `extra_${name}_${index}`;
    if (errors[errorKey]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[errorKey];
      setErrors(updatedErrors);
    }
  };

  // --- Logic & Validation (Sesuai CreateTask) ---
  const validateForm = () => {
    const newErrors = {};
    const missingFields = [];

    const isInvalid = (val) =>
      val === undefined || val === null || val.toString().trim() === "";

    if (!formData.title) {
      newErrors.title = true;
      missingFields.push("Jenis Permohonan");
    }

    const mainLabelMap = {
      nopel: "No. Pelayanan",
      nop: "NOP",
      oldName: "Nama WP Lama",
      address: "Alamat",
      village: "Kelurahan",
      subdistrict: "Kecamatan",
      oldlandWide: "Luas Tanah Lama",
      oldbuildingWide: "Luas Bangunan Lama",
    };

    Object.entries(formData.mainData).forEach(([key, value]) => {
      if (key === "nopel" && isPengaktifan) return;
      if (isInvalid(value)) {
        newErrors[`main_${key}`] = true;
        if (mainLabelMap[key]) missingFields.push(mainLabelMap[key]);
      }
    });

    additionalData.forEach((item, index) => {
      ["newName", "certificate", "landWide", "buildingWide"].forEach(
        (field) => {
          if (isInvalid(item[field])) {
            newErrors[`extra_${field}_${index}`] = true;
          }
        },
      );
      // Jika baris ini ada error tapi belum masuk list missingFields
      const rowHasError = [
        "newName",
        "certificate",
        "landWide",
        "buildingWide",
      ].some((f) => isInvalid(item[f]));
      if (rowHasError) missingFields.push(`Detail Pecahan ${index + 1}`);
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      missingFields: [...new Set(missingFields)], // Unikkan list
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, missingFields } = validateForm();

    if (!isValid) {
      const errorMsg =
        missingFields.length <= 3
          ? `Kolom ${missingFields.join(", ")} wajib diisi.`
          : `Ada ${missingFields.length} area data yang belum lengkap!`;

      toast.error(errorMsg);
      setTimeout(() => {
        const firstError = document.querySelector(".border-red-500");
        if (firstError)
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        globalNote: formData.globalNote.trim(),
        mainData: {
          ...formData.mainData,
          nopel: isPengaktifan ? "" : toUpper(formData.mainData.nopel), // Backend handle generate jika kosong & pengaktifan
          oldName: toTitle(formData.mainData.oldName),
          address: toTitle(formData.mainData.address),
          oldlandWide: toNumber(formData.mainData.oldlandWide),
          oldbuildingWide: toNumber(formData.mainData.oldbuildingWide),
        },
        additionalData: additionalData.map((item) => ({
          ...item,
          newName: toTitle(item.newName),
          landWide: toNumber(item.landWide),
          buildingWide: toNumber(item.buildingWide),
          certificate: toUpper(item.certificate),
        })),
      };

      await axiosInstance.patch(API_PATHS.TASK.UPDATE_TASK(id), payload);
      toast.success("Perubahan berkas berhasil disimpan!");
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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="font-bold tracking-tight">Memuat Data Berkas...</p>
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
                  <FaClipboardList className="text-emerald-600" /> Perbarui
                  Permohonan
                </h2>
                <div className="h-1.5 w-12 bg-emerald-500 rounded-full mt-2" />
              </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Jenis Permohonan */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Jenis Permohonan *
                </label>
                <SelectField
                  name="title"
                  value={formData.title}
                  error={errors.title}
                  onChange={handleMainChange}
                  options={TITLE_OPTIONS}
                  label="Jenis Permohonan"
                />
              </div>

              {/* Data Utama */}
              <section className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                    <FaDatabase size={14} />
                  </span>
                  Data Utama Objek Pajak
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    icon={FaHashtag}
                    name="nopel"
                    label={
                      isPengaktifan
                        ? "No. Pelayanan Otomatis (Sistem)"
                        : "No. Pelayanan"
                    }
                    disabled={isPengaktifan}
                    value={
                      isPengaktifan
                        ? "SISTEM GENERATED"
                        : formData.mainData.nopel
                    }
                    onChange={handleMainChange}
                    error={errors.main_nopel}
                  />
                  <InputField
                    icon={FaFileSignature}
                    name="nop"
                    label="NOP"
                    value={formData.mainData.nop}
                    onChange={handleMainChange}
                    error={errors.main_nop}
                  />
                  <InputField
                    icon={FaRegUser}
                    name="oldName"
                    label="Nama WP Lama"
                    value={formData.mainData.oldName}
                    onChange={handleMainChange}
                    error={errors.main_oldName}
                  />
                  <InputField
                    icon={FaMap}
                    name="address"
                    label="Alamat Objek"
                    value={formData.mainData.address}
                    onChange={handleMainChange}
                    error={errors.main_address}
                  />
                  <InputField
                    icon={FaMap}
                    name="village"
                    label="Kelurahan"
                    value={formData.mainData.village}
                    onChange={handleMainChange}
                    error={errors.main_village}
                  />
                  <SelectField
                    name="subdistrict"
                    label="Kecamatan"
                    value={formData.mainData.subdistrict}
                    options={SUBDISTRICT_OPTIONS}
                    onChange={handleMainChange}
                    error={errors.main_subdistrict}
                  />
                  <InputField
                    icon={FaMapMarkerAlt}
                    name="oldlandWide"
                    type="number"
                    label="Luas Tanah Lama"
                    value={formData.mainData.oldlandWide}
                    onChange={handleMainChange}
                    error={errors.main_oldlandWide}
                  />
                  <InputField
                    icon={FaHome}
                    name="oldbuildingWide"
                    type="number"
                    label="Luas Bangunan Lama"
                    value={formData.mainData.oldbuildingWide}
                    onChange={handleMainChange}
                    error={errors.main_oldbuildingWide}
                  />
                </div>
              </section>

              {/* Data Tambahan */}
              <section className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <FaDatabase size={14} />
                    </span>
                    Data Tambahan Objek Pajak
                  </h3>
                  {toNumber(formData.mainData.oldlandWide) > 0 && (
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                        Terpakai: {landStats.totalAllocated} / {landStats.limit}{" "}
                        m²
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${landStats.remaining < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        Sisa: {landStats.remaining} m²
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {additionalData.map((item, index) => (
                    <AdditionalRow
                      key={index}
                      index={index}
                      item={item}
                      errors={errors}
                      onChange={handleAdditionalChange}
                      onRemove={(i) =>
                        setAdditionalData((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      canRemove={additionalData.length > 1}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdditionalData((p) => [
                      ...p,
                      { ...INITIAL_ADDITIONAL_ITEM },
                    ])
                  }
                  className="flex items-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 rounded-2xl font-bold text-sm transition-all border border-dashed border-emerald-200"
                >
                  <FaPlus size={12} /> Tambah Baris Pecahan
                </button>
              </section>

              {/* Note */}
              <section className="space-y-3 pt-4">
                <label className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <FaRegStickyNote className="text-slate-400" /> Catatan
                  Perubahan (Opsional)
                </label>
                <InputField
                  as="textarea"
                  name="globalNote"
                  label="Jelaskan alasan perubahan data ini..."
                  value={formData.globalNote}
                  onChange={handleMainChange}
                />
              </section>

              {/* Actions */}
              <div className="pt-8 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Guide */}
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-7 rounded-[2.5rem] sticky top-24 shadow-2xl border border-slate-800 text-[11px] space-y-6 leading-relaxed">
            <h4 className="font-bold flex items-center gap-2 text-emerald-400 text-sm">
              Petunjuk Perubahan
            </h4>
            <div className="space-y-4 opacity-90">
              <p>
                <b className="text-white">01. Verifikasi:</b> Berkas yang diedit
                akan ditinjau ulang sesuai alur sistem.
              </p>
              <p>
                <b className="text-white">02. Akurasi Luas:</b> Periksa kembali
                sisa luas tanah agar tidak minus.
              </p>
              <p>
                <b className="text-white">03. NOPEL:</b> Untuk pengaktifan,
                nomor akan diperbarui otomatis jika dikosongkan.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

// --- Sub-Components (Identik dengan CreateTask) ---
const InputField = ({
  icon: Icon,
  label,
  error,
  as = "input",
  disabled,
  ...props
}) => (
  <div className="w-full space-y-1 relative group">
    {Icon && (
      <Icon
        className={`absolute left-4 ${as === "textarea" ? "top-4" : "top-3.5"} ${disabled ? "text-slate-300" : error ? "text-red-500" : "text-slate-400 group-focus-within:text-emerald-500"}`}
      />
    )}
    {as === "textarea" ? (
      <textarea
        disabled={disabled}
        className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl outline-none text-sm min-h-[100px] transition-all ${disabled ? "bg-slate-100 text-slate-400" : error ? "border-red-500 bg-red-50" : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
        placeholder={label}
        {...props}
      />
    ) : (
      <input
        disabled={disabled}
        className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-sm transition-all ${disabled ? "bg-slate-100 text-slate-400 font-medium" : error ? "border-red-500 bg-red-50" : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
        placeholder={label}
        {...props}
      />
    )}
  </div>
);

const SelectField = ({ label, options, error, ...props }) => (
  <select
    className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none text-sm cursor-pointer transition-all ${error ? "border-red-500 bg-red-50" : "border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
    {...props}
  >
    <option value="">-- Pilih {label} --</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const AdditionalRow = ({
  index,
  item,
  onChange,
  onRemove,
  canRemove,
  errors,
}) => {
  const rowFields = ["newName", "certificate", "landWide", "buildingWide"];
  const hasRowError = rowFields.some((f) => errors[`extra_${f}_${index}`]);

  return (
    <div
      className={`p-6 rounded-[2rem] border-2 space-y-5 transition-all ${hasRowError ? "bg-red-50/30 border-red-100" : "bg-white border-slate-100 hover:border-emerald-100"}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 flex items-center justify-center bg-slate-800 text-white rounded-full text-[10px] font-bold">
            {index + 1}
          </span>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Detail Objek Pecahan
          </h4>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <HiOutlineX size={18} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField
          icon={FaRegUser}
          name="newName"
          label="Nama Baru"
          value={item.newName}
          onChange={(e) => onChange(e, index)}
          error={errors[`extra_newName_${index}`]}
        />
        <InputField
          icon={FaFileSignature}
          name="certificate"
          label="No. Sertifikat"
          value={item.certificate}
          onChange={(e) => onChange(e, index)}
          error={errors[`extra_certificate_${index}`]}
        />
        <InputField
          icon={FaMapMarkerAlt}
          name="landWide"
          label="Luas Tanah"
          type="number"
          value={item.landWide}
          onChange={(e) => onChange(e, index)}
          error={errors[`extra_landWide_${index}`]}
        />
        <InputField
          icon={FaHome}
          name="buildingWide"
          label="Luas Bangunan"
          type="number"
          value={item.buildingWide}
          onChange={(e) => onChange(e, index)}
          error={errors[`extra_buildingWide_${index}`]}
        />
      </div>
      <InputField
        as="textarea"
        name="note"
        label="Catatan khusus objek ini"
        value={item.note}
        onChange={(e) => onChange(e, index)}
      />
    </div>
  );
};

export default UpdateTask;
