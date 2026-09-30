import React, { useMemo } from "react";
import {
  HiOutlineCollection,
  HiOutlineDocumentDuplicate,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlinePencilAlt,
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineDocument,
} from "react-icons/hi";

// Color & icon mapping helper for service types
const SERVICE_THEMES = {
  "Mutasi Sebagian": {
    icon: HiOutlineDocumentDuplicate,
    accent: "text-amber-600",
    bgAccent: "bg-amber-500/10",
    border: "border-amber-200/60 hover:border-amber-400",
    badge: "bg-amber-500 text-white",
  },
  "Mutasi Habis Reguler": {
    icon: HiOutlineDocumentText,
    accent: "text-blue-600",
    bgAccent: "bg-blue-500/10",
    border: "border-blue-200/60 hover:border-blue-400",
    badge: "bg-blue-500 text-white",
  },
  "Mutasi Habis Update": {
    icon: HiOutlineRefresh,
    accent: "text-indigo-600",
    bgAccent: "bg-indigo-500/10",
    border: "border-indigo-200/60 hover:border-indigo-400",
    badge: "bg-indigo-500 text-white",
  },
  "Pembetulan": {
    icon: HiOutlinePencilAlt,
    accent: "text-purple-600",
    bgAccent: "bg-purple-500/10",
    border: "border-purple-200/60 hover:border-purple-400",
    badge: "bg-purple-500 text-white",
  },
  "Objek Pajak Baru": {
    icon: HiOutlinePlusCircle,
    accent: "text-emerald-600",
    bgAccent: "bg-emerald-500/10",
    border: "border-emerald-200/60 hover:border-emerald-400",
    badge: "bg-emerald-500 text-white",
  },
  "Pengaktifan": {
    icon: HiOutlineCheckCircle,
    accent: "text-cyan-600",
    bgAccent: "bg-cyan-500/10",
    border: "border-cyan-200/60 hover:border-cyan-400",
    badge: "bg-cyan-500 text-white",
  },
};

const DEFAULT_THEME = {
  icon: HiOutlineDocument,
  accent: "text-slate-600",
  bgAccent: "bg-slate-500/10",
  border: "border-slate-200/60 hover:border-slate-400",
  badge: "bg-slate-600 text-white",
};

const ReportKpiStats = ({ kpiStats, isLoading }) => {
  const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const format = (val) => numberFormatter.format(val ?? 0);

  const summary = kpiStats?.summary || { totalPecahan: 0, totalPermohonan: 0 };
  const byServiceType = kpiStats?.byServiceType || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-slate-100 rounded-xl" />
                <div className="w-12 h-4 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-7 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Statistik Objek Pecahan (Sudah Ada Surat Pengantar)
          </h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
          Metrik Berdasarkan Jumlah Pecahan
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* TOTAL RINGKASAN CARD */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
          
          <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <HiOutlineCollection className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                Total
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Semua Layanan
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black tracking-tight text-white">
                  {format(summary.totalPecahan)}
                </span>
                <span className="text-[10px] font-bold text-indigo-200">
                  Pecahan
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {format(summary.totalPermohonan)} berkas permohonan
              </p>
            </div>
          </div>
        </div>

        {/* PER JENIS LAYANAN CARD */}
        {byServiceType.map((item) => {
          const theme = SERVICE_THEMES[item.serviceType] || DEFAULT_THEME;
          const Icon = theme.icon;

          return (
            <div
              key={item.serviceType}
              className={`group bg-white rounded-2xl p-5 border ${theme.border} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${theme.bgAccent}`}>
                  <Icon className={`w-5 h-5 ${theme.accent}`} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {format(item.totalPermohonan)} Berkas
                </span>
              </div>

              <div>
                <h3
                  className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-1 group-hover:text-slate-900 transition-colors"
                  title={item.serviceType}
                >
                  {item.serviceType}
                </h3>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className={`text-2xl font-black tracking-tight ${theme.accent}`}>
                    {format(item.totalPecahan)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Pecahan
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ReportKpiStats);
