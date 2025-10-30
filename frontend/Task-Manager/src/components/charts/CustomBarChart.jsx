import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366F1", "#0EA5E9", "#22C55E", "#FACC15", "#EF4444"]; // warna lebih lembut & dashboard-style

const ellipsize = (s = "", max = 24) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

const NF_ID = new Intl.NumberFormat("id-ID");

const TooltipContent = React.memo(function TooltipContent({ active, payload }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  const datum = payload[0]?.payload ?? {};
  const title = datum.title ?? payload[0]?.name ?? "";
  const count = NF_ID.format(Number.isFinite(datum.count) ? datum.count : 0);

  return (
    <div
      role="tooltip"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md"
    >
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-600">
        Total: <span className="font-semibold text-slate-900">{count}</span>
      </p>
    </div>
  );
});

const CustomBarChart = ({
  id,
  data = [],
  colors = COLORS,
  height = 320,
  className = "",
  showLegend = false,
  maxLabel = 20,
}) => {
  const normalized = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((d) => ({
        title: String(d?.title ?? ""),
        count: Number.isFinite(d?.count) ? Number(d.count) : 0,
      })),
    [data]
  );

  const isAnimated = normalized.length <= 30;
  const formatXAxis = (v) => ellipsize(v, maxLabel);

  return (
    <figure
      id={id}
      className={`rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      role="group"
      aria-label="Diagram batang performa"
    >
      {showLegend && (
        <figcaption className="mb-3 text-sm font-medium text-slate-700">
          Distribusi Data
        </figcaption>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={normalized}
          barCategoryGap={24}
          margin={{ top: 10, right: 10, left: 0, bottom: 32 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="title"
            interval="preserveStartEnd"
            tick={{ fontSize: 12, fill: "#475569" }}
            tickFormatter={formatXAxis}
            stroke="none"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#475569" }}
            stroke="none"
          />
          {showLegend && <Legend verticalAlign="top" height={28} />}
          <Tooltip content={<TooltipContent />} />
          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
            isAnimationActive={isAnimated}
          >
            {normalized.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
};

export default React.memo(CustomBarChart);
// import React, { useMemo } from "react";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell, Legend,
// } from "recharts";

// const COLORS = ["#8D51FF","#00B8DB","#7BCE08","#FFBB28","#FF1F57"];

// const ellipsize = (s = "", max = 24) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

// // ⬇️ Tooltip didefinisikan DI DALAM file chart (co-located)
// const NF_ID = new Intl.NumberFormat("id-ID");

// const TooltipContent = React.memo( function TooltipContent({ active, payload }) {
//   if (!active || !Array.isArray(payload) || payload.length === 0) return null;
//   const datum = payload[0]?.payload ?? {};
//   const rawTitle = datum.title ?? payload[0]?.name ?? "";
//   const rawCount = datum.count ?? payload[0]?.value ?? 0;

//   const title = rawTitle
//   const count = useMemo(
//     () => NF_ID.format(Number.isFinite(rawCount) ? rawCount : 0),
//     [rawCount]
//   );

//   return (
//     <div role="tooltip" className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
//       <p className="mb-1 text-sm font-semibold text-slate-900">{title}</p>
//       <p className="text-sm text-slate-600">
//         Total: <span className="font-medium text-slate-900">{count}</span>
//       </p>
//     </div>
//   );
// });

// const CustomBarChart = ({
//   id,
//   data = [],
//   colors = COLORS,
//   height = 300,
//   className = "",
//   showLegend = false,
//   maxLabel = 24,
// }) => {
//   const normalized = useMemo(
//     () =>
//       (Array.isArray(data) ? data : []).map(d => ({
//         title: String(d?.title ?? ""),
//         count: Number.isFinite(d?.count) ? Number(d.count) : 0,
//       })),
//     [data]
//   );

//   const isAnimated = normalized.length <= 30;
//   const formatXAxis = (v) => ellipsize(v, maxLabel);

//   return (
//     <figure id={id} className={className} role="group" aria-label="Diagram batang">
//       <ResponsiveContainer width="100%" height={height}>
//         <BarChart data={normalized} barCategoryGap={20} margin={{ top: 8, right: 12, left: 4, bottom: 28 }}>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
//           <XAxis dataKey="title" interval="preserveStartEnd" tick={{ fontSize: 12, fill: "#334155" }} tickFormatter={formatXAxis} stroke="none" />
//           <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#334155" }} stroke="none" />
//           {showLegend && <Legend verticalAlign="top" height={24} />}

//           {/* ⬇️ tooltip terpasang di sini */}
//           <Tooltip content={<TooltipContent />} />

//           <Bar dataKey="count" radius={[10,10,0,0]} isAnimationActive={isAnimated}>
//             {normalized.map((_, i) => (
//               <Cell key={i} fill={colors[i % colors.length]} />
//             ))}
//           </Bar>
//         </BarChart>
//       </ResponsiveContainer>
//     </figure>
//   );
// }

// export default React.memo(CustomBarChart);
