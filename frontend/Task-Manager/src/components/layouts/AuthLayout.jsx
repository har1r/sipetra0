import React, { useMemo } from "react";
import { FaLeaf } from "react-icons/fa6";

const AuthLayout = ({ children }) => {
  // Gunakan useMemo agar posisi daun tidak berubah-ubah saat re-render form
  const leaves = useMemo(
    () =>
      [...Array(8)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${10 + Math.random() * 10}s`,
        size: Math.random() * 20 + 15,
        rotation: Math.random() * 360,
      })),
    [],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 md:p-6 relative overflow-hidden font-sans">
      {/* 🍃 Background Elements: Subtle & Elegant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/50 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-lime-100/50 blur-[120px] rounded-full" />

        {/* Floating Leaves */}
        {leaves.map((leaf) => (
          <FaLeaf
            key={leaf.id}
            className="absolute text-emerald-600/10 animate-pulse"
            style={{
              left: leaf.left,
              top: "-10%",
              fontSize: `${leaf.size}px`,
              animation: `fall ${leaf.duration} linear infinite`,
              animationDelay: leaf.delay,
              transform: `rotate(${leaf.rotation}deg)`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 w-full max-w-[1100px] flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] overflow-hidden border border-white/40">
        {/* === Left Panel: Brand Experience === */}
        <section className="relative w-full md:w-[45%] bg-[#064e3b] overflow-hidden flex flex-col justify-between p-10 md:p-14">
          {/* Decorative Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <div className="p-2 bg-emerald-400 rounded-lg">
                <FaLeaf className="text-emerald-950 text-xl" />
              </div>
              <span className="font-bold text-xl tracking-wider text-white">
                SIPETRA
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-6">
              Kelola <span className="text-emerald-400">Pelayanan</span> Dengan
              Harmoni.
            </h1>
            <p className="text-emerald-100/80 text-lg leading-relaxed max-w-[280px]">
              Sistem Informasi Pelayanan — Efektif, Terpantau, dan Rapi.
            </p>
          </div>

          <div className="relative z-10 mt-auto pt-10 border-t border-emerald-800">
            <p className="text-xs text-emerald-300/60 uppercase tracking-[0.2em]">
              MUFTI HARIR &copy; 2026
            </p>
          </div>
        </section>

        {/* === Right Panel: Form Area === */}
        <section className="w-full md:w-[55%] bg-white p-8 md:p-16 flex flex-col justify-center relative">
          {/* Subtle decoration for mobile */}
          <div className="md:hidden absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-lime-400" />

          <div className="w-full max-w-sm mx-auto">{children}</div>
        </section>
      </main>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
