// src/pages/Admin/UpdateTask.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
  useContext,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import AdditionalPersonInput from "../../components/inputs/AdditionalPersonInput";
import { UserContext } from "../../context/UserContexts";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { SUBDISTRICT_OPTIONS, TITLE_OPTIONS } from "../../utils/data";
import { toTitle, toUpper } from "../../utils/string";

const UpdateTask = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { id } = useParams();

  // IDs untuk label–input (aksesibilitas) — diselaraskan dengan CreateTask
  const idNopel = useId();
  const idOldName = useId();
  const idNop = useId();
  const idAddress = useId();
  const idVillage = useId();
  const idSubdistrict = useId();
  const idTitle = useId();

  // === State utama (struktur sama dengan CreateTask) ===
  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
    // certificate tersimpan jika datang dari server, tapi tidak ditampilkan di form Data Utama
    certificate: "",
  });

  // Simpan angka sebagai string; konversi saat submit (sama seperti CreateTask)
  const [additionalData, setAdditionalData] = useState([
    { newName: "", landWide: "", buildingWide: "", certificate: "" },
  ]);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);

  // Abort controller untuk fetch detail
  const abortRef = useRef(null);

  // Util angka aman
  const toNumber = (v) => {
    if (v === "" || v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // === Fetch task (abort-safe) ===
  const fetchTask = useCallback(async () => {
    setLoadingTask(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id), {
        signal: ctrl.signal,
      });
      const task = res?.data || {};

      // Main data
      setMainData({
        nopel: task.mainData?.nopel || "",
        nop: task.mainData?.nop || "",
        oldName: task.mainData?.oldName || "",
        address: task.mainData?.address || "",
        village: task.mainData?.village || "",
        subdistrict: task.mainData?.subdistrict || "",
        certificate: task.mainData?.certificate || "",
      });

      // Additional data (ikuti pola CreateTask)
      const mappedAdditional = (Array.isArray(task.additionalData) ? task.additionalData : []).map(
        (a) => ({
          newName: a?.newName ?? "",
          landWide: a?.landWide?.toString?.() ?? "",
          buildingWide: a?.buildingWide?.toString?.() ?? "",
          certificate: a?.certificate?.toString?.() ?? "",
        })
      );

      // Jika certificate ada di mainData tapi additional kosong, migrasikan ke item pertama
      if (
        (mappedAdditional.length === 0 || !mappedAdditional[0]?.certificate) &&
        task.mainData?.certificate
      ) {
        const first =
          mappedAdditional[0] || { newName: "", landWide: "", buildingWide: "", certificate: "" };
        first.certificate = task.mainData.certificate;
        setAdditionalData([first, ...mappedAdditional.slice(1)]);
      } else {
        setAdditionalData(
          mappedAdditional.length
            ? mappedAdditional
            : [{ newName: "", landWide: "", buildingWide: "", certificate: "" }]
        );
      }

      setTitle(task.title || "");
    } catch (error) {
      if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
        toast.error("Gagal memuat data permohonan");
      }
    } finally {
      setLoadingTask(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    return () => abortRef.current?.abort();
  }, [fetchTask]);

  // === Handlers (sama pola dengan CreateTask) ===
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
      { newName: "", landWide: "", buildingWide: "", certificate: "" },
    ]);
  }, []);

  const removeAdditionalPerson = useCallback((idx) => {
    setAdditionalData((prev) => prev.filter((_, i) => i !== idx));
  }, []);

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
        mainData, // kirim apa adanya (ikuti CreateTask)
        additionalData: additionalData.map((item) => ({
          newName: toTitle(item.newName),
          landWide: toNumber(item.landWide),
          buildingWide: toNumber(item.buildingWide),
          certificate: toUpper(item.certificate) || "",
        })),
      };

      try {
        await axiosInstance.patch(API_PATHS.TASK.UPDATE_TASK(id), payload);
        toast.success("Task berhasil diperbarui");
        navigate(user?.role !== "admin" ? "/user/tasks" : "/admin/tasks");
      } catch (error) {
        toast.error(error?.response?.data?.message || "Gagal memperbarui permohonan");
      } finally {
        setSaving(false);
      }
    },
    [title, mainData, additionalData, id, navigate, user?.role]
  );

  // === Render ===
  return (
    <DashboardLayout activeMenu="Update Task">
      <h2 className="text-xl font-semibold mb-4">Perbarui Permohonan</h2>

      {loadingTask ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-5 border-t pt-4">
          <h3 className="text-slate-700 font-semibold mb-2">Data Utama</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NOPEL */}
            <div>
              <label htmlFor={idNopel} className="block text-sm text-slate-600 mb-1">
                NOPEL
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
                autoComplete="off"
              />
            </div>

            {/* Nama Lama */}
            <div>
              <label htmlFor={idOldName} className="block text-sm text-slate-600 mb-1">
                Nama Lama
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
                NOP
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
                autoComplete="off"
                inputMode="numeric"
              />
            </div>

            {/* Alamat */}
            <div>
              <label htmlFor={idAddress} className="block text-sm text-slate-600 mb-1">
                Alamat
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
                autoComplete="off"
              />
            </div>

            {/* Kelurahan/Desa */}
            <div>
              <label htmlFor={idVillage} className="block text-sm text-slate-600 mb-1">
                Kelurahan/Desa
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
                autoComplete="off"
              />
            </div>

            {/* Kecamatan */}
            <div>
              <label htmlFor={idSubdistrict} className="block text-sm text-slate-600 mb-1">
                Kecamatan
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
                Jenis Permohonan
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

            {/* Data Tambahan (identik dengan CreateTask) */}
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
                {saving ? "Menyimpan..." : "Perbarui Permohonan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UpdateTask;
