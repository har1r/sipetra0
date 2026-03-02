import React, { useMemo } from "react";

const InfoCard = ({ item }) => {
  const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const format = (val) => numberFormatter.format(val ?? 0);

  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-[2rem] border border-emerald-100/50 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500">
      
      {/* HEADER CARD - Ukuran lebih compact */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-4 flex justify-between items-center relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
        
        <div className="relative z-10">
          <h2 className="text-white font-black uppercase tracking-[0.15em] text-[10px] opacity-70 mb-0.5">
            Layanan
          </h2>
          <p className="text-white font-bold text-base leading-tight">
            {item.title}
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-inner">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-emerald-100 font-bold uppercase tracking-wider opacity-80">Total</span>
            <span className="text-white text-lg font-black leading-none">
              {format(item.total)}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT STATS - Angka dikecilkan (3xl -> xl/2xl) */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
        
        {/* Revisi */}
        <div className="flex flex-col space-y-1 border-r border-emerald-50/50 last:border-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Revisi</span>
          </div>
          <span className="text-xl font-black text-emerald-950 tracking-tight leading-none">
            {format(item.revisi)}
          </span>
        </div>

        {/* Ditolak */}
        <div className="flex flex-col space-y-1 border-r border-emerald-50/50 last:border-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ditolak</span>
          </div>
          <span className="text-xl font-black text-emerald-950 tracking-tight leading-none">
            {format(item.rejected)}
          </span>
        </div>

        {/* Selesai */}
        <div className="flex flex-col space-y-1 border-r border-emerald-50/50 last:border-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.4)]" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selesai</span>
          </div>
          <span className="text-xl font-black text-emerald-950 tracking-tight leading-none">
            {format(item.selesai)}
          </span>
        </div>

        {/* Dikirim */}
        <div className="flex flex-col space-y-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dikirim</span>
          </div>
          <span className="text-xl font-black text-emerald-950 tracking-tight leading-none">
            {format(item.diperiksa)}
          </span>
        </div>

      </div>
    </div>
  );
};

export default React.memo(InfoCard);