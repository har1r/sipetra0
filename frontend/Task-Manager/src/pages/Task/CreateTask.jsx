import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

const CreateTask = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Unified State for better consistency
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

  const [additionalData, setAdditionalData] = useState([
    { ...INITIAL_ADDITIONAL_ITEM },
  ]);

  // --- Handlers ---
  const handleMainChange = (event) => {
    const { name, value } = event.target;

    // Update mainData or top-level fields (title/globalNote)
    if (name === "title" || name === "globalNote") {
      setFormData((previous) => ({ ...previous, [name]: value }));
    } else {
      setFormData((previous) => ({
        ...previous,
        mainData: { ...previous.mainData, [name]: value },
      }));
    }

    // Clear error dynamically
    const errorKey = name === "title" ? "title" : `main_${name}`;
    if (errors[errorKey]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[errorKey];
      setErrors(updatedErrors);
    }
  };

  const handleAdditionalChange = (event, index) => {
    const { name, value } = event.target;
    const updatedList = [...additionalData];
    updatedList[index][name] = value;
    setAdditionalData(updatedList);

    const errorKey = `extra_${name}_${index}`;
    if (errors[errorKey]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[errorKey];
      setErrors(updatedErrors);
    }
  };

  const addAdditionalRow = () => {
    setAdditionalData((previous) => [
      ...previous,
      { ...INITIAL_ADDITIONAL_ITEM },
    ]);
  };

  const removeAdditionalRow = (indexToRemove) => {
    if (additionalData.length > 1) {
      setAdditionalData((previous) =>
        previous.filter((_, index) => index !== indexToRemove),
      );
    }
  };

  // --- UX Improvement: Real-time calculation ---
  const landStats = useMemo(() => {
    const totalAllocated = additionalData.reduce(
      (sum, item) => sum + toNumber(item.landWide),
      0,
    );

    const limit = toNumber(formData.mainData.oldlandWide);
    const remaining = limit - totalAllocated;

    return { totalAllocated, remaining, limit };
  }, [additionalData, formData.mainData.oldlandWide]);

  // Global Logic Variable (Re-computed setiap kali formData.title berubah)
  const isPengaktifan = formData.title.toLowerCase().includes("pengaktifan");

  // --- Logic & Validation ---
  const validateForm = () => {
    const newErrors = {};
    const missingFields = [];

    // Helper untuk cek validitas (Mengizinkan angka 0 dan string "-")
    const isInvalid = (val) => {
      return val === undefined || val === null || val.toString().trim() === "";
    };

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
      // LOGIKA BARU: Jika Pengaktifan, nopel boleh kosong karena diisi otomatis oleh Backend
      if (key === "nopel" && isPengaktifan) return;

      // Gunakan isInvalid agar angka 0 tidak dianggap error
      if (isInvalid(value)) {
        newErrors[`main_${key}`] = true;
        if (mainLabelMap[key]) missingFields.push(mainLabelMap[key]);
      }
    });

    additionalData.forEach((item, index) => {
      ["newName", "certificate", "landWide", "buildingWide"].forEach(
        (field) => {
          // Gunakan isInvalid agar angka 0 tidak dianggap error
          if (isInvalid(item[field])) {
            newErrors[`extra_${field}_${index}`] = true;
          }
          if (
            !missingFields.includes(`Detail Pecahan ${index + 1}`) &&
            newErrors[`extra_${field}_${index}`]
          ) {
            missingFields.push(`Detail Pecahan ${index + 1}`);
          }
        },
      );
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      missingFields,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { isValid, missingFields } = validateForm();

    if (!isValid) {
      const errorMsg =
        missingFields.length <= 3
          ? `Kolom ${missingFields.join(", ")} wajib diisi.`
          : `Ada ${missingFields.length} kolom yang belum diisi!`;

      toast.error(errorMsg, {
        duration: 4000,
        style: { border: "1px solid #ef4444", padding: "16px" },
      });

      setTimeout(() => {
        const firstErrorElement = document.querySelector(".border-red-500");
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          firstErrorElement.focus();
        }
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

          nopel:
            isPengaktifan && !formData.mainData.nopel
              ? ""
              : toUpper(formData.mainData.nopel),
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
        })),
      };

      const response = await axiosInstance.post(
        API_PATHS.TASK.CREATE_TASK,
        payload,
      );

      toast.success(response.data.message || "Berkas berhasil didaftarkan!");

      navigate("/manage-task/task");
    } catch (error) {
      const serverMessage = error.response?.data?.message || "";

      if (
        serverMessage.toLowerCase().includes("sudah terdaftar") ||
        serverMessage.toLowerCase().includes("nopel")
      ) {
        setErrors((prev) => ({ ...prev, main_nopel: true }));

        toast.error("No. Pelayanan (NOPEL) sudah digunakan!", {
          duration: 4000,
          style: { border: "1px solid #ef4444", padding: "16px" },
        });

        setTimeout(() => {
          const nopelElement =
            document.getElementsByName("nopel")[0] ||
            document.querySelector(".border-red-500");

          if (nopelElement) {
            nopelElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            nopelElement.focus();
          }
        }, 100);
      } else {
        toast.error(serverMessage || "Gagal menyimpan berkas.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <FaClipboardList className="text-emerald-600" /> Daftarkan
                  Permohonan
                </h2>
                <div className="h-1.5 w-12 bg-emerald-500 rounded-full mt-2" />
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Sequential Approval Ready
                </span>
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

              {/* Data Utama Section */}
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
                    // Jika pengaktifan, tampilkan teks placeholder sistem agar user tidak bingung
                    value={
                      isPengaktifan
                        ? "Dibuat Otomatis"
                        : formData.mainData.nopel
                    }
                    onChange={handleMainChange}
                    error={errors.main_nopel}
                    disabled={isPengaktifan}
                  />
                  <InputField
                    icon={FaFileSignature}
                    name="nop"
                    label="Nomor Objek Pajak (NOP)"
                    value={formData.mainData.nop}
                    onChange={handleMainChange}
                    error={errors.main_nop}
                  />
                  <InputField
                    icon={FaRegUser}
                    name="oldName"
                    label="Nama Wajib Pajak (Lama)"
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
                    label="Kelurahan / Desa"
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
                    label="Luas Tanah (Lama)"
                    value={formData.mainData.oldlandWide}
                    onChange={handleMainChange}
                    error={errors.main_oldlandWide}
                  />
                  <InputField
                    icon={FaHome}
                    name="oldbuildingWide"
                    type="number"
                    label="Luas Bangunan (Lama)"
                    value={formData.mainData.oldbuildingWide}
                    onChange={handleMainChange}
                    error={errors.main_oldbuildingWide}
                  />
                </div>
              </section>

              {/* Data Pecahan Section */}
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
                      {/* Indikator Terpakai */}
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                        Terpakai: {landStats.totalAllocated} / {landStats.limit}{" "}
                        m²
                      </span>

                      {/* Indikator Sisa (Bisa Negatif) */}
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          landStats.remaining < 0
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
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
                      onRemove={removeAdditionalRow}
                      canRemove={additionalData.length > 1}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addAdditionalRow}
                  className="flex items-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 rounded-2xl font-bold text-sm transition-all border border-dashed border-emerald-200"
                >
                  <FaPlus size={12} /> Tambah Baris Pecahan
                </button>
              </section>

              {/* Global Note */}
              <section className="space-y-3 pt-4">
                <label className="font-bold text-sm text-slate-700 flex items-center gap-2">
                  <FaRegStickyNote className="text-slate-400" /> Catatan
                  Tambahan (Opsional)
                </label>
                <InputField
                  as="textarea"
                  name="globalNote"
                  label="Berikan keterangan tambahan jika diperlukan..."
                  value={formData.globalNote}
                  onChange={handleMainChange}
                />
              </section>

              <div className="pt-8 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto ml-auto bg-emerald-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Daftarkan Permohonan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Guide */}
        <aside className="lg:col-span-1">
          <div className="bg-slate-900 text-white p-7 rounded-[2.5rem] sticky top-24 shadow-2xl border border-slate-800">
            <h4 className="font-bold mb-6 flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Panduan Pengisian
            </h4>

            {isPengaktifan && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] text-emerald-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="font-bold mb-1 italic">
                  ✨ Mode Pengaktifan Aktif
                </p>
                Sistem akan menonaktifkan input NOPEL dan membuat nomor otomatis
                setelah data disimpan.
              </div>
            )}

            <ul className="text-[11px] space-y-6 opacity-90 leading-relaxed">
              {/* Poin 1: NOPEL Logic */}
              <li className="flex gap-3">
                <b className="text-emerald-400">01.</b>
                <p>
                  <b className="text-white">Sistem Penomoran:</b> Untuk jenis{" "}
                  <b>Pengaktifan</b>, NOPEL akan dibuat otomatis oleh sistem.
                  Untuk jenis lain, pastikan NOPEL belum pernah terdaftar.
                </p>
              </li>

              {/* Poin 2: Land Calculation */}
              <li className="flex gap-3">
                <b className="text-emerald-400">02.</b>
                <p>
                  <b className="text-white">Alokasi Lahan:</b> Pantau indikator{" "}
                  <span className="text-emerald-400 font-bold">Sisa Tanah</span>
                  . Sistem mengizinkan nilai <b>negatif</b>, namun pastikan data
                  sesuai dengan sertifikat pecahan.
                </p>
              </li>

              {/* Poin 3: Dynamic Rows */}
              <li className="flex gap-3">
                <b className="text-emerald-400">03.</b>
                <p>
                  <b className="text-white">Data Pecahan:</b> Anda dapat
                  menambahkan lebih dari satu objek pecahan. Pastikan setiap
                  baris memiliki <b>Nama Baru</b> dan <b>No. Sertifikat</b> yang
                  valid.
                </p>
              </li>

              {/* Poin 4: Auto Approval */}
              <li className="flex gap-3">
                <b className="text-emerald-400">04.</b>
                <p>
                  <b className="text-white">Otomatisasi:</b> Berkas yang
                  didaftarkan akan langsung masuk ke tahap{" "}
                  <i className="text-slate-400">In Progress</i> dan siap untuk
                  proses verifikasi lanjutan.
                </p>
              </li>
            </ul>

            {/* Info Tambahan */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>Wajib diisi</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

// --- Sub-Components (Optimized) ---
const InputField = ({
  icon: Icon,
  label,
  error,
  as = "input",
  disabled,
  ...props
}) => (
  <div className="w-full space-y-1">
    <div className="relative group">
      {Icon && (
        <Icon
          className={`absolute left-4 ${as === "textarea" ? "top-4" : "top-3.5"} 
          ${error ? "text-red-500" : "text-slate-400 group-focus-within:text-emerald-500"} 
          ${disabled ? "text-slate-300" : ""} transition-colors`}
        />
      )}
      {as === "textarea" ? (
        <textarea
          disabled={disabled}
          className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl outline-none transition-all text-sm min-h-[100px] 
            ${
              disabled
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : error
                  ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                  : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
            }`}
          placeholder={label}
          {...props}
        />
      ) : (
        <input
          disabled={disabled}
          className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none transition-all text-sm
            ${
              disabled
                ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                : error
                  ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                  : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
            }`}
          placeholder={label}
          {...props}
        />
      )}
    </div>
  </div>
);

const SelectField = ({ label, options, error, ...props }) => (
  <select
    className={`w-full px-4 py-3.5 bg-slate-50 border rounded-2xl outline-none text-sm cursor-pointer transition-all
      ${error ? "border-red-500 bg-red-50" : "border-slate-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"}`}
    {...props}
  >
    <option value="">-- Pilih {label} --</option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
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
  const hasRowError = Object.keys(errors).some((key) =>
    key.endsWith(`_${index}`),
  );

  return (
    <div
      className={`p-6 rounded-[2rem] border-2 transition-all space-y-5 
      ${hasRowError ? "bg-red-50/30 border-red-100" : "bg-white border-slate-100 hover:border-emerald-100 shadow-sm"}`}
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
            title="Hapus baris"
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
          onChange={(event) => onChange(event, index)}
          error={errors[`extra_newName_${index}`]}
        />
        <InputField
          icon={FaFileSignature}
          name="certificate"
          label="No. Sertifikat"
          value={item.certificate}
          onChange={(event) => onChange(event, index)}
          error={errors[`extra_certificate_${index}`]}
        />
        <InputField
          icon={FaMapMarkerAlt}
          name="landWide"
          label="Luas Tanah"
          type="number"
          value={item.landWide}
          onChange={(event) => onChange(event, index)}
          error={errors[`extra_landWide_${index}`]}
        />
        <InputField
          icon={FaHome}
          name="buildingWide"
          label="Luas Bangunan"
          type="number"
          value={item.buildingWide}
          onChange={(event) => onChange(event, index)}
          error={errors[`extra_buildingWide_${index}`]}
        />
      </div>

      <InputField
        as="textarea"
        name="note"
        label="Catatan khusus objek ini (Opsional)"
        value={item.note}
        onChange={(event) => onChange(event, index)}
      />
    </div>
  );
};

export default CreateTask;
