import React, { useMemo } from "react";

const COLOR_MAP = {
  primary: "bg-indigo-600",
  green: "bg-green-500",
  red: "bg-red-500",
  yellow: "bg-yellow-500",
  slate: "bg-slate-500",
  gray: "bg-gray-300",
};

/**
 * Props:
 * - id?: string       // id opsional untuk anchor/telemetry
 * - icon?: ReactNode
 * - label: string
 * - value: number | string
 * - color?: 'primary' | 'green' | 'red' | 'yellow' | 'slate' | 'gray'
 */
const InfoCard = ({ id, icon = null, label = "", value = 0, color = "primary" }) => {
  const nf = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const displayValue = isNumber ? nf.format(value) : String(value ?? "");
  const accent = COLOR_MAP[color] || COLOR_MAP.primary;

  const valueId = id ? `${id}-value` : undefined;
  const labelId = id ? `${id}-label` : undefined;

  return (
    <div
      id={id}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:px-4 md:py-3 shadow-sm"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={valueId}
    >
      {/* indikator warna */}
      <div className={`h-8 w-1.5 md:h-10 md:w-1.5 rounded-full ${accent}`} aria-hidden />

      {/* value + label */}
      <div className="min-w-0">
        <div id={valueId} className="text-sm md:text-base font-semibold text-slate-900 truncate">
          {displayValue}
        </div>
        <div id={labelId} className="text-xs md:text-[13px] text-slate-500 truncate">
          {label}
        </div>
      </div>

      {/* icon (opsional) */}
      {icon && <span className="ml-auto text-slate-500" aria-hidden>{icon}</span>}
    </div>
  );
};

export default React.memo(InfoCard);