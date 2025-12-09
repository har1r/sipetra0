// === Styled InfoCard (Matching CreateTask + Styled Dashboard Aesthetic) ===
// Warna hijau-emerald, rounded 3XL, soft shadow, blurred background, accent line lembut

import React, { useMemo } from "react";

const COLOR_GRADIENT_MAP = {
  primary: "from-emerald-400 to-emerald-500",
  green: "from-green-400 to-green-500",
  red: "from-red-400 to-red-500",
  yellow: "from-yellow-300 to-yellow-400",
  slate: "from-slate-400 to-slate-500",
  gray: "from-gray-300 to-gray-400",
};

const InfoCard = ({
  id,
  icon = null,
  label = "",
  value = 0,
  color = "primary",
}) => {
  const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const isValueNumeric = typeof value === "number" && Number.isFinite(value);
  const formattedValue = isValueNumeric
    ? numberFormatter.format(value)
    : String(value ?? "");

  const gradientColor = COLOR_GRADIENT_MAP[color] || COLOR_GRADIENT_MAP.primary;

  const valueElementId = id ? `${id}-value` : undefined;
  const labelElementId = id ? `${id}-label` : undefined;

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelElementId}
      aria-describedby={valueElementId}
      className="relative flex flex-col justify-between rounded-3xl bg-white/80 backdrop-blur-lg shadow-md hover:shadow-lg border border-emerald-100 transition-all duration-300 p-5"
    >
      {/* Accent Line */}
      <div
        className={`absolute top-0 left-0 h-1.5 w-full rounded-t-3xl bg-gradient-to-r ${gradientColor}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between">
        <div>
          <p
            id={labelElementId}
            className="text-xs md:text-sm text-emerald-700 font-medium tracking-wide"
          >
            {label}
          </p>
          <p
            id={valueElementId}
            className="mt-1 text-xl md:text-2xl font-extrabold text-emerald-900 tracking-tight drop-shadow-sm"
          >
            {formattedValue}
          </p>
        </div>

        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(InfoCard);
// import React, { useMemo } from "react";

// const COLOR_GRADIENT_MAP = {
//   primary: "from-indigo-500 to-indigo-600",
//   green: "from-green-500 to-green-600",
//   red: "from-red-500 to-red-600",
//   yellow: "from-yellow-400 to-yellow-500",
//   slate: "from-slate-400 to-slate-500",
//   gray: "from-gray-300 to-gray-400",
// };

// /**
//  * InfoCard Component
//  *
//  * Props:
//  * - id?: string → unik identifier untuk aksesibilitas
//  * - icon?: ReactNode → ikon kecil di sisi kanan
//  * - label: string → judul atau deskripsi singkat
//  * - value: number | string → angka atau teks utama
//  * - color?: 'primary' | 'green' | 'red' | 'yellow' | 'slate' | 'gray' → warna garis aksen
//  */
// const InfoCard = ({
//   id,
//   icon = null,
//   label = "",
//   value = 0,
//   color = "primary",
// }) => {
//   // Format angka untuk lokal Indonesia
//   const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);
//   const isValueNumeric = typeof value === "number" && Number.isFinite(value);
//   const formattedValue = isValueNumeric
//     ? numberFormatter.format(value)
//     : String(value ?? "");

//   // Pilih warna gradient berdasarkan props color
//   const gradientColor = COLOR_GRADIENT_MAP[color] || COLOR_GRADIENT_MAP.primary;

//   // Aksesibilitas
//   const valueElementId = id ? `${id}-value` : undefined;
//   const labelElementId = id ? `${id}-label` : undefined;

//   return (
//     <div
//       id={id}
//       role="group"
//       aria-labelledby={labelElementId}
//       aria-describedby={valueElementId}
//       className="relative flex flex-col justify-between rounded-2xl bg-white shadow-sm hover:shadow-md border border-slate-100 transition-all duration-200 p-4 md:p-5"
//     >
//       {/* Accent Line (di bagian atas) */}
//       <div
//         className={`absolute top-0 left-0 h-1 w-full rounded-t-2xl bg-gradient-to-r ${gradientColor}`}
//         aria-hidden="true"
//       />

//       <div className="flex items-start justify-between">
//         <div>
//           <p
//             id={labelElementId}
//             className="text-xs md:text-sm text-slate-500 font-medium tracking-wide"
//           >
//             {label}
//           </p>
//           <p
//             id={valueElementId}
//             className="mt-1 text-lg md:text-xl font-semibold text-slate-900"
//           >
//             {formattedValue}
//           </p>
//         </div>

//         {icon && (
//           <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500">
//             {icon}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default React.memo(InfoCard);
