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
   Utility: Number Formatter
   =========================== */
const numberFormatter = new Intl.NumberFormat("id-ID");

/* ===========================
   Custom Tooltip Component
   =========================== */
const ChartTooltip = React.memo(({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const { label, total } = payload[0].payload;
  const formattedTotal = useMemo(
    () => numberFormatter.format(total || 0),
    [total]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">
        Total:{" "}
        <span className="font-medium text-slate-900">{formattedTotal}</span>
      </p>
    </div>
  );
});

/* ===========================
   Main Component
   =========================== */
const CustomGraphChart = ({
  id,
  data = [],
  height = 288,
  className = "",
  showLegend = true,
}) => {
  // Normalisasi data
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        label: String(item?.label ?? ""),
        total: Number(item?.total ?? 0),
      })),
    [data]
  );

  // Batasi animasi agar ringan
  const enableAnimation = chartData.length <= 60;

  return (
    <figure
      id={id}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      aria-label="Grafik garis tren progres"
    >
      {chartData.length === 0 ? (
        <div className="h-72 grid place-items-center text-sm text-slate-500">
          Tidak ada data grafik
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
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

            {showLegend && (
              <Legend
                verticalAlign="top"
                height={24}
                wrapperStyle={{ paddingBottom: "8px" }}
              />
            )}

            <Tooltip content={<ChartTooltip />} />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#8D51FF"
              strokeWidth={2.25}
              dot={{ r: 3, fill: "#8D51FF" }}
              activeDot={{ r: 5, fill: "#8D51FF" }}
              isAnimationActive={enableAnimation}
              name="Permohonan"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
};

export default React.memo(CustomGraphChart);
