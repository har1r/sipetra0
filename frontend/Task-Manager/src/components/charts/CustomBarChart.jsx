import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

const COLORS = ["#8D51FF","#00B8DB","#7BCE08","#FFBB28","#FF1F57"];

const ellipsize = (s = "", max = 24) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

// ⬇️ Tooltip didefinisikan DI DALAM file chart (co-located)
const NF_ID = new Intl.NumberFormat("id-ID");

const TooltipContent = React.memo( function TooltipContent({ active, payload }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  const datum = payload[0]?.payload ?? {};
  const rawTitle = datum.title ?? payload[0]?.name ?? "";
  const rawCount = datum.count ?? payload[0]?.value ?? 0;

  const title = rawTitle
  const count = useMemo(
    () => NF_ID.format(Number.isFinite(rawCount) ? rawCount : 0),
    [rawCount]
  );

  return (
    <div role="tooltip" className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600">
        Total: <span className="font-medium text-slate-900">{count}</span>
      </p>
    </div>
  );
});

const CustomBarChart = ({
  id,
  data = [],
  colors = COLORS,
  height = 300,
  className = "",
  showLegend = false,
  maxLabel = 24,
}) => {
  const normalized = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map(d => ({
        title: String(d?.title ?? ""),
        count: Number.isFinite(d?.count) ? Number(d.count) : 0,
      })),
    [data]
  );

  const isAnimated = normalized.length <= 30;
  const formatXAxis = (v) => ellipsize(v, maxLabel);

  return (
    <figure id={id} className={className} role="group" aria-label="Diagram batang">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={normalized} barCategoryGap={20} margin={{ top: 8, right: 12, left: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="title" interval="preserveStartEnd" tick={{ fontSize: 12, fill: "#334155" }} tickFormatter={formatXAxis} stroke="none" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#334155" }} stroke="none" />
          {showLegend && <Legend verticalAlign="top" height={24} />}

          {/* ⬇️ tooltip terpasang di sini */}
          <Tooltip content={<TooltipContent />} />

          <Bar dataKey="count" radius={[10,10,0,0]} isAnimationActive={isAnimated}>
            {normalized.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export default React.memo(CustomBarChart);

// import React, { useMemo, useCallback } from "react";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Cell,
//   Legend,
// } from "recharts";
// import CustomBarTooltip from "./CustomBarTooltip";

// const DEFAULT_COLORS = [
//   "#8D51FF", "#00B8DB", "#7BCE08", "#FFBB28", "#FF1F57",
//   "#FE9900", "#00BC7D", "#FFCD00", "#845EC2", "#D65DB1", "#FF6F91",
// ];

// const CustomBarChart = ({
//   id,
//   data = [],
//   colors = DEFAULT_COLORS,
//   height = 300,
//   className = "",
//   showLegend = false,
// }) => {
//   const normalized = useMemo(
//     () =>
//       (Array.isArray(data) ? data : []).map((d) => ({
//         title: String(d?.title ?? ""),
//         count: Number(d?.count ?? 0),
//       })),
//     [data]
//   );

//   const formatTitle = useCallback((str) => {
//     if (!str) return "";
//     return str
//       .split("_")
//       .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//       .join(" ");
//   }, []);

//   const isAnimated = normalized.length <= 30;

//   const isSmallScreen =
//     typeof window !== "undefined" ? window.innerWidth <= 480 : false;

//   return (
//     <figure id={id} className={className} role="group" aria-label="Diagram batang">
//       <ResponsiveContainer width="100%" height={height}>
//         <BarChart
//           data={normalized}
//           barCategoryGap={20}
//           margin={{ top: 8, right: 12, left: 4, bottom: isSmallScreen ? 8 : 28 }}
//         >
//           <defs>
//             <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="0%" stopColor="#6366f1" stopOpacity="0.95" />
//               <stop offset="100%" stopColor="#6366f1" stopOpacity="0.65" />
//             </linearGradient>
//           </defs>

//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

//           <XAxis
//             dataKey="title"
//             interval={0}
//             // kalau layar kecil hide label, kalau besar tampilkan formatTitle
//             tick={isSmallScreen ? false : { fontSize: 12, fill: "#334155" }}
//             tickFormatter={isSmallScreen ? undefined : formatTitle}
//             stroke="none"
//           />

//           <YAxis
//             allowDecimals={false}
//             tick={{ fontSize: 12, fill: "#334155" }}
//             stroke="none"
//           />

//           {showLegend && <Legend verticalAlign="top" height={24} />}

//           <Tooltip content={<CustomBarTooltip />} />

//           <Bar dataKey="count" radius={[10, 10, 0, 0]} isAnimationActive={isAnimated}>
//             {normalized.map((_, idx) => (
//               <Cell key={idx} fill={colors[idx % colors.length] || "url(#barFill)"} />
//             ))}
//           </Bar>
//         </BarChart>
//       </ResponsiveContainer>
//     </figure>
//   );
// };

// export default React.memo(CustomBarChart);


