// src/components/ui/ImagePreview.jsx
import React, { useEffect, useId, useMemo, useState, useCallback } from "react";

const DEFAULT_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const DEFAULT_MAX_MB = 3;

/**
 * ImagePreview
 * - Komponen unggah + pratinjau avatar yang ringan & aksesibel.
 *
 * Props:
 * - image: File|null
 * - setImage: (file|null)=>void
 * - label?: string
 * - acceptTypes?: string[] (default: jpg/jpeg/png)
 * - maxMB?: number (default: 3)
 * - helperText?: string
 * - shape?: "circle" | "square" (default: "circle")
 * - disabled?: boolean
 * - onError?: (msg:string)=>void
 */
const ImagePreview = ({
  image,
  setImage,
  label,
  shape,
  acceptTypes = DEFAULT_TYPES,
  maxMB = DEFAULT_MAX_MB,
  helperText,
  disabled = false,
  onError,
}) => {
  const inputId = useId();
  const helpId = useId();
  const dropId = useId();

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  // Buat/revoke ObjectURL untuk preview
  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  // String accept untuk <input accept="..">
  const acceptAttr = useMemo(() => acceptTypes.join(","), [acceptTypes]);

  // Ukuran file untuk info singkat
  const prettySize = useMemo(() => {
    if (!image) return "";
    const mb = image.size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }, [image]);

  const invalidate = useCallback(
    (msg) => {
      setError(msg);
      onError?.(msg);
      setImage(null);
    },
    [onError, setImage]
  );

  const validateAndSet = useCallback(
    (file) => {
      if (!file) return;
      if (!acceptTypes.includes(file.type)) {
        return invalidate("Format tidak didukung. Gunakan JPG atau PNG.");
      }
      if (file.size > maxMB * 1024 * 1024) {
        return invalidate(`Ukuran terlalu besar. Maksimal ${maxMB}MB.`);
      }
      setError("");
      setImage(file);
    },
    [acceptTypes, maxMB, setImage, invalidate]
  );

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    validateAndSet(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    validateAndSet(file);
  };

  const onDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
  };

  const clearImage = () => {
    setError("");
    setImage(null);
  };

  return (
    <div className="mb-4 w-full">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar / Preview */}
          <div
            className={`relative grid h-20 w-20 place-items-center overflow-hidden border border-slate-200 bg-slate-50 ${
              shape === "square" ? "rounded-xl" : "rounded-full"
            }`}
            aria-labelledby={dropId}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview foto profil"
                className="h-full w-full object-cover"
              />
            ) : (
              // Ikon placeholder
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-slate-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.761 0 5-2.686 5-6s-2.239-6-5-6-5 2.686-5 6 2.239 6 5 6zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z" />
              </svg>
            )}
          </div>

          {/* Control */}
          <div className="min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className="mb-1 block text-sm font-medium text-slate-800"
              id={dropId}
            >
              {label}
            </label>

            {/* Input file disembunyikan, kontrol via label-button */}
            <input
              id={inputId}
              type="file"
              accept={acceptAttr}
              onChange={onPickFile}
              aria-describedby={helpId}
              disabled={disabled}
              className="sr-only"
            />

            {/* Dropzone + tombol pilih */}
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  document.getElementById(inputId)?.click();
                }
              }}
              onClick={() => !disabled && document.getElementById(inputId)?.click()}
              onDragOver={onDragOver}
              onDrop={onDrop}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2
                ${disabled ? "cursor-not-allowed bg-slate-100 border-slate-200" : "cursor-pointer hover:bg-slate-50 border-slate-300"}
              `}
              aria-disabled={disabled}
              title={disabled ? "Tidak bisa mengunggah saat ini" : "Klik atau seret & letakkan gambar di sini"}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-slate-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4 3a2 2 0 00-2 2v8a2 2 0 002 2h3l2 2 2-2h3a2 2 0 002-2V9l-4-4H4z" />
                </svg>
                <span className="text-sm text-slate-400">
                  {image ? "Ganti gambar" : "Klik atau tarik & letakkan gambar di sini"}
                </span>
              </div>

              <span className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                Pilih
              </span>
            </div>

            {/* Helper & info file */}
            <p id={helpId} className="mt-2 text-xs text-slate-500">
              Format: JPG/PNG • Maks: {maxMB}MB
              {helperText ? ` • ${helperText}` : ""}
            </p>

            {image && (
              <p className="mt-1 truncate text-xs text-slate-600">
                File: <span className="font-medium">{image.name}</span> • {prettySize}
              </p>
            )}

            {/* Actions */}
            {image && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Hapus gambar"
                >
                  Hapus
                </button>
                <label
                  htmlFor={inputId}
                  className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="Ganti gambar"
                >
                  Ganti
                </label>
              </div>
            )}

            {/* Error */}
            {!!error && (
              <p className="mt-2 text-xs text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;



