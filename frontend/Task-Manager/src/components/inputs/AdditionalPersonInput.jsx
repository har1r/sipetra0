import React, { useId, memo } from "react";

/**
 * AdditionalPersonInput
 * - Dipakai di Create & Update.
 * - Secara default menampilkan field: newName, landWide, buildingWide, certificate (opsional).
 *
 * Props:
 *  - item: { newName, landWide, buildingWide, certificate? }
 *  - index: number
 *  - handleChange: (e, index) => void
 *  - onRemove?: (index) => void
 *  - showRemove?: boolean                  // tampilkan tombol hapus
 *  - includeCertificate?: boolean = true   // tampilkan field "certificate" atau tidak
 *  - cols?: 3 | 4                          // jumlah kolom di desktop (default 4 jika sertifikat, else 3)
 */
const AdditionalPersonInput = ({
  item,
  index,
  handleChange,
  onRemove,
  showRemove = false,
}) => {
  const baseId = useId();
  const idNewName = `${baseId}-newName-${index}`;
  const idLand = `${baseId}-landWide-${index}`;
  const idBuilding = `${baseId}-buildingWide-${index}`;
  const idCert = `${baseId}-certificate-${index}`;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-4`}>
      {/* Nama Baru */}
      <div>
        <label
          htmlFor={idNewName}
          className="block text-sm text-slate-600 mb-1"
        >
          Nama Baru <span className="text-red-500">*</span>
        </label>
        <input
          id={idNewName}
          type="text"
          name="newName"
          value={item.newName ?? ""}
          onChange={(e) => handleChange(e, index)}
          placeholder="Nama Baru"
          required
          className="form-input w-full capitalize"
        />
      </div>

      {/* Luas Tanah */}
      <div>
        <label htmlFor={idLand} className="block text-sm text-slate-600 mb-1">
          Luas Tanah (m²) <span className="text-red-500">*</span>
        </label>
        <input
          id={idLand}
          type="number"
          name="landWide"
          value={item.landWide ?? ""}
          onChange={(e) => handleChange(e, index)}
          placeholder="Luas Tanah (m²)"
          className="form-input w-full"
          min={0}
          step="any"
          required
          inputMode="decimal"
        />
      </div>

      {/* Luas Bangunan */}
      <div>
        <label
          htmlFor={idBuilding}
          className="block text-sm text-slate-600 mb-1"
        >
          Luas Bangunan (m²) <span className="text-red-500">*</span>
        </label>
        <input
          id={idBuilding}
          type="number"
          name="buildingWide"
          value={item.buildingWide ?? ""}
          onChange={(e) => handleChange(e, index)}
          placeholder="Luas Bangunan (m²)"
          className="form-input w-full"
          min={0}
          required
          step="any"
          inputMode="decimal"
        />
      </div>

      {/* Nomor Sertifikat (opsional) */}
      <div>
        <label htmlFor={idCert} className="block text-sm text-slate-600 mb-1">
          Nomor Sertifikat <span className="text-red-500">*</span>
        </label>
        <input
          id={idCert}
          type="text"
          name="certificate"
          value={item.certificate ?? ""}
          onChange={(e) => handleChange(e, index)}
          placeholder="Nomor Sertifikat"
          className="form-input w-full uppercase"
          required
        />
      </div>

      {/* Tombol hapus baris */}
      {showRemove && onRemove && (
        <div className={`md:col-span-4`}>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 text-sm hover:underline"
            title="Hapus baris ini"
          >
            Hapus baris
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(AdditionalPersonInput);
