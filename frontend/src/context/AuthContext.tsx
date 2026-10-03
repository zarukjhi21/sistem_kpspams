"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DemoUser, DEMO_USERS, DEMO_KPSPAMS_LIST } from "@/lib/demo-data";

interface AuthContextType {
  user: DemoUser | null;
  activeKpspamsId: number | null; // null = Konsolidasi Seluruh Desa Kuajang
  activeKpspamsName: string;
  isDesaLevel: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchKpspamsContext: (id: number | null) => void;
  switchUserPersona: (userId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default logged in user: Operator TI Desa Kuajang (Admin Desa)
  const [user, setUser] = useState<DemoUser | null>(DEMO_USERS[1]);
  const [activeKpspamsId, setActiveKpspamsId] = useState<number | null>(null);

  // Sync user state from localStorage if available
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      login("admin.desa", "Kuajang2026!");
    }

    const savedUserJson = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
        if (parsed.kpspamsId !== null && parsed.kpspamsId !== undefined) {
          setActiveKpspamsId(parsed.kpspamsId);
        }
        return;
      } catch {
        // invalid json, fallback
      }
    }

    const savedUserId = localStorage.getItem("demo_user_id");
    if (savedUserId) {
      const found = DEMO_USERS.find((u) => u.id === Number(savedUserId));
      if (found) {
        setUser(found);
        if (found.kpspamsId !== null) {
          setActiveKpspamsId(found.kpspamsId);
        }
      }
    }
  }, []);

  const isDesaLevel = user?.role === "admin_desa" || user?.role === "pemerintah_desa" || user?.role === "super_admin";

  const getActiveKpspamsName = (): string => {
    if (activeKpspamsId === null) {
      return "Konsolidasi Seluruh Desa Kuajang (3 KPSPAMS)";
    }
    const found = DEMO_KPSPAMS_LIST.find((k) => k.id === activeKpspamsId);
    return found ? found.name : "KPSPAMS Terpilih";
  };

  const login = async (username: string, password: string = "Kuajang2026!"): Promise<boolean> => {
    // 1. Coba otentikasi utama melalui REST API Backend resmi
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.access_token && json.data?.user) {
          const apiUser = json.data.user;
          const roleName = (apiUser.roles?.[0] as DemoUser['role']) || "admin_desa";
          const roleLabel = apiUser.role_labels?.[0] || "Operator SI-KPSPAMS";

          const mappedUser: DemoUser = {
            id: apiUser.id,
            username: apiUser.username,
            name: apiUser.name,
            role: roleName,
            roleLabel: roleLabel,
            kpspamsId: apiUser.kpspams_id ?? null,
            kpspamsName: apiUser.kpspams_name ?? null,
            phone: apiUser.phone || "",
          };

          setUser(mappedUser);
          setActiveKpspamsId(mappedUser.kpspamsId);
          localStorage.setItem("auth_token", json.data.access_token);
          localStorage.setItem("auth_user", JSON.stringify(mappedUser));
          localStorage.setItem("demo_user_id", String(mappedUser.id));
          return true;
        }
      }
    } catch {
      // Backend offline atau jaringan lokal, beralih ke fallback demo offline
    }

    // 2. Fallback offline persona demo
    const found = DEMO_USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem("demo_user_id", String(found.id));
      localStorage.setItem("auth_user", JSON.stringify(found));
      if (found.kpspamsId !== null) {
        setActiveKpspamsId(found.kpspamsId);
      } else {
        setActiveKpspamsId(null);
      }
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem("demo_user_id");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("kpspams_context_id");
    setUser(null);
    window.location.href = "/login";
  };

  const switchKpspamsContext = (id: number | null) => {
    // Only desa-level users can switch to global or other KPSPAMS
    if (isDesaLevel) {
      setActiveKpspamsId(id);
      localStorage.setItem("kpspams_context_id", id ? String(id) : "");
    } else if (user?.kpspamsId) {
      // Locked to own KPSPAMS
      setActiveKpspamsId(user.kpspamsId);
    }
  };

  const switchUserPersona = async (userId: number) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem("demo_user_id", String(found.id));
      if (found.kpspamsId !== null) {
        setActiveKpspamsId(found.kpspamsId);
        localStorage.setItem("kpspams_context_id", String(found.kpspamsId));
      } else {
        setActiveKpspamsId(null);
        localStorage.removeItem("kpspams_context_id");
      }
      await login(found.username, "Kuajang2026!");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeKpspamsId,
        activeKpspamsName: getActiveKpspamsName(),
        isDesaLevel: !!isDesaLevel,
        login,
        logout,
        switchKpspamsContext,
        switchUserPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
