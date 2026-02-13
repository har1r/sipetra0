import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaHashtag,
  FaRegUser,
  FaMapMarkerAlt,
  FaHome,
  FaBuilding,
  FaFileSignature,
  FaRegStickyNote,
} from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";
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
  note: "", // Opsional
};

const CreateTask = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // States
  const [title, setTitle] = useState("");
  const [globalNote, setGlobalNote] = useState("");
  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
  });
  const [additionalData, setAdditionalData] = useState([
    { ...INITIAL_ADDITIONAL },
  ]);

  // Handlers
  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
    // Hapus error saat user mulai mengetik
    if (errors[`main_${name}`]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[`main_${name}`];
        return newErrs;
      });
    }
  };

  const handleAdditionalChange = (e, index) => {
    const { name, value } = e.target;
    setAdditionalData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
    // Hapus error spesifik pecahan saat diketik
    const errKey = `extra_${name}_${index}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[errKey];
        return newErrs;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Validasi Jenis Permohonan
    if (!title) newErrors.title = true;

    // 2. Validasi Data Utama (Semua Wajib)
    Object.keys(mainData).forEach((key) => {
      if (!mainData[key] || mainData[key].trim() === "") {
        newErrors[`main_${key}`] = true;
      }
    });

    // 3. Validasi Data Pecahan (Semua kecuali 'note' Wajib)
    additionalData.forEach((item, idx) => {
      if (!item.newName) newErrors[`extra_newName_${idx}`] = true;
      if (!item.certificate) newErrors[`extra_certificate_${idx}`] = true;
      if (!item.landWide) newErrors[`extra_landWide_${idx}`] = true;
      if (!item.buildingWide) newErrors[`extra_buildingWide_${idx}`] = true;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua bidang yang wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        globalNote,
        mainData: {
          ...mainData,
          nopel: toUpper(mainData.nopel),
          oldName: toTitle(mainData.oldName),
          address: toTitle(mainData.address),
        },
        additionalData: additionalData.map((item) => ({
          ...item,
          landWide: toNumber(item.landWide),
          buildingWide: toNumber(item.buildingWide),
          newName: toTitle(item.newName),
        })),
      };

      await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);
      toast.success("Berkas berhasil disimpan!");
      navigate("/manage-task/task");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan berkas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <header className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <FaClipboardList className="text-emerald-600" /> Buat Permohonan
              </h2>
              <div className="h-1 w-12 bg-emerald-500 rounded-full mt-2" />
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Jenis Permohonan */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Jenis Permohonan *
                </label>
                <SelectField
                  value={title}
                  error={errors.title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title)
                      setErrors((prev) => ({ ...prev, title: false }));
                  }}
                  options={TITLE_OPTIONS}
                  label="Jenis Permohonan"
                />
              </div>

              {/* Data Utama */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                  Data Utama
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    icon={FaHashtag}
                    name="nopel"
                    label="NOPEL"
                    value={mainData.nopel}
                    onChange={handleMainChange}
                    error={errors.main_nopel}
                  />
                  <InputField
                    icon={FaFileSignature}
                    name="nop"
                    label="NOP"
                    value={mainData.nop}
                    onChange={handleMainChange}
                    error={errors.main_nop}
                  />
                  <InputField
                    icon={FaRegUser}
                    name="oldName"
                    label="Nama Lama"
                    value={mainData.oldName}
                    onChange={handleMainChange}
                    error={errors.main_oldName}
                  />
                  <InputField
                    icon={FaMapMarkerAlt}
                    name="address"
                    label="Alamat"
                    value={mainData.address}
                    onChange={handleMainChange}
                    error={errors.main_address}
                  />
                  <InputField
                    icon={FaHome}
                    name="village"
                    label="Desa/Kelurahan"
                    value={mainData.village}
                    onChange={handleMainChange}
                    error={errors.main_village}
                  />
                  <SelectField
                    name="subdistrict"
                    label="Kecamatan"
                    value={mainData.subdistrict}
                    options={SUBDISTRICT_OPTIONS}
                    onChange={handleMainChange}
                    error={errors.main_subdistrict}
                  />
                </div>
              </div>

              {/* Data Pecahan */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                  Data Pecahan
                </h3>
                {additionalData.map((item, idx) => (
                  <AdditionalRow
                    key={idx}
                    index={idx}
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
                <button
                  type="button"
                  onClick={() =>
                    setAdditionalData((p) => [...p, { ...INITIAL_ADDITIONAL }])
                  }
                  className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-colors"
                >
                  + Tambah Baris Pecahan
                </button>
              </div>

              {/* Catatan Global */}
              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                  <FaRegStickyNote className="text-emerald-500" /> Catatan
                  Keseluruhan (Opsional)
                </h3>
                <InputField
                  as="textarea"
                  icon={FaRegStickyNote}
                  name="globalNote"
                  label="Tuliskan catatan panjang di sini jika ada..."
                  value={globalNote}
                  onChange={(e) => setGlobalNote(e.target.value)}
                />
              </div>

              <div className="pt-6 border-t flex justify-end">
                <button
                  disabled={isSubmitting}
                  className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isSubmitting ? "Sedang Menyimpan..." : "Simpan Berkas"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-slate-800 text-white p-6 rounded-3xl sticky top-24 shadow-xl">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
              💡 Petunjuk
            </h4>
            <ul className="text-sm space-y-4 opacity-90 leading-relaxed">
              <li>• Field bertanda merah wajib diisi.</li>
              <li>
                • Hanya bagian <b>Catatan</b> yang boleh dikosongkan.
              </li>
              <li>• Gunakan angka untuk input luas.</li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
};

// --- Sub-Components ---

const InputField = ({ icon: Icon, label, error, as = "input", ...props }) => (
  <div className="relative group w-full">
    <Icon
      className={`absolute left-3 ${as === "textarea" ? "top-4" : "top-3"} ${error ? "text-red-500" : "text-slate-400 group-focus-within:text-emerald-500"} transition-colors`}
    />
    {as === "textarea" ? (
      <textarea
        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm min-h-[120px] resize-y
          ${error ? "border-red-500 ring-1 ring-red-100 bg-red-50" : "border-slate-200 focus:ring-2 focus:ring-emerald-500"}`}
        placeholder={error ? `${label} (Wajib diisi)` : label}
        {...props}
      />
    ) : (
      <input
        className={`w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl outline-none transition-all text-sm
          ${error ? "border-red-500 ring-1 ring-red-100 bg-red-50" : "border-slate-200 focus:ring-2 focus:ring-emerald-500"}`}
        placeholder={error ? `${label} (Wajib diisi)` : label}
        {...props}
      />
    )}
  </div>
);

const SelectField = ({ label, options, error, ...props }) => (
  <select
    className={`w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none text-sm cursor-pointer transition-all
      ${error ? "border-red-500 ring-1 ring-red-100 bg-red-50" : "border-slate-200 focus:ring-2 focus:ring-emerald-500"}`}
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
}) => (
  <div
    className={`p-6 rounded-2xl border transition-all space-y-4 shadow-sm 
    ${Object.keys(errors).some((k) => k.endsWith(`_${index}`)) ? "bg-red-50/30 border-red-200" : "bg-emerald-50/40 border-emerald-100"}`}
  >
    <div className="flex justify-between items-center">
      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
        Pecahan #{index + 1}
      </span>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50 border border-red-100"
        >
          <HiOutlineX size={16} />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
        label="Sertifikat"
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
        icon={FaBuilding}
        name="buildingWide"
        label="Luas Bangunan"
        type="number"
        value={item.buildingWide}
        onChange={(e) => onChange(e, index)}
        error={errors[`extra_buildingWide_${index}`]}
      />
    </div>

    <div className="w-full">
      <InputField
        as="textarea"
        icon={FaRegStickyNote}
        name="note"
        label="Catatan khusus pecahan (Opsional)"
        value={item.note}
        onChange={(e) => onChange(e, index)}
        style={{ minHeight: "80px" }}
      />
    </div>
  </div>
);

export default CreateTask;

// import React, { useState, useCallback, useContext, useId } from "react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import {
//   FaHashtag,
//   FaRegUser,
//   FaMapMarkerAlt,
//   FaHome,
//   FaBuilding,
//   FaFileSignature,
// } from "react-icons/fa";
// import { FaClipboardList } from "react-icons/fa6";

// import DashboardLayout from "../../components/layouts/DashboardLayout";
// import UserContext from "../../context/UserContexts";
// import axiosInstance from "../../utils/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import { TITLE_OPTIONS, SUBDISTRICT_OPTIONS } from "../../utils/data";
// import { toTitle, toUpper, toNumber } from "../../utils/string";

// const CreateTask = () => {
//   const { user } = useContext(UserContext);
//   const navigate = useNavigate();

//   const idForTitleSelect = useId();

//   const [title, setTitle] = useState("");
//   const [mainData, setMainData] = useState({
//     nopel: "",
//     nop: "",
//     oldName: "",
//     address: "",
//     village: "",
//     subdistrict: "",
//   });
//   const [additionalData, setAdditionalData] = useState([
//     { newName: "", landWide: "", buildingWide: "", certificate: "" },
//   ]);
//   const [globalNote, setGlobalNote] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleMainChange = useCallback((event) => {
//     const { name, value } = event.target;
//     setMainData((prev) => ({ ...prev, [name]: value }));
//   }, []);

//   const handleAdditionalChange = useCallback((event, index) => {
//     const { name, value } = event.target;
//     setAdditionalData((prev) => {
//       const updated = [...prev];
//       updated[index] = { ...updated[index], [name]: value };
//       return updated;
//     });
//   }, []);

//   const handleAddRow = () => {
//     setAdditionalData((prev) => [
//       ...prev,
//       { newName: "", landWide: "", buildingWide: "", certificate: "" },
//     ]);
//   };

//   const handleRemoveRow = (indexToRemove) => {
//     setAdditionalData((prev) =>
//       prev.filter((_, index) => index !== indexToRemove)
//     );
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!title) return toast.error("Pilih jenis permohonan terlebih dahulu.");

//     const incomplete = Object.entries(mainData).find(([_, value]) => !value);
//     if (incomplete)
//       return toast.error("Semua data utama wajib diisi dengan lengkap.");

//     for (const [index, item] of additionalData.entries()) {
//       if (
//         !item.newName ||
//         !item.landWide ||
//         !item.buildingWide ||
//         !item.certificate
//       ) {
//         return toast.error(
//           `Lengkapi semua bagian pada data tambahan pecahan ke-${index + 1}.`
//         );
//       }
//     }

//     const formatted = {
//       title,
//       mainData: {
//         nopel: toUpper(mainData.nopel),
//         nop: mainData.nop,
//         oldName: toTitle(mainData.oldName),
//         address: toTitle(mainData.address),
//         village: toTitle(mainData.village),
//         subdistrict: mainData.subdistrict,
//       },
//       additionalData: additionalData.map((item) => ({
//         newName: toTitle(item.newName),
//         landWide: toNumber(item.landWide),
//         buildingWide: toNumber(item.buildingWide),
//         certificate: toUpper(item.certificate),
//       })),
//       globalNote,
//     };

//     setIsSubmitting(true);
//     try {
//       const response = await axiosInstance.post(
//         API_PATHS.TASK.CREATE_TASK,
//         formatted
//       );
//       if (response?.data) {
//         toast.success("Berkas berhasil dibuat.");
//       }
//       navigate("/manage-task/task");
//     } catch (error) {
//       console.error("❌ createTask Error:", error.message);
//       const backendMsg = error?.response?.data?.message;
//       toast.error(backendMsg || "Gagal membuat berkas permohonan.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <DashboardLayout activeMenu="Create Task">
//       <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
//         {/* === FORM KIRI === */}
//         <div className="lg:col-span-3 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg p-8 lg:p-10 border border-emerald-200/50">
//           <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-800 mb-8 flex flex-col gap-2">
//             <span className="flex items-center gap-3">
//               <FaClipboardList className="text-emerald-600 w-7 h-7" />
//               Buat Permohonan Baru
//             </span>
//             <span className="block w-24 h-1 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full"></span>
//           </h2>

//           <form onSubmit={handleSubmit} noValidate className="space-y-8">
//             {/* Jenis Permohonan */}
//             <div>
//               <select
//                 id={idForTitleSelect}
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 className="w-full rounded-lg border border-emerald-300 py-2 pl-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
//                 required
//               >
//                 <option value="">Jenis Permohonan</option>
//                 {TITLE_OPTIONS.map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Data Utama */}
//             <SectionTitle text="Data Utama" />
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <InputField
//                 label="NOPEL"
//                 name="nopel"
//                 value={mainData.nopel}
//                 onChange={handleMainChange}
//                 required
//                 Icon={FaHashtag}
//               />
//               <InputField
//                 label="NOP"
//                 name="nop"
//                 value={mainData.nop}
//                 onChange={handleMainChange}
//                 required
//                 Icon={FaFileSignature}
//               />
//               <InputField
//                 label="Nama Lama"
//                 name="oldName"
//                 value={mainData.oldName}
//                 onChange={handleMainChange}
//                 required
//                 Icon={FaRegUser}
//               />
//               <InputField
//                 label="Alamat"
//                 name="address"
//                 value={mainData.address}
//                 onChange={handleMainChange}
//                 required
//                 Icon={FaMapMarkerAlt}
//               />
//               <InputField
//                 label="Kelurahan / Desa"
//                 name="village"
//                 value={mainData.village}
//                 onChange={handleMainChange}
//                 required
//                 Icon={FaHome}
//               />
//               <div>
//                 <select
//                   name="subdistrict"
//                   value={mainData.subdistrict}
//                   onChange={handleMainChange}
//                   className="w-full rounded-lg border border-emerald-300 py-2 pl-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
//                   required
//                 >
//                   <option value="">Pilih Kecamatan</option>
//                   {SUBDISTRICT_OPTIONS.map((opt) => (
//                     <option key={opt.value} value={opt.value}>
//                       {opt.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Data Tambahan */}
//             <SectionTitle text="Data Tambahan" />
//             <div className="space-y-5">
//               {additionalData.map((item, index) => (
//                 <div
//                   key={index}
//                   className="p-5 border border-emerald-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 relative"
//                 >
//                   <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
//                     <FaBuilding className="text-emerald-600" />
//                     Pecahan ke {index + 1}
//                   </h4>

//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <InputField
//                       label="Nama Baru"
//                       name="newName"
//                       value={item.newName}
//                       onChange={(e) => handleAdditionalChange(e, index)}
//                       required
//                       Icon={FaRegUser}
//                     />
//                     <InputField
//                       label="Luas Tanah (m²)"
//                       name="landWide"
//                       type="number"
//                       value={item.landWide}
//                       onChange={(e) => handleAdditionalChange(e, index)}
//                       required
//                       Icon={FaMapMarkerAlt}
//                     />
//                     <InputField
//                       label="Luas Bangunan (m²)"
//                       name="buildingWide"
//                       type="number"
//                       value={item.buildingWide}
//                       onChange={(e) => handleAdditionalChange(e, index)}
//                       required
//                       Icon={FaBuilding}
//                     />
//                     <InputField
//                       label="Nomor Sertifikat"
//                       name="certificate"
//                       value={item.certificate}
//                       onChange={(e) => handleAdditionalChange(e, index)}
//                       required
//                       Icon={FaFileSignature}
//                     />
//                   </div>

//                   {additionalData.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => handleRemoveRow(index)}
//                       className="absolute top-3 right-4 text-emerald-600 hover:text-red-500 text-sm transition"
//                     >
//                       Hapus
//                     </button>
//                   )}
//                 </div>
//               ))}

//               <button
//                 type="button"
//                 onClick={handleAddRow}
//                 className="text-sm text-emerald-600 hover:underline font-medium"
//               >
//                 + Tambah Subjek Pajak
//               </button>
//             </div>

//             {/* Catatan */}
//             <SectionTitle text="Catatan (Opsional)" />
//             <textarea
//               value={globalNote}
//               onChange={(e) => setGlobalNote(e.target.value)}
//               placeholder="Tambahkan catatan umum di sini..."
//               className="min-h-[100px] w-full rounded-lg border border-emerald-300 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
//             />

//             {/* Tombol Submit */}
//             <div className="text-right pt-4">
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="bg-gradient-to-r from-lime-400 to-emerald-500 text-white px-8 py-3 rounded-lg shadow-md hover:from-lime-500 hover:to-emerald-600 disabled:opacity-60 transition text-base font-semibold"
//               >
//                 {isSubmitting ? "Menyimpan..." : "Buat Permohonan"}
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* === PANEL KANAN === */}
//         <div className="bg-gradient-to-br from-emerald-100 to-lime-50 rounded-3xl shadow-lg p-6 lg:p-8 text-emerald-900 border border-emerald-200/50 backdrop-blur-md">
//           <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
//             🌿 Cara Membuat Task
//           </h3>
//           <ul className="space-y-3 text-sm leading-relaxed list-disc list-inside">
//             <li>Pilih jenis permohonan yang sesuai.</li>
//             <li>Isi semua data utama dengan lengkap dan benar.</li>
//             <li>Tambahkan data tambahan untuk setiap subjek pajak.</li>
//             <li>Gunakan huruf kapital pada NOP dan NOPEL untuk kejelasan.</li>
//             <li>
//               Klik <strong>Buat Permohonan</strong> setelah semua data diisi.
//             </li>
//             <li>Sistem akan mengarahkan ke halaman daftar berkas Anda.</li>
//           </ul>

//           <div className="mt-6 p-4 bg-white/80 rounded-lg shadow-sm border border-emerald-200 text-sm">
//             <p className="font-medium text-emerald-700 mb-1">Tips:</p>
//             <p>
//               Jika jenis task adalah <strong>pengaktifan</strong>, maka sistem
//               akan otomatis mengeset tahap awal hingga <em>“Dikirim”</em>.
//             </p>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// };

// // === Komponen Kecil ===
// const InputField = ({
//   label,
//   name,
//   value,
//   onChange,
//   required,
//   type = "text",
//   Icon,
// }) => {
//   const excluded = ["title", "subdistrict", "globalNote"];
//   const showIcon = Icon && !excluded.includes(name);

//   return (
//     <div className="w-full">
//       <div className="relative flex items-center">
//         {showIcon && (
//           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
//             <Icon className="w-5 h-5" />
//           </span>
//         )}
//         <input
//           type={type}
//           name={name}
//           value={value}
//           onChange={onChange}
//           placeholder={label}
//           required={required}
//           className={`w-full rounded-lg border border-emerald-300 ${
//             showIcon ? "pl-12" : "pl-3"
//           } py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition`}
//         />
//       </div>
//     </div>
//   );
// };

// const SectionTitle = ({ text }) => (
//   <h3 className="text-lg font-semibold text-emerald-800 border-b border-emerald-200 pb-1 mb-2">
//     {text}
//   </h3>
// );

// export default CreateTask;
