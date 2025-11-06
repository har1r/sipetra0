import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * 🔹 Komponen Input universal dengan gaya konsisten
 * - Support icon di kiri
 * - Support show/hide password
 * - Responsif dan clean
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

  // Tentukan padding kiri dan kanan agar teks tidak tabrakan
  const paddingLeft = icon ? "pl-10" : "pl-3";
  const paddingRight = isPassword ? "pr-10" : "pr-3";

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {/* 🔸 Icon kiri */}
        {icon && (
          <span className="absolute left-3 text-slate-400 flex items-center justify-center">
            {icon}
          </span>
        )}

        {/* 🔸 Input utama */}
        <input
          id={id}
          type={currentType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full rounded-lg border border-slate-300 ${paddingLeft} ${paddingRight} py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`}
        />

        {/* 🔸 Tombol show/hide password */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-indigo-600 focus:outline-none"
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
