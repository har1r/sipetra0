import React, { forwardRef, useId, useState } from "react";

/**
 * Reusable Input
 * Props umum:
 * - id, name, label, type, value, defaultValue, onChange(value, event), onBlur
 * - placeholder, required, disabled, autoComplete
 * - error (string), hint (string)
 * - leftIcon: React component (mis. from react-icons)
 * - rightNode: ReactNode (opsional, custom tombol/ikon kanan)
 * Catatan: onChange akan dipanggil dengan (value, event) agar mudah dipakai.
 */
const Input = (
  {
    id,
    name,
    label,
    type = "text",
    placeholder,
    autoComplete,
    value,
    onChange,
    required,
    hint,
    error,
    // className = "",
    // defaultValue,
    // onBlur,
    // disabled,
    // maxLength,
    // min,
    // max,
  }
  // ref
) => {
  const reactId = useId();
  const inputId = id || `${name || "field"}-${reactId}`;
  // const [show, setShow] = useState(false); //1

  // const isPassword = type === "password"; //2
  // const inputType = isPassword ? (show ? "text" : "password") : type; //3

  const baseWrap =
    "relative flex items-center rounded-lg border bg-white transition-colors " +
    (error ? "border-red-400 focus-within:border-red-500" : "border-slate-300 focus-within:border-indigo-500");

  const baseInput =
    "w-full rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none";
  // const leftPad = LeftIcon ? "pl-9" : "pl-3";
  // const rightPad = rightNode || isPassword ? "pr-10" : "pr-3";

  // const handleChange = (e) => {
  //   onChange?.(e.target.value, e);
  // };

  return (
    <div className="w-fulf">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className={baseWrap}>
        {/* {LeftIcon && (
          <span className="pointer-events-none absolute left-3 text-slate-400">
            <LeftIcon className="h-5 w-5" aria-hidden />
          </span>
        )} */}

        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          className={`${baseInput}`}
          // ref={ref}
          // defaultValue={defaultValue}
          // onBlur={onBlur}
          // disabled={disabled}
          // aria-invalid={!!error}
          // aria-describedby={hint || error ? `${inputId}-desc` : undefined}
          // maxLength={maxLength}
          // min={min}
          // max={max}
        />

        {/* Right slot / password toggle
        <div className="absolute right-2 flex items-center gap-1">
          {rightNode}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            >
              {show ? "Sembunyikan" : "Tampilkan"}
            </button>
          )}
        </div> */}
      </div>

      {(hint || error) && (
        <p
          id={`${inputId}-desc`}
          className={`mt-1 text-xs ${error ? "text-red-600" : "text-slate-500"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default Input;
