import React, { useId, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * 🔹 Input universal dengan gaya yang konsisten (Login-style)
 * - Support label, hint, dan error
 * - Bisa menampilkan toggle password
 */
const Input = ({
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
  showPasswordToggle = false,
}) => {
  const reactId = useId();
  const inputId = id || `${name || "field"}-${reactId}`;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const currentType = showPassword && isPassword ? "text" : type;

  return (
    <div className="w-full">
      {/* === Label === */}
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* === Input wrapper === */}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={currentType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full rounded-lg border ${
            error
              ? "border-red-400 focus:ring-red-500"
              : "border-slate-300 focus:ring-indigo-500"
          } px-3 py-2 pr-${
            showPasswordToggle ? "10" : "3"
          } text-sm placeholder-slate-400 focus:outline-none focus:ring-2`}
        />

        {/* === Tombol Show/Hide Password === */}
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-indigo-600 focus:outline-none"
            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      {/* === Hint atau Error === */}
      {(hint || error) && (
        <p
          id={`${inputId}-desc`}
          className={`mt-1 text-xs ${
            error ? "text-red-600" : "text-slate-500"
          }`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};

export default Input;
