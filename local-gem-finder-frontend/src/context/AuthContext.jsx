// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get("/api/profile/my-profile")
      .then(res => {
        // backend may return { user: ... } or direct user; handle both
        setUser(res.user || res);
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("token");
        setToken("");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const t = res.token;
    if (!t) throw new Error("No token returned");
    localStorage.setItem("token", t);
    setToken(t);
    // fetch profile
    const profile = await api.get("/api/profile/my-profile");
    setUser(profile.user || profile);
  };

  const signup = async (name, email, password) => {
    const res = await api.post("/api/auth/signup", { name, email, password });
    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
