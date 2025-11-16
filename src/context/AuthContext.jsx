import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("auth:user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("auth:token");
    } catch {
      return null;
    }
  });

  const login = useCallback(async (usuario, password) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: { usuario, password },
    });

    setUser(data.user);
    setToken(data.token);
    try {
      localStorage.setItem("auth:user", JSON.stringify(data.user));
      localStorage.setItem("auth:token", data.token);
    } catch {
      // ignore
    }
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("auth:user");
      localStorage.removeItem("auth:token");
    } catch {
      // ignore
    }
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return ctx;
}
