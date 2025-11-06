import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white p-6">
      <div
        className="
          flex flex-col md:flex-row
          w-full max-w-6xl
          min-h-[650px] md:min-h-[700px]
          rounded-3xl overflow-hidden
          shadow-2xl bg-white
        "
      >
        {/* === Panel kiri: langit malam berbintang === */}
        <div className="relative md:w-1/2 w-full bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#312e81] text-white flex flex-col justify-center items-center p-10">
          {/* ✨ Lapisan bintang halus */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-full bg-[radial-gradient(white_1px,transparent_1px)] [background-size:3px_3px] opacity-20 animate-twinkle"></div>
            <div className="absolute w-full h-full bg-[radial-gradient(white_1px,transparent_1px)] [background-size:150px_150px] opacity-10 blur-sm animate-twinkle-slow"></div>
          </div>

          {/* 🌌 Konten teks */}
          <div className="relative z-10 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-wide">
              Selamat Datang Ke <span className="text-blue-300">SIPETRA</span>
            </h1>
            <p className="text-sm text-slate-200/80 max-w-sm mx-auto">
              Sistem Informasi Pelayanan - Efektif, Terpantau, dan Rapi.
            </p>
          </div>
        </div>

        {/* === Panel kanan: form === */}
        <div
          className="
            w-full md:w-1/2
            bg-white flex flex-col justify-center
            px-8 md:px-12 py-12
            overflow-y-auto
            scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent
          "
        >
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

// import React, { useId } from "react";
// import UI_IMG from "../../assets/images/auth-img.png";

// /**
//  * AuthLayout (no page scroll, footer always visible)
//  * - Halaman dikunci setinggi viewport: h-screen + overflow-hidden.
//  * - Panel kiri: header (hidden), content scrollable, footer fixed (selalu terlihat).
//  * - Panel ilustrasi: nuansa indigo + brand lockup "PETRA" yang tegas & profesional.
//  */
// const AuthLayout = ({ children, title = "Task Manager", subtitle = "" }) => {
//   const formRegionId = useId();
//   const artRegionId = useId();

//   return (
//     <div className="relative h-screen w-full overflow-x-hidden bg-gradient-to-br from-indigo-50 via-white to-slate-50">
//       {/* Decorative blobs */}
//       <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-200/70 opacity-60 blur-3xl" />
//       <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-100/80 opacity-60 blur-3xl" />

//       {/* Grid container full height */}
//       <div className="mx-auto grid h-full max-w-7xl grid-cols-1 md:grid-cols-5 gap-0 md:gap-6 px-4 sm:px-6 md:px-8 py-6">
//         {/* Form Panel (header hidden, content scrollable, footer fixed) */}
//         <section
//           id={formRegionId}
//           aria-label="Form autentikasi"
//           className="order-2 md:order-1 md:col-span-3 flex h-full"
//         >
//           {/* Penting: min-h-0 agar child overflow bisa bekerja dengan baik */}
//           <div className="flex min-h-0 w-full flex-col">
//             {/* Header disembunyikan untuk hemat ruang */}
//             <header className="sr-only mb-4">
//               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
//                 {title}
//               </h1>
//               {subtitle ? (
//                 <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
//               ) : null}
//             </header>

//             {/* Content scrollable: hanya area ini yang scroll jika form tinggi */}
//             <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
//               <div className="p-5 sm:p-6 md:p-8">{children}</div>
//             </div>

//             {/* Footer selalu terlihat */}
//             <footer className="mt-4 flex-none text-[12px] text-slate-500">
//               © {new Date().getFullYear()} Sipetra. All rights reserved.
//             </footer>
//           </div>
//         </section>

//         {/* Illustration Panel (brand indigo + SIPETRA lockup) */}
//         <aside
//           id={artRegionId}
//           aria-label="Ilustrasi aplikasi"
//           className="order-1 md:order-2 md:col-span-2 hidden md:flex h-full"
//         >
//           <div className="relative flex h-full w-full items-center justify-center">
//             <div className="relative flex w-full flex-col items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 shadow-sm">
//               {/* Subtle glow */}
//               <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-400/30 via-transparent to-transparent" />

//               {/* Brand Lockup */}
//               <div className="mb-5 flex flex-col items-center">
//                 {/* Teks SIPETRA yang eye-catching */}
//                 <h2
//                   className="text-3xl font-extrabold uppercase tracking-[0.2em] bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
//                   aria-label="PETRA"
//                 >
//                   SIPETRA
//                 </h2>

//                 {/* Divider halus */}
//                 <div className="mt-2 h-px w-28 bg-gradient-to-r from-transparent via-indigo-200/70 to-transparent" />

//                 {/* Tagline */}
//                 <p className="mt-2 text-sm text-indigo-100/90 text-center">
//                   Sistem Informasi Pelayanan Efektif Terpantau dan Rapi
//                 </p>

//                 {/* Badge kecil opsional */}
//                 <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-indigo-50 ring-1 ring-white/20">
//                   <svg
//                     className="h-3.5 w-3.5"
//                     viewBox="0 0 24 24"
//                     fill="currentColor"
//                     aria-hidden="true"
//                   >
//                     <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z" />
//                   </svg>
//                   Terintegrasi & Transparan
//                 </span>
//               </div>

//               {/* Ilustrasi */}
//               <img
//                 src={UI_IMG}
//                 alt="Ilustrasi aplikasi SIPETRA"
//                 className="mx-auto max-h-[420px] w-full max-w-md object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
//                 loading="lazy"
//               />
//             </div>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// };

// export default AuthLayout;
