import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext();

const USER_CACHE_KEY = "user:profile";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //Logout user from application
  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem(USER_CACHE_KEY);
  }, []);

  //save also user into the sessionStorage so that there is still temporary cache.
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    setUser(userData);
    sessionStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({ data: userData, time_series: Date.now() })
    );
  }, []);

  // Application first get opened (check wether user is still logged in or not.
  // User refresh the page.
  // Need to verfiy new profile data from server.
  const refreshUser = useCallback(
    async (signal) => {
      const token = localStorage.getItem("token");
      if (!token) {
        clearUser();
        return null;
      }
      const response = await axiosInstance.get(
        API_PATHS.AUTH.GET_USER_PROFILE,
        {
          signal,
        }
      );
      const profile = response?.data ?? null;
      setUser(profile);
      try {
        sessionStorage.setItem(
          USER_CACHE_KEY,
          JSON.stringify({ data: profile, time_series: Date.now() })
        );
        return profile;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED")
          return null;
        if (error?.isUnauthorized || error?.response?.status === 401) {
          clearUser();
        }
        console.error("Gagal mendapatkan profil user:", error);
        return null;
      }
    },
    [clearUser]
  );

  useEffect(() => {
    const ctrl = new AbortController(); // Built-in JavaScript API that is used to cancel async operation, usually HTTP request.

    const bootstrap = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const cachedProfile = sessionStorage.getItem(USER_CACHE_KEY);
      if (cachedProfile) {
        const cached = JSON.parse(cachedProfile);
        if (cached?.data) setUser(cached.data);
      }

      await refreshUser(ctrl.signal);
      setLoading(false);
    };

    bootstrap();

    const onStorage = (e) => {
      if (e.key === "token") {
        const hasToken = !!localStorage.getItem("token"); // Mark !! dipakai untuk mengubah suatu nilai jadi boolean murni (true atau false).
        if (!hasToken) clearUser();
        else refreshUser(ctrl.signal);
      }
    };

    //storage adalah event bawaan browser yang dipicu ketika localStorage atau sessionStorage berubah di tab lain.
    window.addEventListener("storage", onStorage);

    return () => {
      ctrl.abort();
      window.removeEventListener("storage", onStorage); //logout di tab A → tab B juga auto logout.
    };
  }, [clearUser, refreshUser]);

  const value = useMemo(
    () => ({ user, loading, updateUser, clearUser, refreshUser }),
    [user, loading, updateUser, clearUser, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
