import React, { useState, useCallback, useId, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import AdditionalPersonInput from "../../components/inputs/AdditionalPersonInput";
import { UserContext } from "../../context/UserContexts";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { SUBDISTRICT_OPTIONS, TITLE_OPTIONS } from "../../utils/data";
import { toTitle, toUpper } from "../../utils/string";

const CreateTask = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // ID unik (aksesibilitas form)
  const idNopel = useId();
  const idOldName = useId();
  const idNop = useId();
  const idAddress = useId();
  const idVillage = useId();
  const idSubdistrict = useId();
  const idTitle = useId();

  // 🔹 State utama
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

  const [isSaving, setIsSaving] = useState(false);

  /* ======================================================
     🧩 Utility Functions
  ====================================================== */
  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  /* ======================================================
     ✏️ Handlers
  ====================================================== */
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

  const handleAddAdditional = useCallback(() => {
    setAdditionalData((prev) => [
      ...prev,
      { newName: "", landWide: "", buildingWide: "", certificate: "" },
    ]);
  }, []);

  const handleRemoveAdditional = useCallback((index) => {
    setAdditionalData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ======================================================
     🚀 Submit Handler
  ====================================================== */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // ✅ Validasi dasar sebelum kirim ke backend
      if (!title) {
        toast.error("Jenis permohonan wajib dipilih.");
        return;
      }

      const requiredMainFields = [
        "nopel",
        "nop",
        "oldName",
        "address",
        "village",
        "subdistrict",
      ];

      for (const field of requiredMainFields) {
        if (!mainData[field]) {
          toast.error(
            "Bagian NOPEL, NOP, nama lama, alamat, desa/kelurahan, dan kecamatan wajib diisi."
          );
          return;
        }
      }

      if (!Array.isArray(additionalData) || additionalData.length === 0) {
        toast.error("Data tambahan tidak boleh kosong.");
        return;
      }

      for (const [index, item] of additionalData.entries()) {
        if (
          !item.newName ||
          !item.landWide ||
          !item.buildingWide ||
          !item.certificate
        ) {
          toast.error(
            `Lengkapi semua field pada data tambahan ke-${index + 1}.`
          );
          return;
        }
      }

      // Siapkan payload sesuai backend
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
      };

      try {
        setIsSaving(true);
        await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);

        toast.success("Berkas berhasil dibuat.");
        navigate(user?.role === "admin" ? "/admin/tasks" : "/user/tasks");
      } catch (error) {
        const errMsg =
          error?.response?.data?.message ||
          "Terjadi kesalahan saat membuat berkas.";
        toast.error(errMsg);
      } finally {
        setIsSaving(false);
      }
    },
    [title, mainData, additionalData, user, navigate]
  );

  /* ======================================================
     🧱 Render
  ====================================================== */
  return (
    <DashboardLayout activeMenu="Create Task">
      <h2 className="text-xl font-semibold mb-4">Buat Permohonan</h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4"
      >
        {/* ---------- Data Utama ---------- */}
        <div className="md:col-span-2">
          <h3 className="text-slate-700 font-semibold mb-2">Data Utama</h3>
        </div>

        {/* NOPEL */}
        <FormInput
          id={idNopel}
          label="NOPEL"
          name="nopel"
          value={mainData.nopel}
          onChange={handleMainChange}
          required
        />

        {/* Nama Lama */}
        <FormInput
          id={idOldName}
          label="Nama Lama"
          name="oldName"
          value={mainData.oldName}
          onChange={handleMainChange}
          required
        />

        {/* NOP */}
        <FormInput
          id={idNop}
          label="NOP"
          name="nop"
          value={mainData.nop}
          onChange={handleMainChange}
          required
        />

        {/* Alamat */}
        <FormInput
          id={idAddress}
          label="Alamat"
          name="address"
          value={mainData.address}
          onChange={handleMainChange}
          required
        />

        {/* Desa */}
        <FormInput
          id={idVillage}
          label="Kelurahan/Desa"
          name="village"
          value={mainData.village}
          onChange={handleMainChange}
          required
        />

        {/* Kecamatan */}
        <div>
          <label htmlFor={idSubdistrict} className="form-label">
            Kecamatan <span className="text-red-500">*</span>
          </label>
          <select
            id={idSubdistrict}
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

        {/* Jenis Permohonan */}
        <div className="md:col-span-2">
          <label htmlFor={idTitle} className="form-label">
            Jenis Permohonan <span className="text-red-500">*</span>
          </label>
          <select
            id={idTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input w-full"
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

        {/* ---------- Data Tambahan ---------- */}
        <div className="md:col-span-2 border-t pt-4 mt-4">
          <h3 className="text-slate-700 font-semibold mb-2">Data Tambahan</h3>
          {additionalData.map((item, index) => (
            <AdditionalPersonInput
              key={index}
              item={item}
              index={index}
              handleChange={handleAdditionalChange}
              onRemove={handleRemoveAdditional}
              showRemove={additionalData.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={handleAddAdditional}
            className="text-blue-600 text-sm hover:underline"
          >
            + Tambah Subjek Pajak Baru
          </button>
        </div>

        {/* ---------- Tombol Submit ---------- */}
        <div className="md:col-span-2 mt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition disabled:opacity-60"
          >
            {isSaving ? "Menyimpan..." : "Buat Permohonan"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

/* ======================================================
   🔧 Komponen Input Reusable
====================================================== */
const FormInput = ({ id, label, name, value, onChange, required = false }) => (
  <div>
    <label htmlFor={id} className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={label}
      className="form-input w-full"
      required={required}
    />
  </div>
);

export default CreateTask;

// import React, { useState, useCallback, useId, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// import DashboardLayout from "../../components/layouts/DashboardLayout";
// import AdditionalPersonInput from "../../components/inputs/AdditionalPersonInput";
// import { UserContext } from "../../context/UserContexts";
// import { API_PATHS } from "../../utils/apiPaths";
// import axiosInstance from "../../utils/axiosInstance";
// import { SUBDISTRICT_OPTIONS, TITLE_OPTIONS } from "../../utils/data";
// import { toTitle, toUpper } from "../../utils/string";

// const CreateTask = () => {
//   const { user } = useContext(UserContext);
//   const navigate = useNavigate();

//   // ID unik untuk label–input (aksesibilitas)
//   const idNopel = useId();
//   const idOldName = useId();
//   const idNop = useId();
//   const idAddress = useId();
//   const idVillage = useId();
//   const idSubdistrict = useId();
//   const idTitle = useId();

//   // State utama
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

//   const [title, setTitle] = useState("");
//   const [isSaving, setIsSaving] = useState(false);

//   /** ------------------------------
//    * Utility Functions
//    * ------------------------------ */
//   const toNumber = (value) => {
//     if (!value) return 0;
//     const numberValue = Number(value);
//     return Number.isFinite(numberValue) ? numberValue : 0;
//   };

//   /** ------------------------------
//    * Change Handlers
//    * ------------------------------ */
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

//   const handleAddAdditionalPerson = useCallback(() => {
//     setAdditionalData((prev) => [
//       ...prev,
//       { newName: "", landWide: "", buildingWide: "", certificate: "" },
//     ]);
//   }, []);

//   const handleRemoveAdditionalPerson = useCallback((index) => {
//     setAdditionalData((prev) => prev.filter((_, i) => i !== index));
//   }, []);

//   /** ------------------------------
//    * Submit Handler
//    * ------------------------------ */
//   const handleSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();

//       // Validasi dasar
//       if (!title) {
//         toast.error("Jenis permohonan wajib dipilih.");
//         return;
//       }

//       if (!mainData.nopel || !mainData.oldName || !mainData.nop) {
//         toast.error("Lengkapi data utama sebelum membuat permohonan.");
//         return;
//       }

//       if (!mainData.subdistrict) {
//         toast.error("Kecamatan wajib dipilih.");
//         return;
//       }

//       setIsSaving(true);

//       const payload = {
//         title,
//         mainData: {
//           nopel: toUpper(mainData.nopel),
//           oldName: toTitle(mainData.oldName),
//           address: toTitle(mainData.address),
//           village: toTitle(mainData.village),
//           subdistrict: mainData.subdistrict,
//           nop: mainData.nop,
//         },
//         additionalData: additionalData.map((item) => ({
//           newName: toTitle(item.newName),
//           landWide: toNumber(item.landWide),
//           buildingWide: toNumber(item.buildingWide),
//           certificate: toUpper(item.certificate) || "",
//         })),
//         currentStage: "diinput",
//       };

//       try {
//         await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);
//         toast.success("Permohonan berhasil dibuat.");
//         navigate(user?.role !== "admin" ? "/user/tasks" : "/admin/tasks");
//       } catch (error) {
//         const errMsg =
//           error?.response?.data?.message || "Gagal membuat permohonan.";
//         toast.error(errMsg);
//       } finally {
//         setIsSaving(false);
//       }
//     },
//     [title, mainData, additionalData, navigate, user]
//   );

//   /** ------------------------------
//    * Render
//    * ------------------------------ */
//   return (
//     <DashboardLayout activeMenu="Create Task">
//       <h2 className="text-xl font-semibold mb-4">Buat Permohonan</h2>

//       <form
//         onSubmit={handleSubmit}
//         className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4"
//       >
//         {/* Data Utama */}
//         <div className="md:col-span-2">
//           <h3 className="text-slate-700 font-semibold mb-2">Data Utama</h3>
//         </div>

//         {/* NOPEL */}
//         <div>
//           <label
//             htmlFor={idNopel}
//             className="block text-sm text-slate-600 mb-1"
//           >
//             NOPEL <span className="text-red-500">*</span>
//           </label>
//           <input
//             id={idNopel}
//             name="nopel"
//             type="text"
//             value={toUpper(mainData.nopel)}
//             onChange={handleMainChange}
//             placeholder="NOPEL"
//             className="form-input w-full uppercase"
//             required
//           />
//         </div>

//         {/* Nama Lama */}
//         <div>
//           <label
//             htmlFor={idOldName}
//             className="block text-sm text-slate-600 mb-1"
//           >
//             Nama Lama <span className="text-red-500">*</span>
//           </label>
//           <input
//             id={idOldName}
//             name="oldName"
//             type="text"
//             value={toTitle(mainData.oldName)}
//             onChange={handleMainChange}
//             placeholder="Nama Lama"
//             className="form-input w-full capitalize"
//             required
//           />
//         </div>

//         {/* NOP */}
//         <div>
//           <label htmlFor={idNop} className="block text-sm text-slate-600 mb-1">
//             NOP <span className="text-red-500">*</span>
//           </label>
//           <input
//             id={idNop}
//             name="nop"
//             type="text"
//             inputMode="numeric"
//             value={mainData.nop}
//             onChange={handleMainChange}
//             placeholder="NOP"
//             className="form-input w-full"
//             required
//           />
//         </div>

//         {/* Alamat */}
//         <div>
//           <label
//             htmlFor={idAddress}
//             className="block text-sm text-slate-600 mb-1"
//           >
//             Alamat <span className="text-red-500">*</span>
//           </label>
//           <input
//             id={idAddress}
//             name="address"
//             type="text"
//             value={toTitle(mainData.address)}
//             onChange={handleMainChange}
//             placeholder="Alamat"
//             className="form-input w-full capitalize"
//             required
//           />
//         </div>

//         {/* Kelurahan/Desa */}
//         <div>
//           <label
//             htmlFor={idVillage}
//             className="block text-sm text-slate-600 mb-1"
//           >
//             Kelurahan/Desa <span className="text-red-500">*</span>
//           </label>
//           <input
//             id={idVillage}
//             name="village"
//             type="text"
//             value={toTitle(mainData.village)}
//             onChange={handleMainChange}
//             placeholder="Kelurahan/Desa"
//             className="form-input w-full capitalize"
//             required
//           />
//         </div>

//         {/* Kecamatan */}
//         <div>
//           <label
//             htmlFor={idSubdistrict}
//             className="block text-sm text-slate-600 mb-1"
//           >
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
//             {SUBDISTRICT_OPTIONS.map((option) => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Jenis Permohonan */}
//         <div className="md:col-span-2">
//           <label
//             htmlFor={idTitle}
//             className="block text-sm text-slate-600 mb-1"
//           >
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
//             {TITLE_OPTIONS.map((option) => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Data Tambahan */}
//         <div className="md:col-span-2 border-t pt-4 mt-4">
//           <h3 className="text-slate-700 font-semibold mb-2">Data Tambahan</h3>
//           {additionalData.map((item, index) => (
//             <AdditionalPersonInput
//               key={index}
//               item={item}
//               index={index}
//               handleChange={handleAdditionalChange}
//               onRemove={handleRemoveAdditionalPerson}
//               showRemove={additionalData.length > 1}
//             />
//           ))}

//           <button
//             type="button"
//             onClick={handleAddAdditionalPerson}
//             className="text-blue-600 text-sm hover:underline"
//           >
//             + Tambah Subjek Pajak Baru
//           </button>
//         </div>

//         {/* Tombol Submit */}
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

// export default CreateTask;
