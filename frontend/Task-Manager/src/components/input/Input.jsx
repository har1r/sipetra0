import { useState, forwardRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Input = forwardRef(
  (
    {
      id,
      type = "text",
      error,
      placeholder,
      name,
      value,
      onChange,
      required = false,
      icon,
      className = "",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword && showPassword ? "text" : type;

    const paddingLeft = icon ? "pl-11" : "pl-4";
    const paddingRight = isPassword ? "pr-11" : "pr-4";

    return (
      <div className="w-full">
        <div className="relative group flex items-center">
          {icon && (
            <span
              className={`absolute left-3.5 flex items-center justify-center transition-colors duration-200 
            ${error ? "text-red-500" : "text-slate-400 group-focus-within:text-emerald-600"}`}
            >
              {icon}
            </span>
          )}

          <input
            {...props}
            ref={ref}
            id={id}
            type={currentType}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full py-2.5 text-[15px] transition-all duration-300
            rounded-xl border bg-white/70 shadow-sm focus:outline-none
            ${
              /* LOGIKA WARNA DISINI */
              error
                ? "border-red-500 bg-red-50/50 placeholder-red-500 focus:ring-2 focus:ring-red-200"
                : "border-emerald-100 placeholder-emerald-600/50 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            } 
            text-slate-700
            ${paddingLeft} ${paddingRight}
            ${className} /* Tambahan class dari luar (opsional) */
            `}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3.5 p-1 
              ${error ? "text-red-500" : "text-emerald-600/70"} 
              hover:text-emerald-600 transition-colors focus:outline-none`}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          )}
        </div>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
