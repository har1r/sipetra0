import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * 🌿 Input Field — Fresh Harmony Style
 * - Warna fokus hijau lembut
 * - Border dan shadow halus
 * - Dukungan icon kiri & tombol show/hide password
 */
const Input = ({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  icon,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = showPassword ? "text" : type;

  const paddingLeft = icon ? "pl-10" : "pl-3";
  const paddingRight = isPassword ? "pr-10" : "pr-3";

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {/* 🍃 Icon kiri */}
        {icon && (
          <span className="absolute left-3 text-emerald-400 flex items-center justify-center">
            {icon}
          </span>
        )}

        {/* 🌿 Input utama */}
        <input
          id={id}
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full rounded-xl border border-emerald-200 bg-white/70 ${paddingLeft} ${paddingRight} py-2 text-[15px] placeholder-emerald-300 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300 transition-all duration-200`}
        />

        {/* 🌼 Tombol show/hide password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-emerald-400 hover:text-emerald-600 transition-colors"
            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
