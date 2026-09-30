import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ⚙️ Konfigurasi lengkap dan optimal untuk proyek React modern
export default defineConfig({
  plugins: [
    // 🔹 Dukungan JSX, Fast Refresh, dsb
    react(),

    // 🔹 Integrasi langsung TailwindCSS tanpa perlu postcss.config.js
    tailwindcss(),
  ],

  // 🚀 Optimisasi dependency agar Vite gak nge-cache versi lama
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "react-icons",
      "axios",
      "react-hot-toast",
    ],
  },

  // 🧩 Build config (untuk hasil produksi yang bersih dan cepat)
  build: {
    outDir: "dist",
    sourcemap: false, // ubah ke true jika ingin debug di production
    chunkSizeWarningLimit: 1000, // mencegah warning bundle besar
  },

  // 🌐 Server dev config
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: false,
    strictPort: true,
    cors: true,
    allowedHosts: true,

    hmr: {
      overlay: true,
    },
  },

  // ⚠️ Resolusi path (opsional, buat import lebih rapi)
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
