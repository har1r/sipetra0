import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ===========================
   Utils (selaras dengan Bar)
   =========================== */

// Formatter angka lokal (buat sekali per modul)
const NF_ID = new Intl.NumberFormat("id-ID");

// Tooltip co-located (memoized)
const TooltipContent = React.memo(function TooltipContent({ active, payload }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const datum = payload[0]?.payload ?? {};
  const rawLabel = datum.label ?? payload[0]?.name ?? "";
  const rawTotal = datum.total ?? payload[0]?.value ?? 0;

  const label = useMemo(() => rawLabel)
  const total = useMemo(
    () => NF_ID.format(Number.isFinite(rawTotal) ? rawTotal : 0),
    [rawTotal]
  );

  return (
    <div role="tooltip" className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">
        Total: <span className="font-medium text-slate-900">{total}</span>
      </p>
    </div>
  );
});

/* ===========================
   Komponen Utama
   =========================== */

/**
 * Props:
 * - id?: string
 * - data: { label: string, total: number }[]
 * - height?: number
 * - className?: string
 * - showLegend?: boolean
 */
const CustomGraphChart = ({
  id,
  data = [],
  height = 288,
  className = "",
  showLegend = true,
}) => {
  // Normalisasi defensif
  const normalized = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((d) => ({
        label: String(d?.label ?? ""),
        total: Number.isFinite(d?.total) ? Number(d.total) : 0,
      })),
    [data]
  );

  // Matikan animasi bila titik banyak (hemat performa)
  const isAnimated = normalized.length <= 60;

  return (
    <figure id={id} className={className} role="group" aria-label="Grafik garis">
      {normalized.length === 0 ? (
        <div className="h-72 grid place-items-center text-sm text-slate-500">
          Tidak ada data grafik
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={normalized}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

            <XAxis
              dataKey="label"
              interval="preserveStartEnd"        // selaras dengan Bar: biarkan recharts kelola kepadatan
              angle={-15}
              textAnchor="end"
              height={50}
              tick={{ fontSize: 12, fill: "#334155" }}
              stroke="none"
            />

            <YAxis
              tick={{ fontSize: 12, fill: "#334155" }}
              allowDecimals
              stroke="none"
            />

            {showLegend && <Legend verticalAlign="top" height={24} />}

            <Tooltip content={<TooltipContent />} />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2.25}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={isAnimated}
              name="Total Tasks"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}

export default React.memo(CustomGraphChart)

// import React, { useMemo } from "react";
// import {
//   LineChart,
//   Line,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import CustomGraphTooltip from "./CustomGraphTooltip";

// /**
//  * Props:
//  * - id?: string
//  * - data: { label: string, total: number }[]
//  * - height?: number
//  * - className?: string
//  * - showLegend?: boolean
//  */
// const CustomGraphChart = ({ id, data = [], height = 288, className = "", showLegend = true }) => {
//   const normalized = useMemo(
//     () =>
//       (Array.isArray(data) ? data : []).map((d) => ({
//         label: String(d?.label ?? ""),
//         total: Number(d?.total ?? 0),
//       })),
//     [data]
//   );

//   const isAnimated = normalized.length <= 60;

//   return (
//     <figure id={id} className={className} role="group" aria-label="Grafik garis">
//       {normalized.length === 0 ? (
//         <div className="h-72 grid place-items-center text-sm text-slate-500">
//           Tidak ada data grafik
//         </div>
//       ) : (
//         <ResponsiveContainer width="100%" height={height}>
//           <LineChart data={normalized} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
//             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//             <XAxis
//               dataKey="label"
//               angle={-15}
//               textAnchor="end"
//               height={60}
//               tick={{ fontSize: 12, fill: "#334155" }}
//               stroke="none"
//             />
//             <YAxis tick={{ fontSize: 12, fill: "#334155" }} allowDecimals stroke="none" />
//             <Tooltip content={<CustomGraphTooltip />} />
//             <Line
//               type="monotone"
//               dataKey="total"
//               stroke="#6366f1"
//               strokeWidth={2.5}
//               dot={{ r: 3 }}
//               name="Total Tasks"
//               isAnimationActive={isAnimated}
//               activeDot={{ r: 5 }}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       )}
//     </figure>
//   );
// };

// export default React.memo(CustomGraphChart);
