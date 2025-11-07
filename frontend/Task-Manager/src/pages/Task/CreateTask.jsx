import React, { useState, useCallback, useContext, useId } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaHashtag,
  FaRegUser,
  FaMapMarkerAlt,
  FaHome,
  FaBuilding,
  FaFileSignature,
} from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa6";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import UserContext from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { TITLE_OPTIONS, SUBDISTRICT_OPTIONS } from "../../utils/data";
import { toTitle, toUpper, toNumber } from "../../utils/string";

const CreateTask = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const idForTitleSelect = useId();

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

  const handleMainChange = useCallback((event) => {
    const { name, value } = event.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAdditionalChange = useCallback((event, index) => {
    const { name, value } = event.target;
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

  const handleRemoveRow = (indexToRemove) => {
    setAdditionalData((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title) return toast.error("Pilih jenis permohonan terlebih dahulu.");

    const incomplete = Object.entries(mainData).find(([_, value]) => !value);
    if (incomplete)
      return toast.error("Semua data utama wajib diisi dengan lengkap.");

    for (const [index, item] of additionalData.entries()) {
      if (
        !item.newName ||
        !item.landWide ||
        !item.buildingWide ||
        !item.certificate
      ) {
        return toast.error(
          `Lengkapi semua bagian pada data tambahan pecahan ke-${index + 1}.`
        );
      }
    }

    const formatted = {
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

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.TASK.CREATE_TASK,
        formatted
      );
      if (response?.data) {
        toast.success("Berkas berhasil dibuat.");
      }
      navigate(user?.role === "admin" ? "/admin/tasks" : "/user/tasks");
    } catch (error) {
      console.error("❌ createTask Error:", error.message);
      const backendMsg = error?.response?.data?.message;
      toast.error(backendMsg || "Gagal membuat berkas permohonan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* === FORM KIRI === */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-md rounded-3xl shadow-lg p-8 lg:p-10 border border-emerald-200/50">
          <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-800 mb-8 flex flex-col gap-2">
            <span className="flex items-center gap-3">
              <FaClipboardList className="text-emerald-600 w-7 h-7" />
              Buat Permohonan Baru
            </span>
            <span className="block w-24 h-1 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full"></span>
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Jenis Permohonan */}
            <div>
              <select
                id={idForTitleSelect}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-emerald-300 py-2 pl-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
                required
              >
                <option value="">Jenis Permohonan</option>
                {TITLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Utama */}
            <SectionTitle text="Data Utama" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField
                label="NOPEL"
                name="nopel"
                value={mainData.nopel}
                onChange={handleMainChange}
                required
                Icon={FaHashtag}
              />
              <InputField
                label="NOP"
                name="nop"
                value={mainData.nop}
                onChange={handleMainChange}
                required
                Icon={FaFileSignature}
              />
              <InputField
                label="Nama Lama"
                name="oldName"
                value={mainData.oldName}
                onChange={handleMainChange}
                required
                Icon={FaRegUser}
              />
              <InputField
                label="Alamat"
                name="address"
                value={mainData.address}
                onChange={handleMainChange}
                required
                Icon={FaMapMarkerAlt}
              />
              <InputField
                label="Kelurahan / Desa"
                name="village"
                value={mainData.village}
                onChange={handleMainChange}
                required
                Icon={FaHome}
              />
              <div>
                <select
                  name="subdistrict"
                  value={mainData.subdistrict}
                  onChange={handleMainChange}
                  className="w-full rounded-lg border border-emerald-300 py-2 pl-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
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

            {/* Data Tambahan */}
            <SectionTitle text="Data Tambahan" />
            <div className="space-y-5">
              {additionalData.map((item, index) => (
                <div
                  key={index}
                  className="p-5 border border-emerald-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 relative"
                >
                  <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                    <FaBuilding className="text-emerald-600" />
                    Pecahan ke {index + 1}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField
                      label="Nama Baru"
                      name="newName"
                      value={item.newName}
                      onChange={(e) => handleAdditionalChange(e, index)}
                      required
                      Icon={FaRegUser}
                    />
                    <InputField
                      label="Luas Tanah (m²)"
                      name="landWide"
                      type="number"
                      value={item.landWide}
                      onChange={(e) => handleAdditionalChange(e, index)}
                      required
                      Icon={FaMapMarkerAlt}
                    />
                    <InputField
                      label="Luas Bangunan (m²)"
                      name="buildingWide"
                      type="number"
                      value={item.buildingWide}
                      onChange={(e) => handleAdditionalChange(e, index)}
                      required
                      Icon={FaBuilding}
                    />
                    <InputField
                      label="Nomor Sertifikat"
                      name="certificate"
                      value={item.certificate}
                      onChange={(e) => handleAdditionalChange(e, index)}
                      required
                      Icon={FaFileSignature}
                    />
                  </div>

                  {additionalData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="absolute top-3 right-4 text-emerald-600 hover:text-red-500 text-sm transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRow}
                className="text-sm text-emerald-600 hover:underline font-medium"
              >
                + Tambah Subjek Pajak
              </button>
            </div>

            {/* Catatan */}
            <SectionTitle text="Catatan (Opsional)" />
            <textarea
              value={globalNote}
              onChange={(e) => setGlobalNote(e.target.value)}
              placeholder="Tambahkan catatan umum di sini..."
              className="min-h-[100px] w-full rounded-lg border border-emerald-300 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition"
            />

            {/* Tombol Submit */}
            <div className="text-right pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-lime-400 to-emerald-500 text-white px-8 py-3 rounded-lg shadow-md hover:from-lime-500 hover:to-emerald-600 disabled:opacity-60 transition text-base font-semibold"
              >
                {isSubmitting ? "Menyimpan..." : "Buat Permohonan"}
              </button>
            </div>
          </form>
        </div>

        {/* === PANEL KANAN === */}
        <div className="bg-gradient-to-br from-emerald-100 to-lime-50 rounded-3xl shadow-lg p-6 lg:p-8 text-emerald-900 border border-emerald-200/50 backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🌿 Cara Membuat Task
          </h3>
          <ul className="space-y-3 text-sm leading-relaxed list-disc list-inside">
            <li>Pilih jenis permohonan yang sesuai.</li>
            <li>Isi semua data utama dengan lengkap dan benar.</li>
            <li>Tambahkan data tambahan untuk setiap subjek pajak.</li>
            <li>Gunakan huruf kapital pada NOP dan NOPEL untuk kejelasan.</li>
            <li>
              Klik <strong>Buat Permohonan</strong> setelah semua data diisi.
            </li>
            <li>Sistem akan mengarahkan ke halaman daftar berkas Anda.</li>
          </ul>

          <div className="mt-6 p-4 bg-white/80 rounded-lg shadow-sm border border-emerald-200 text-sm">
            <p className="font-medium text-emerald-700 mb-1">Tips:</p>
            <p>
              Jika jenis task adalah <strong>pengaktifan</strong>, maka sistem
              akan otomatis mengeset tahap awal hingga <em>“Dikirim”</em>.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// === Komponen Kecil ===
const InputField = ({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  Icon,
}) => {
  const excluded = ["title", "subdistrict", "globalNote"];
  const showIcon = Icon && !excluded.includes(name);

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {showIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
          required={required}
          className={`w-full rounded-lg border border-emerald-300 ${
            showIcon ? "pl-12" : "pl-3"
          } py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 transition`}
        />
      </div>
    </div>
  );
};

const SectionTitle = ({ text }) => (
  <h3 className="text-lg font-semibold text-emerald-800 border-b border-emerald-200 pb-1 mb-2">
    {text}
  </h3>
);

export default CreateTask;
