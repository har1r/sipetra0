import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import UserContext from "./UserContexts";

const USER_CACHE_KEY = "user:profile";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastTokenRef = useRef(localStorage.getItem("token"));

  /* Clear User & Storage */
  const clearUser = useCallback((reason = null) => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem(USER_CACHE_KEY);
    lastTokenRef.current = null;
    if (reason && process.env.NODE_ENV === "development") {
      console.warn("User cleared:", reason);
    }
  }, []);

  /* Update User (Internal & Manual) */
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    const normalizedUser = userData.user ?? userData;

    setUser(normalizedUser);
    try {
      sessionStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({
          data: normalizedUser,
          time_series: Date.now(),
        }),
      );
    } catch (eror) {
      console.error("Failed to cache user session", e);
    }
  }, []);

  /* Refresh Profile dari API */
  const refreshUser = useCallback(
    async (signal) => {
      const token = localStorage.getItem("token");
      if (!token) {
        clearUser("Token not found");
        return null;
      }

      try {
        const res = await axiosInstance.get(API_PATHS.AUTH.GET_USER_PROFILE, {
          signal,
        });
        const profile = res?.data?.user;

        if (!profile) throw new Error("Invalid profile data");

        updateUser(profile);
        return profile;
      } catch (error) {
        if (axiosInstance.isCancel(error)) return null;

        if (error?.response?.status === 401) {
          clearUser("Session expired");
        } else {
          console.error("❌ Failed to fetch user profile:", error);
        }
        return null;
      }
    },
    [clearUser, updateUser],
  );

  /* Initialization & Tab Sync */
  useEffect(() => {
    const ctrl = new AbortController();

    const initAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Tampilkan data dari cache sessionStorage (Instant UI)
      const cached = sessionStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.data) setUser(parsed.data);
        } catch (e) {
          sessionStorage.removeItem(USER_CACHE_KEY);
        }
      }

      // 2. Validasi data ke server (Background Refresh)
      await refreshUser(ctrl.signal);
      setLoading(false);
    };

    initAuth();

    // Sinkronisasi antar-tab yang lebih efisien
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        const newToken = e.newValue;

        // Hanya bertindak jika token benar-benar berubah (mencegah loop)
        if (newToken !== lastTokenRef.current) {
          lastTokenRef.current = newToken;
          if (!newToken) {
            clearUser("Logged out from another tab");
          } else {
            refreshUser(); // Ambil profil user baru yang login di tab lain
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      ctrl.abort();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [clearUser, refreshUser]);

  /* Context Value */
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      updateUser,
      clearUser,
      refreshUser,
      isAuthenticated: !!user, // Tambahan helper agar di UI lebih mudah cek status
    }),
    [user, loading, updateUser, clearUser, refreshUser],
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export default UserProvider;
