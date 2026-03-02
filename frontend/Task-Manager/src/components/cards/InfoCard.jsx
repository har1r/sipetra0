import React, { useMemo } from "react";

const InfoCard = ({ item }) => {
  const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  const format = (val) => numberFormatter.format(val ?? 0);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-emerald-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 flex justify-between items-center">
        <h2 className="text-white font-bold uppercase tracking-wider text-sm md:text-base">
          {item.title}
        </h2>
        <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full border border-white/30">
          <span className="text-white text-xs font-medium">
            Total: {format(item.total)}
          </span>
        </div>
      </div>

      {/* Grid Isi Statistik */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Konten 1: Revisi */}
        <div className="flex flex-col border-r border-emerald-50 last:border-0 px-2">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
            Revisi
          </span>
          <span className="text-2xl font-black text-emerald-950">
            {format(item.revisi)}
          </span>
        </div>

        {/* Konten 2: Rejected */}
        <div className="flex flex-col border-r border-emerald-50 last:border-0 px-2">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
            Ditolak
          </span>
          <span className="text-2xl font-black text-emerald-950">
            {format(item.rejected)}
          </span>
        </div>

        {/* Konten 3: Selesai */}
        <div className="flex flex-col border-r border-emerald-50 last:border-0 px-2">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            Selesai
          </span>
          <span className="text-2xl font-black text-emerald-950">
            {format(item.selesai)}
          </span>
        </div>

        {/* Konten 4: Dikirim */}
        <div className="flex flex-col px-2">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
            Dikirim
          </span>
          <span className="text-2xl font-black text-emerald-950">
            {format(item.diperiksa)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InfoCard);
