import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DashboardBarChart = ({ 
  data, 
  xKey = "subdistrict", 
  title = "Statistik Layanan" 
}) => {
  const { serviceTypes = [], chartData = [] } = data || {};
  const isScrollable = chartData.length > 10;

  const COLORS = ["#059669", "#1d4ed8", "#b45309", "#be123c", "#6d28d9", "#be185d"];

  return (
    // Responsive Padding: p-4 di mobile, p-8 di desktop
    <div className="w-full bg-slate-50/50 backdrop-blur-xl p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-inner overflow-hidden transition-all duration-500">
      
      {/* HEADER CHART - Stacked di mobile, Row di desktop */}
      <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {title}
          </h3>
          <p className="text-[9px] md:text-[11px] font-bold text-emerald-700 uppercase tracking-[0.1em] md:tracking-[0.15em] opacity-80">
            Distribusi per {xKey === "village" ? "Kelurahan" : "Kecamatan"}
          </p>
        </div>
        
        {isScrollable && (
          <div className="flex items-center self-start gap-2 bg-white/80 shadow-sm px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-slate-200">
            <span className="flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase">
              Geser untuk detail
            </span>
          </div>
        )}
      </div>

      {/* AREA CHART */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-2">
        {/* Lebar dinamis: di mobile lebih lebar per item agar teks tidak tumpang tindih */}
        <div style={{ 
          width: isScrollable ? `${chartData.length * (window.innerWidth < 768 ? 70 : 100)}px` : "100%", 
          minWidth: "100%" 
        }}>
          {/* Height dinamis: Lebih pendek di mobile (300px), lebih tinggi di desktop (450px) */}
          <div className="h-[320px] md:h-[450px] w-full bg-white/40 rounded-[1.2rem] md:rounded-[2rem] p-2 md:p-4 border border-white/60 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -20, bottom: 60 }}
                barGap={window.innerWidth < 768 ? 4 : 8}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey={xKey}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#1e293b", fontSize: window.innerWidth < 768 ? 9 : 11, fontWeight: 800 }}
                  interval={0} 
                  angle={isScrollable || window.innerWidth < 768 ? -45 : 0}
                  textAnchor={(isScrollable || window.innerWidth < 768) ? "end" : "middle"}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
                />
                <Tooltip 
                  cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
                  contentStyle={{ 
                    borderRadius: "16px", 
                    border: "1px solid #e2e8f0", 
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    padding: "8px 12px",
                    fontSize: "12px"
                  }}
                  itemStyle={{ padding: "2px 0" }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="center" 
                  iconType="rect" 
                  iconSize={10}
                  wrapperStyle={{ 
                    paddingBottom: window.innerWidth < 768 ? 20 : 40, 
                    fontSize: window.innerWidth < 768 ? "9px" : "11px", 
                    fontWeight: "700"
                  }}
                  formatter={(value) => <span className="text-slate-700 mx-1 md:mx-2">{value}</span>}
                />
                
                {serviceTypes.map((type, index) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    name={type}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    barSize={window.innerWidth < 768 ? 12 : 20}
                    animationDuration={1200}
                    animationBegin={index * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardBarChart);