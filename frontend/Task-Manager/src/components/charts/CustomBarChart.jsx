// Styled CustomBarChart - harmonized with InfoCard & Dashboard theme
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

const BAR_COLORS = ["#34D399", "#10B981", "#6EE7B7", "#A7F3D0", "#059669"]; // emerald/lime theme
const NUMBER_FORMATTER = new Intl.NumberFormat("id-ID");

const truncateLabel = (text = "", maxLength = 24) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

const TooltipContent = React.memo(({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const title = dataPoint.title || payload[0]?.name || "";
  const count = NUMBER_FORMATTER.format(
    Number.isFinite(dataPoint.count) ? dataPoint.count : 0
  );

  return (
    <div className="rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-md px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-emerald-700">{title}</p>
      <p className="text-xs text-slate-700">
        Total: <span className="font-bold text-emerald-800">{count}</span>
      </p>
    </div>
  );
});

const CustomBarChart = ({
  id,
  data = [],
  height = 320,
  colors = BAR_COLORS,
  showLegend = false,
  maxLabelLength = 20,
  className = "",
}) => {
  const normalizedData = useMemo(
    () =>
      data.map((item) => ({
        title: String(item?.label ?? ""),
        count: Number.isFinite(item?.count) ? Number(item.count) : 0,
      })),
    [data]
  );

  const enableAnimation = normalizedData.length <= 30;
  const formatXAxisLabel = (label) => truncateLabel(label, maxLabelLength);

  return (
    <figure
      id={id}
      role="group"
      aria-label="Diagram batang"
      className={`rounded-3xl border border-emerald-200/50 bg-white/70 backdrop-blur-sm p-6 shadow-md hover:shadow-xl transition-all duration-200 ${className}`}
    >
      {showLegend && (
        <figcaption className="mb-4 text-sm font-semibold text-emerald-700 tracking-wide">
          Distribusi Data
        </figcaption>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={normalizedData}
          barCategoryGap={24}
          margin={{ top: 10, right: 10, left: 0, bottom: 32 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#D1FAE5"
          />

          <XAxis
            dataKey="title"
            tick={{ fontSize: 12, fill: "#065F46" }}
            tickFormatter={formatXAxisLabel}
            stroke="none"
            angle={-30}
            textAnchor="end"
            height={60}
          />

          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#065F46" }}
            stroke="none"
          />

          {showLegend && <Legend verticalAlign="top" height={28} />}

          <Tooltip content={<TooltipContent />} />

          <Bar
            dataKey="count"
            radius={[10, 10, 0, 0]}
            isAnimationActive={enableAnimation}
          >
            {normalizedData.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
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

// // Warna lembut bergaya dashboard
// const BAR_COLORS = ["#6366F1", "#0EA5E9", "#22C55E", "#FACC15", "#EF4444"];
// const NUMBER_FORMATTER = new Intl.NumberFormat("id-ID");

// /** Memotong teks panjang agar rapi di label X-axis */
// const truncateLabel = (text = "", maxLength = 24) =>
//   text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

// /** Tooltip custom untuk chart */
// const TooltipContent = React.memo(({ active, payload }) => {
//   if (!active || !payload?.length) return null;

//   const dataPoint = payload[0]?.payload;
//   if (!dataPoint) return null;

//   const title = dataPoint.title || payload[0]?.name || "";
//   const count = NUMBER_FORMATTER.format(
//     Number.isFinite(dataPoint.count) ? dataPoint.count : 0
//   );

//   return (
//     <div
//       role="tooltip"
//       className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md"
//     >
//       <p className="text-sm font-medium text-slate-900">{title}</p>
//       <p className="text-xs text-slate-600">
//         Total: <span className="font-semibold text-slate-900">{count}</span>
//       </p>
//     </div>
//   );
// });

// /**
//  * CustomBarChart
//  * Props:
//  * - id?: string
//  * - data: Array<{ title: string, count: number }>
//  * - height?: number
//  * - colors?: string[]
//  * - showLegend?: boolean
//  * - maxLabelLength?: number
//  * - className?: string
//  */
// const CustomBarChart = ({
//   id,
//   data = [],
//   height = 320,
//   colors = BAR_COLORS,
//   showLegend = false,
//   maxLabelLength = 20,
//   className = "",
// }) => {
//   console.log("Rendering CustomBarChart with data:", data);
//   // Normalisasi data untuk mencegah error
//   const normalizedData = useMemo(
//     () =>
//       data.map((item) => ({
//         title: String(item?.label ?? ""),
//         count: Number.isFinite(item?.count) ? Number(item.count) : 0,
//       })),
//     [data]
//   );

//   const enableAnimation = normalizedData.length <= 30;
//   const formatXAxisLabel = (label) => truncateLabel(label, maxLabelLength);

//   return (
//     <figure
//       id={id}
//       role="group"
//       aria-label="Diagram batang"
//       className={`rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
//     >
//       {showLegend && (
//         <figcaption className="mb-3 text-sm font-medium text-slate-700">
//           Distribusi Data
//         </figcaption>
//       )}

//       <ResponsiveContainer width="100%" height={height}>
//         <BarChart
//           data={normalizedData}
//           barCategoryGap={24}
//           margin={{ top: 10, right: 10, left: 0, bottom: 32 }}
//         >
//           <CartesianGrid
//             strokeDasharray="3 3"
//             vertical={false}
//             stroke="#E2E8F0"
//           />
//           <XAxis
//             dataKey="title"
//             tick={{ fontSize: 12, fill: "#475569" }}
//             tickFormatter={formatXAxisLabel}
//             stroke="none"
//             angle={-30} // Membuat teks miring ke kiri 30 derajat
//             textAnchor="end" // Supaya posisi ujung teks sejajar dengan titik X
//             height={60}
//           />
//           <YAxis
//             allowDecimals={false}
//             tick={{ fontSize: 12, fill: "#475569" }}
//             stroke="none"
//           />
//           {showLegend && <Legend verticalAlign="top" height={28} />}
//           <Tooltip content={<TooltipContent />} />
//           <Bar
//             dataKey="count"
//             radius={[8, 8, 0, 0]}
//             isAnimationActive={enableAnimation}
//           >
//             {normalizedData.map((_, index) => (
//               <Cell key={index} fill={colors[index % colors.length]} />
//             ))}
//           </Bar>
//         </BarChart>
//       </ResponsiveContainer>
//     </figure>
//   );
// };

// export default React.memo(CustomBarChart);
