import React, { useMemo } from "react";

const COLOR_MAP = {
  primary: "from-indigo-500 to-indigo-600",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
  yellow: "from-yellow-400 to-yellow-500",
  slate: "from-slate-400 to-slate-500",
  gray: "from-gray-300 to-gray-400",
};

/**
 * Props:
 * - id?: string
 * - icon?: ReactNode
 * - label: string
 * - value: number | string
 * - color?: 'primary' | 'green' | 'red' | 'yellow' | 'slate' | 'gray'
 */
const InfoCard = ({
  id,
  icon = null,
  label = "",
  value = 0,
  color = "primary",
}) => {
  const nf = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const displayValue = isNumber ? nf.format(value) : String(value ?? "");
  const gradient = COLOR_MAP[color] || COLOR_MAP.primary;

  const valueId = id ? `${id}-value` : undefined;
  const labelId = id ? `${id}-label` : undefined;

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={valueId}
      className="relative flex flex-col justify-between rounded-2xl bg-white shadow-sm hover:shadow-md border border-slate-100 transition-all duration-200 p-4 md:p-5"
    >
      {/* Accent line (kiri atas) */}
      <div
        className={`absolute top-0 left-0 h-1 w-full rounded-t-2xl bg-gradient-to-r ${gradient}`}
        aria-hidden
      />

      <div className="flex items-start justify-between">
        <div>
          <p
            id={labelId}
            className="text-xs md:text-sm text-slate-500 font-medium tracking-wide"
          >
            {label}
          </p>
          <p
            id={valueId}
            className="mt-1 text-lg md:text-xl font-semibold text-slate-900"
          >
            {displayValue}
          </p>
        </div>

        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(InfoCard);
// import React, { useMemo } from "react";

// const COLOR_MAP = {
//   primary: "bg-indigo-600",
//   green: "bg-green-500",
//   red: "bg-red-500",
//   yellow: "bg-yellow-500",
//   slate: "bg-slate-500",
//   gray: "bg-gray-300",
// };

// /**
//  * Props:
//  * - id?: string       // id opsional untuk anchor/telemetry
//  * - icon?: ReactNode
//  * - label: string
//  * - value: number | string
//  * - color?: 'primary' | 'green' | 'red' | 'yellow' | 'slate' | 'gray'
//  */
// const InfoCard = ({ id, icon = null, label = "", value = 0, color = "primary" }) => {
//   const nf = useMemo(() => new Intl.NumberFormat("id-ID"), []);
//   const isNumber = typeof value === "number" && Number.isFinite(value);
//   const displayValue = isNumber ? nf.format(value) : String(value ?? "");
//   const accent = COLOR_MAP[color] || COLOR_MAP.primary;

//   const valueId = id ? `${id}-value` : undefined;
//   const labelId = id ? `${id}-label` : undefined;

//   return (
//     <div
//       id={id}
//       className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:px-4 md:py-3 shadow-sm"
//       role="group"
//       aria-labelledby={labelId}
//       aria-describedby={valueId}
//     >
//       {/* indikator warna */}
//       <div className={`h-8 w-1.5 md:h-10 md:w-1.5 rounded-full ${accent}`} aria-hidden />

//       {/* value + label */}
//       <div className="min-w-0">
//         <div id={valueId} className="text-sm md:text-base font-semibold text-slate-900 truncate">
//           {displayValue}
//         </div>
//         <div id={labelId} className="text-xs md:text-[13px] text-slate-500 truncate">
//           {label}
//         </div>
//       </div>

//       {/* icon (opsional) */}
//       {icon && <span className="ml-auto text-slate-500" aria-hidden>{icon}</span>}
//     </div>
//   );
// };

// export default React.memo(InfoCard);
