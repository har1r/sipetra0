import React, { useState, useCallback, useContext, useId } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import UserContext from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { TITLE_OPTIONS, SUBDISTRICT_OPTIONS } from "../../utils/data";
import { toTitle, toUpper } from "../../utils/string";

const CreateTask = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // ID unik untuk aksesibilitas
  const idTitle = useId();
  const idNopel = useId();
  const idNop = useId();
  const idOldName = useId();
  const idAddress = useId();
  const idVillage = useId();
  const idSubdistrict = useId();

  // State utama
  const [title, setTitle] = useState("");
  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
  });
  const [additionalData, setAdditionalData] = useState([
    { newName: "", landWide: "", buildingWide: "", certificate: "" },
  ]);
  const [globalNote, setGlobalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Utilitas
  const toNumber = (val) => (Number.isFinite(+val) ? +val : 0);

  // Handler
  const handleMainChange = useCallback((e) => {
    const { name, value } = e.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAdditionalChange = useCallback((e, index) => {
    const { name, value } = e.target;
    setAdditionalData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  }, []);

  const handleAddRow = () => {
    setAdditionalData((prev) => [
      ...prev,
      { newName: "", landWide: "", buildingWide: "", certificate: "" },
    ]);
  };

  const handleRemoveRow = (index) => {
    setAdditionalData((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) return toast.error("Pilih jenis permohonan terlebih dahulu.");

    const missingMain = Object.entries(mainData).find(([_, v]) => !v);
    if (missingMain)
      return toast.error("Semua data utama wajib diisi dengan lengkap.");

    for (const [index, item] of additionalData.entries()) {
      if (
        !item.newName ||
        !item.landWide ||
        !item.buildingWide ||
        !item.certificate
      ) {
        return toast.error(
          `Lengkapi semua field pada data tambahan ke-${index + 1}.`
        );
      }
    }

    const payload = {
      title,
      mainData: {
        nopel: toUpper(mainData.nopel),
        nop: mainData.nop,
        oldName: toTitle(mainData.oldName),
        address: toTitle(mainData.address),
        village: toTitle(mainData.village),
        subdistrict: mainData.subdistrict,
      },
      additionalData: additionalData.map((item) => ({
        newName: toTitle(item.newName),
        landWide: toNumber(item.landWide),
        buildingWide: toNumber(item.buildingWide),
        certificate: toUpper(item.certificate),
      })),
      globalNote,
    };

    try {
      setIsSubmitting(true);
      await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);
      toast.success("✅ Berkas berhasil dibuat.");
      navigate(user?.role === "admin" ? "/admin/tasks" : "/user/tasks");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Terjadi kesalahan saat membuat berkas.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render
  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mx-auto w-full max-w-6xl bg-white rounded-2xl shadow-lg p-8 lg:p-10">
        <h2 className="text-3xl font-semibold text-slate-800 mb-8">
          📝 Buat Permohonan Baru
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ---------- Jenis Permohonan ---------- */}
          <div>
            <label
              htmlFor={idTitle}
              className="block text-base font-medium text-slate-700 mb-2"
            >
              Jenis Permohonan <span className="text-red-500">*</span>
            </label>
            <select
              id={idTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input w-full text-base"
              required
            >
              <option value="">Pilih Jenis Permohonan</option>
              {TITLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---------- Data Utama ---------- */}
          <SectionTitle text="Data Utama" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField
              label="NOPEL"
              name="nopel"
              value={mainData.nopel}
              onChange={handleMainChange}
              required
            />
            <InputField
              label="NOP"
              name="nop"
              value={mainData.nop}
              onChange={handleMainChange}
              required
            />
            <InputField
              label="Nama Lama"
              name="oldName"
              value={mainData.oldName}
              onChange={handleMainChange}
              required
            />
            <InputField
              label="Alamat"
              name="address"
              value={mainData.address}
              onChange={handleMainChange}
              required
            />
            <InputField
              label="Kelurahan / Desa"
              name="village"
              value={mainData.village}
              onChange={handleMainChange}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <select
                name="subdistrict"
                value={mainData.subdistrict}
                onChange={handleMainChange}
                className="form-input w-full"
                required
              >
                <option value="">Pilih Kecamatan</option>
                {SUBDISTRICT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ---------- Data Tambahan ---------- */}
          <SectionTitle text="Data Tambahan" />
          <div className="space-y-5">
            {additionalData.map((item, index) => (
              <div
                key={index}
                className="p-5 border rounded-xl bg-slate-50 relative"
              >
                <h4 className="font-medium text-slate-700 mb-3">
                  Subjek Pajak #{index + 1}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InputField
                    label="Nama Baru"
                    name="newName"
                    value={item.newName}
                    onChange={(e) => handleAdditionalChange(e, index)}
                    required
                  />
                  <InputField
                    label="Luas Tanah (m²)"
                    name="landWide"
                    type="number"
                    value={item.landWide}
                    onChange={(e) => handleAdditionalChange(e, index)}
                    required
                  />
                  <InputField
                    label="Luas Bangunan (m²)"
                    name="buildingWide"
                    type="number"
                    value={item.buildingWide}
                    onChange={(e) => handleAdditionalChange(e, index)}
                    required
                  />
                  <InputField
                    label="Nomor Sertifikat"
                    name="certificate"
                    value={item.certificate}
                    onChange={(e) => handleAdditionalChange(e, index)}
                    required
                  />
                </div>

                {additionalData.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="absolute top-3 right-4 text-red-500 hover:underline text-sm"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRow}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              + Tambah Subjek Pajak
            </button>
          </div>

          {/* ---------- Catatan Global ---------- */}
          <SectionTitle text="Catatan (Opsional)" />
          <textarea
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value)}
            placeholder="Tambahkan catatan umum di sini..."
            className="form-input w-full min-h-[100px]"
          />

          {/* ---------- Tombol Submit ---------- */}
          <div className="text-right pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-60 transition text-base"
            >
              {isSubmitting ? "Menyimpan..." : "Buat Permohonan"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

// Input sederhana
const InputField = ({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      className="form-input w-full"
      required={required}
    />
  </div>
);

// Judul section
const SectionTitle = ({ text }) => (
  <h3 className="text-lg font-semibold text-slate-800 border-b pb-1 mb-2">
    {text}
  </h3>
);

export default CreateTask;

// import React, { useState, useCallback, useId, useContext } from "react";
// import { useNavigate } from "react-router-dom";

// import DashboardLayout from "../../components/layouts/DashboardLayout";
// import AdditionalPersonInput from "../../components/inputs/AdditionalPersonInput";
// import UserContext from "../../context/UserContexts";
// import { API_PATHS } from "../../utils/apiPaths";
// import axiosInstance from "../../utils/axiosInstance";
// import { SUBDISTRICT_OPTIONS, TITLE_OPTIONS } from "../../utils/data";
// import { toTitle, toUpper } from "../../utils/string";

// const CreateTask = () => {
//   const { user } = useContext(UserContext);
//   const navigate = useNavigate();

//   // ID unik (aksesibilitas form)
//   const idNopel = useId();
//   const idOldName = useId();
//   const idNop = useId();
//   const idAddress = useId();
//   const idVillage = useId();
//   const idSubdistrict = useId();
//   const idTitle = useId();

//   // 🔹 State utama
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

//   const [isSaving, setIsSaving] = useState(false);

//   /* ======================================================
//      🧩 Utility Functions
//   ====================================================== */
//   const toNumber = (value) => {
//     const num = Number(value);
//     return Number.isFinite(num) ? num : 0;
//   };

//   /* ======================================================
//      ✏️ Handlers
//   ====================================================== */
//   const handleMainChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setMainData((prev) => ({ ...prev, [name]: value }));
//   }, []);

//   const handleAdditionalChange = useCallback((e, index) => {
//     const { name, value } = e.target;
//     setAdditionalData((prev) => {
//       const updated = [...prev];
//       updated[index] = { ...updated[index], [name]: value };
//       return updated;
//     });
//   }, []);

//   const handleAddAdditional = useCallback(() => {
//     setAdditionalData((prev) => [
//       ...prev,
//       { newName: "", landWide: "", buildingWide: "", certificate: "" },
//     ]);
//   }, []);

//   const handleRemoveAdditional = useCallback((index) => {
//     setAdditionalData((prev) => prev.filter((_, i) => i !== index));
//   }, []);

//   /* ======================================================
//      🚀 Submit Handler
//   ====================================================== */
//   const handleSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();

//       // ✅ Validasi dasar sebelum kirim ke backend
//       if (!title) {
//         toast.error("Jenis permohonan wajib dipilih.");
//         return;
//       }

//       const requiredMainFields = [
//         "nopel",
//         "nop",
//         "oldName",
//         "address",
//         "village",
//         "subdistrict",
//       ];

//       for (const field of requiredMainFields) {
//         if (!mainData[field]) {
//           toast.error(
//             "Bagian NOPEL, NOP, nama lama, alamat, desa/kelurahan, dan kecamatan wajib diisi."
//           );
//           return;
//         }
//       }

//       if (!Array.isArray(additionalData) || additionalData.length === 0) {
//         toast.error("Data tambahan tidak boleh kosong.");
//         return;
//       }

//       for (const [index, item] of additionalData.entries()) {
//         if (
//           !item.newName ||
//           !item.landWide ||
//           !item.buildingWide ||
//           !item.certificate
//         ) {
//           toast.error(
//             `Lengkapi semua field pada data tambahan ke-${index + 1}.`
//           );
//           return;
//         }
//       }

//       // Siapkan payload sesuai backend
//       const payload = {
//         title,
//         mainData: {
//           nopel: toUpper(mainData.nopel),
//           nop: mainData.nop,
//           oldName: toTitle(mainData.oldName),
//           address: toTitle(mainData.address),
//           village: toTitle(mainData.village),
//           subdistrict: mainData.subdistrict,
//         },
//         additionalData: additionalData.map((item) => ({
//           newName: toTitle(item.newName),
//           landWide: toNumber(item.landWide),
//           buildingWide: toNumber(item.buildingWide),
//           certificate: toUpper(item.certificate),
//         })),
//       };

//       try {
//         setIsSaving(true);
//         await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);

//         toast.success("Berkas berhasil dibuat.");
//         navigate(user?.role === "admin" ? "/admin/tasks" : "/user/tasks");
//       } catch (error) {
//         const errMsg =
//           error?.response?.data?.message ||
//           "Terjadi kesalahan saat membuat berkas.";
//         toast.error(errMsg);
//       } finally {
//         setIsSaving(false);
//       }
//     },
//     [title, mainData, additionalData, user, navigate]
//   );

//   /* ======================================================
//      🧱 Render
//   ====================================================== */
//   return (
//     <DashboardLayout activeMenu="Create Task">
//       <h2 className="text-xl font-semibold mb-4">Buat Permohonan</h2>

//       <form
//         onSubmit={handleSubmit}
//         className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4"
//       >
//         {/* ---------- Data Utama ---------- */}
//         <div className="md:col-span-2">
//           <h3 className="text-slate-700 font-semibold mb-2">Data Utama</h3>
//         </div>

//         {/* NOPEL */}
//         <FormInput
//           id={idNopel}
//           label="NOPEL"
//           name="nopel"
//           value={mainData.nopel}
//           onChange={handleMainChange}
//           required
//         />

//         {/* Nama Lama */}
//         <FormInput
//           id={idOldName}
//           label="Nama Lama"
//           name="oldName"
//           value={mainData.oldName}
//           onChange={handleMainChange}
//           required
//         />

//         {/* NOP */}
//         <FormInput
//           id={idNop}
//           label="NOP"
//           name="nop"
//           value={mainData.nop}
//           onChange={handleMainChange}
//           required
//         />

//         {/* Alamat */}
//         <FormInput
//           id={idAddress}
//           label="Alamat"
//           name="address"
//           value={mainData.address}
//           onChange={handleMainChange}
//           required
//         />

//         {/* Desa */}
//         <FormInput
//           id={idVillage}
//           label="Kelurahan/Desa"
//           name="village"
//           value={mainData.village}
//           onChange={handleMainChange}
//           required
//         />

//         {/* Kecamatan */}
//         <div>
//           <label htmlFor={idSubdistrict} className="form-label">
//             Kecamatan <span className="text-red-500">*</span>
//           </label>
//           <select
//             id={idSubdistrict}
//             name="subdistrict"
//             value={mainData.subdistrict}
//             onChange={handleMainChange}
//             className="form-input w-full"
//             required
//           >
//             <option value="">Pilih Kecamatan</option>
//             {SUBDISTRICT_OPTIONS.map((opt) => (
//               <option key={opt.value} value={opt.value}>
//                 {opt.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Jenis Permohonan */}
//         <div className="md:col-span-2">
//           <label htmlFor={idTitle} className="form-label">
//             Jenis Permohonan <span className="text-red-500">*</span>
//           </label>
//           <select
//             id={idTitle}
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             className="form-input w-full"
//             required
//           >
//             <option value="">Pilih Jenis Permohonan</option>
//             {TITLE_OPTIONS.map((opt) => (
//               <option key={opt.value} value={opt.value}>
//                 {opt.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* ---------- Data Tambahan ---------- */}
//         <div className="md:col-span-2 border-t pt-4 mt-4">
//           <h3 className="text-slate-700 font-semibold mb-2">Data Tambahan</h3>
//           {additionalData.map((item, index) => (
//             <AdditionalPersonInput
//               key={index}
//               item={item}
//               index={index}
//               handleChange={handleAdditionalChange}
//               onRemove={handleRemoveAdditional}
//               showRemove={additionalData.length > 1}
//             />
//           ))}

//           <button
//             type="button"
//             onClick={handleAddAdditional}
//             className="text-blue-600 text-sm hover:underline"
//           >
//             + Tambah Subjek Pajak Baru
//           </button>
//         </div>

//         {/* ---------- Tombol Submit ---------- */}
//         <div className="md:col-span-2 mt-4">
//           <button
//             type="submit"
//             disabled={isSaving}
//             className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition disabled:opacity-60"
//           >
//             {isSaving ? "Menyimpan..." : "Buat Permohonan"}
//           </button>
//         </div>
//       </form>
//     </DashboardLayout>
//   );
// };

// /* ======================================================
//    🔧 Komponen Input Reusable
// ====================================================== */
// const FormInput = ({ id, label, name, value, onChange, required = false }) => (
//   <div>
//     <label htmlFor={id} className="form-label">
//       {label} {required && <span className="text-red-500">*</span>}
//     </label>
//     <input
//       id={id}
//       name={name}
//       type="text"
//       value={value}
//       onChange={onChange}
//       placeholder={label}
//       className="form-input w-full"
//       required={required}
//     />
//   </div>
// );

// export default CreateTask;
