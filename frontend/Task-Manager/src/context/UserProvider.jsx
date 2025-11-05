import { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import UserContext from "./UserContexts";

const USER_CACHE_KEY = "user:profile";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
   * 🧩 1. Hapus data user dari state dan storage
   * ========================================================== */
  const clearUser = useCallback((reason = null) => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem(USER_CACHE_KEY);
    if (reason) console.warn("User cleared:", reason);
  }, []);

  /* ==========================================================
   * 🧩 2. Update user + simpan ke cache sessionStorage
   * ========================================================== */
  const updateUser = useCallback((userData) => {
    if (!userData) return;

    // 🧠 Normalisasi agar format selalu konsisten
    const normalizedUser = userData.user ?? userData;

    setUser(normalizedUser);
    sessionStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({
        data: normalizedUser,
        time_series: Date.now(),
      })
    );
  }, []);

  /* ==========================================================
   * 🧩 3. Ambil profil user dari backend
   * ========================================================== */
  const refreshUser = useCallback(
    async (signal) => {
      const token = localStorage.getItem("token");
      if (!token) {
        clearUser("Token tidak ditemukan");
        return null;
      }

      try {
        const res = await axiosInstance.get(API_PATHS.AUTH.GET_USER_PROFILE, {
          signal,
        });

        // ✅ Struktur respons backend:
        // { message, user: { id, name, email, role, createdAt, updatedAt } }
        const profile = res?.data?.user;

        if (!profile) {
          clearUser("Data profil tidak valid");
          return null;
        }

        // Simpan user ke state & cache
        setUser(profile);
        sessionStorage.setItem(
          USER_CACHE_KEY,
          JSON.stringify({ data: profile, time_series: Date.now() })
        );

        return profile;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED")
          return null;

        // Token tidak valid atau kedaluwarsa
        if (error?.response?.status === 401) {
          clearUser("Token tidak valid atau kedaluwarsa");
        } else {
          console.error("❌ Gagal memuat profil user:", error);
        }
        return null;
      }
    },
    [clearUser]
  );

  /* ==========================================================
   * 🧩 4. Jalankan saat aplikasi pertama kali dibuka
   * ========================================================== */
  useEffect(() => {
    const ctrl = new AbortController();

    const bootstrap = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      // 💨 Gunakan cache sementara agar UI tidak flicker
      const cachedProfile = sessionStorage.getItem(USER_CACHE_KEY);
      if (cachedProfile) {
        const cached = JSON.parse(cachedProfile);
        if (cached?.data) setUser(cached.data);
      }

      // Tunggu refresh selesai baru matikan loading
      await refreshUser(ctrl.signal);
      setLoading(false);
    };

    bootstrap();

    // 🪄 Sinkronisasi antar-tab
    const onStorage = (e) => {
      if (e.key === "token") {
        const hasToken = !!localStorage.getItem("token");
        if (!hasToken) clearUser("Token dihapus dari tab lain");
        else refreshUser(ctrl.signal);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      ctrl.abort();
      window.removeEventListener("storage", onStorage);
    };
  }, [clearUser, refreshUser]);

  /* ==========================================================
   * 🧩 5. Memoized context value agar efisien
   * ========================================================== */
  const value = useMemo(
    () => ({
      user,
      loading,
      updateUser,
      clearUser,
      refreshUser,
    }),
    [user, loading, updateUser, clearUser, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
