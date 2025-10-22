import React, { useState, useCallback, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
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

  // IDs untuk label–input (aksesibilitas)
  const idNopel = useId();
  const idOldName = useId();
  const idNop = useId();
  const idAddress = useId();
  const idVillage = useId();
  const idSubdistrict = useId();
  const idTitle = useId();

  // State utama
  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
  });

  // Simpan angka sebagai string; konversi ke Number saat submit
  const [additionalData, setAdditionalData] = useState([
    { newName: "", landWide: "", buildingWide: "", certificate: "" },
  ]);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Handlers untuk mengisi main dan additional data
  const handleMainChange = useCallback((e) => {
    const { name, value } = e.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAdditionalChange = useCallback((e, index) => {
    const { name, value } = e.target;
    setAdditionalData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      return next;
    });
  }, []);

  const addAdditionalPerson = useCallback(() => {
    setAdditionalData((prev) => [
      ...prev,
      { newName: "", landWide: "", buildingWide: "", certificate: "" }, //menambah objek/baris baru untuk additional data
    ]);
  }, []);

  const removeAdditionalPerson = useCallback((idx) => {
    setAdditionalData((prev) => prev.filter((_, i) => i !== idx)); //membuat array baru kecuali yang punya index idx (menghapus barisnya)
  }, []);

  const toNumber = (v) => {
    if (v === "" || v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0; //mengonversi apa pun jadi angka aman tanpa bikin NaN
  };

  // Handler untuk melakukan submit data yang sudah dibuat
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!title) {
        toast.error("Jenis permohonan wajib dipilih.");
        return;
      }

      setSaving(true);

      const payload = {
        title,
        mainData,
        additionalData: additionalData.map((item) => ({
          newName: toTitle(item.newName),
          landWide: toNumber(item.landWide),
          buildingWide: toNumber(item.buildingWide),
          certificate: toUpper(item.certificate) || "",
        })),
        currentStage: "diinput",
      };

      try {
        await axiosInstance.post(API_PATHS.TASK.CREATE_TASK, payload);
        toast.success("Berkas berhasil dibuat");
        navigate(user?.role !== "admin" ? "/user/tasks" : "/admin/tasks");
      } catch (error) {
        toast.error(error?.response?.data?.message || "Gagal membuat permohonan");
      } finally {
        setSaving(false);
      }
    },
    [title, mainData, additionalData, navigate]
  );

  // Render
  return (
    <DashboardLayout activeMenu="Create Task">
      <h2 className="text-xl font-semibold mb-4">Buat Permohonan</h2>
      <div className="mt-5 border-t pt-4">
        <h3 className="text-slate-700 font-semibold mb-2">Data Utama</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* No Pelayanan */}
          <div>
            <label htmlFor={idNopel} className="block text-sm text-slate-600 mb-1">
              NOPEL <span className="text-red-500">*</span>
            </label>
            <input
              id={idNopel}
              type="text"
              name="nopel"
              value={toUpper(mainData.nopel)}
              onChange={handleMainChange}
              placeholder="NOPEL"
              className="form-input w-full uppercase"
              required
            />
          </div>

          {/* Nama Lama */}
          <div>
            <label htmlFor={idOldName} className="block text-sm text-slate-600 mb-1">
              Nama Lama <span className="text-red-500">*</span>
            </label>
            <input
              id={idOldName}
              type="text"
              name="oldName"
              value={toTitle(mainData.oldName)}
              onChange={handleMainChange}
              placeholder="Nama Lama"
              className="form-input w-full capitalize"
              required
            />
          </div>

          {/* NOP */}
          <div>
            <label htmlFor={idNop} className="block text-sm text-slate-600 mb-1">
              NOP <span className="text-red-500">*</span>
            </label>
            <input
              id={idNop}
              type="text"
              name="nop"
              value={mainData.nop}
              onChange={handleMainChange}
              placeholder="NOP"
              className="form-input w-full"
              required
              inputMode="numeric" //mengatur keyboard jadi angka (terutama di HP), bukan validasi. tetap harus validasi sendiri di server
            />
          </div>

          {/* Alamat */}
          <div>
            <label htmlFor={idAddress} className="block text-sm text-slate-600 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              id={idAddress}
              type="text"
              name="address"
              value={toTitle(mainData.address)}
              onChange={handleMainChange}
              placeholder="Alamat"
              className="form-input w-full capitalize"
              required
            />
          </div>

          {/* Kelurahan/Desa */}
          <div>
            <label htmlFor={idVillage} className="block text-sm text-slate-600 mb-1">
              Kelurahan/Desa <span className="text-red-500">*</span>
            </label>
            <input
              id={idVillage}
              type="text"
              name="village"
              value={toTitle(mainData.village)}
              onChange={handleMainChange}
              placeholder="Kelurahan/Desa"
              className="form-input w-full capitalize"
              required
            />
          </div>

          {/* Kecamatan */}
          <div>
            <label htmlFor={idSubdistrict} className="block text-sm text-slate-600 mb-1">
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
            <label htmlFor={idTitle} className="block text-sm text-slate-600 mb-1">
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

          {/* Data Tambahan */}
          <div className="md:col-span-2 border-t pt-4 mt-4">
            <h3 className="text-slate-700 font-semibold mb-2">Data Tambahan</h3>
            {additionalData.map((item, index) => (
              <AdditionalPersonInput
                key={index}
                item={item}
                index={index}
                handleChange={handleAdditionalChange}
                onRemove={removeAdditionalPerson}
                showRemove={additionalData.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={addAdditionalPerson}
              className="text-blue-600 text-sm hover:underline"
            >
              + Tambah Subjek Pajak Baru
            </button>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Buat Permohonan"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTask;
