import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "@/api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("herya_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      const u = data.data || data;
      setUser(u);
      localStorage.setItem("herya_user", JSON.stringify(u));
    } catch {
      setUser(null);
      localStorage.removeItem("herya_user");
      localStorage.removeItem("herya_token");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("herya_token");
    if (token) fetchMe();
    else setLoading(false);
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { token, user: u } = data.data || data;
    localStorage.setItem("herya_token", token);
    localStorage.setItem("herya_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    const { token, user: u } = data.data || data;
    localStorage.setItem("herya_token", token);
    localStorage.setItem("herya_user", JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem("herya_token");
    localStorage.removeItem("herya_user");
    setUser(null);
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
