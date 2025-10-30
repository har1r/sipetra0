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

const NF_ID = new Intl.NumberFormat("id-ID");

// Tooltip co-located, sama gaya dan struktur dengan CustomBarChart
const TooltipContent = React.memo(function TooltipContent({ active, payload }) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const datum = payload[0]?.payload ?? {};
  const rawLabel = datum.label ?? payload[0]?.name ?? "";
  const rawTotal = datum.total ?? payload[0]?.value ?? 0;

  const label = rawLabel;
  const total = useMemo(
    () => NF_ID.format(Number.isFinite(rawTotal) ? rawTotal : 0),
    [rawTotal]
  );

  return (
    <div
      role="tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
    >
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

const CustomGraphChart = ({
  id,
  data = [],
  height = 288,
  className = "",
  showLegend = true,
}) => {
  // Normalisasi data agar tidak error
  const normalized = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((d) => ({
        label: String(d?.label ?? ""),
        total: Number.isFinite(d?.total) ? Number(d.total) : 0,
      })),
    [data]
  );

  // Animasi dimatikan kalau datanya terlalu banyak
  const isAnimated = normalized.length <= 60;

  return (
    <figure
      id={id}
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      role="group"
      aria-label="Grafik garis"
    >
      <figcaption className="mb-2 text-sm font-semibold text-slate-700">
        Tren Progres
      </figcaption>

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
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
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

            <Tooltip content={<TooltipContent />} />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#8D51FF"
              strokeWidth={2.25}
              dot={{ r: 3, fill: "#8D51FF" }}
              activeDot={{ r: 5, fill: "#8D51FF" }}
              isAnimationActive={isAnimated}
              name="Total Tasks"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
};

export default React.memo(CustomGraphChart);
