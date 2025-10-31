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

  // IDs untuk input
  const idNopel = useId();
  const idOldName = useId();
  const idNop = useId();
  const idAddress = useId();
  const idVillage = useId();
  const idSubdistrict = useId();
  const idTitle = useId();

  const [mainData, setMainData] = useState({
    nopel: "",
    nop: "",
    oldName: "",
    address: "",
    village: "",
    subdistrict: "",
    certificate: "",
  });

  const [additionalData, setAdditionalData] = useState([
    { newName: "", landWide: "", buildingWide: "", certificate: "" },
  ]);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);

  const abortControllerRef = useRef(null);

  const toSafeNumber = (value) => {
    if (!value) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // === Fetch Task ===
  const fetchTask = useCallback(async () => {
    setLoadingTask(true);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axiosInstance.get(API_PATHS.TASK.GET_TASK_BY_ID(id), {
        signal: controller.signal,
      });

      const task = res?.data || {};
      const main = task.mainData || {};

      const mappedAdditional = Array.isArray(task.additionalData)
        ? task.additionalData.map((item) => ({
            newName: item?.newName ?? "",
            landWide: item?.landWide?.toString?.() ?? "",
            buildingWide: item?.buildingWide?.toString?.() ?? "",
            certificate: item?.certificate?.toString?.() ?? "",
          }))
        : [];

      // Fallback jika certificate kosong
      if (
        (mappedAdditional.length === 0 || !mappedAdditional[0]?.certificate) &&
        main.certificate
      ) {
        mappedAdditional[0] = mappedAdditional[0] || {
          newName: "",
          landWide: "",
          buildingWide: "",
          certificate: "",
        };
        mappedAdditional[0].certificate = main.certificate;
      }

      setMainData({
        nopel: main.nopel || "",
        nop: main.nop || "",
        oldName: main.oldName || "",
        address: main.address || "",
        village: main.village || "",
        subdistrict: main.subdistrict || "",
        certificate: main.certificate || "",
      });

      setAdditionalData(
        mappedAdditional.length
          ? mappedAdditional
          : [{ newName: "", landWide: "", buildingWide: "", certificate: "" }]
      );

      setTitle(task.title || "");
    } catch (error) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error("Gagal memuat data permohonan");
      }
    } finally {
      setLoadingTask(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    return () => abortControllerRef.current?.abort();
  }, [fetchTask]);

  // === Handlers ===
  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdditionalChange = (e, index) => {
    const { name, value } = e.target;
    setAdditionalData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      return next;
    });
  };

  const addAdditionalPerson = () => {
    setAdditionalData((prev) => [
      ...prev,
      { newName: "", landWide: "", buildingWide: "", certificate: "" },
    ]);
  };

  const removeAdditionalPerson = (indexToRemove) => {
    setAdditionalData((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // === Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) {
      toast.error("Jenis permohonan wajib dipilih.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      mainData,
      additionalData: additionalData.map((data) => ({
        newName: toTitle(data.newName),
        landWide: toSafeNumber(data.landWide),
        buildingWide: toSafeNumber(data.buildingWide),
        certificate: toUpper(data.certificate) || "",
      })),
    };

    try {
      await axiosInstance.patch(API_PATHS.TASK.UPDATE_TASK(id), payload);
      toast.success("Permohonan berhasil diperbarui");
      navigate(user?.role !== "admin" ? "/user/tasks" : "/admin/tasks");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal memperbarui permohonan ❌"
      );
    } finally {
      setSaving(false);
    }
  };

  // === Render ===
  return (
    <DashboardLayout activeMenu="Update Task">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Perbarui Permohonan
      </h2>

      {loadingTask ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 w-full animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2"
        >
          <SectionTitle title="Data Utama" />

          <InputField
            id={idNopel}
            name="nopel"
            label="NOPEL"
            value={toUpper(mainData.nopel)}
            onChange={handleMainChange}
            required
            uppercase
          />
          <InputField
            id={idOldName}
            name="oldName"
            label="Nama Lama"
            value={toTitle(mainData.oldName)}
            onChange={handleMainChange}
            required
            capitalize
          />
          <InputField
            id={idNop}
            name="nop"
            label="NOP"
            value={mainData.nop}
            onChange={handleMainChange}
            required
            numeric
          />
          <InputField
            id={idAddress}
            name="address"
            label="Alamat"
            value={toTitle(mainData.address)}
            onChange={handleMainChange}
            required
            capitalize
          />
          <InputField
            id={idVillage}
            name="village"
            label="Kelurahan/Desa"
            value={toTitle(mainData.village)}
            onChange={handleMainChange}
            required
            capitalize
          />

          <SelectField
            id={idSubdistrict}
            name="subdistrict"
            label="Kecamatan"
            value={mainData.subdistrict}
            onChange={handleMainChange}
            options={SUBDISTRICT_OPTIONS}
          />

          <SelectField
            id={idTitle}
            label="Jenis Permohonan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            options={TITLE_OPTIONS}
          />

          <div className="md:col-span-2 mt-4 border-t pt-4">
            <SectionTitle title="Data Tambahan" />

            {additionalData.map((item, idx) => (
              <AdditionalPersonInput
                key={idx}
                item={item}
                index={idx}
                handleChange={handleAdditionalChange}
                onRemove={removeAdditionalPerson}
                showRemove={additionalData.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={addAdditionalPerson}
              className="text-sm text-blue-600 hover:underline"
            >
              + Tambah Subjek Pajak Baru
            </button>
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-primary px-4 py-2 text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Perbarui Permohonan"}
            </button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
};

export default React.memo(UpdateTask);

/* ===== Komponen Tambahan ===== */
const InputField = ({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  uppercase = false,
  capitalize = false,
  numeric = false,
}) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm text-slate-600">
      {label}
    </label>
    <input
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      autoComplete="off"
      inputMode={numeric ? "numeric" : "text"}
      className={`form-input w-full ${
        uppercase ? "uppercase" : capitalize ? "capitalize" : ""
      }`}
      placeholder={label}
    />
  </div>
);

const SelectField = ({ id, name, label, value, onChange, options }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm text-slate-600">
      {label}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="form-input w-full"
    >
      <option value="">Pilih {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const SectionTitle = ({ title }) => (
  <h3 className="md:col-span-2 mb-2 font-semibold text-slate-700">{title}</h3>
);
