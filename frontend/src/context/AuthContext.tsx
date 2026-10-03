"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DemoUser, DEMO_USERS, DEMO_KPSPAMS_LIST } from "@/lib/demo-data";
import { getApiBaseUrl } from "@/lib/api-client";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default logged in user: null atau load dari session
  const [user, setUser] = useState<DemoUser | null>(DEMO_USERS[1]);
  const [activeKpspamsId, setActiveKpspamsId] = useState<number | null>(1);

  // Sync user state from localStorage if available
  useEffect(() => {
    const savedUserJson = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    if (savedUserJson) {
      try {
        const parsed = JSON.parse(savedUserJson);
        const kId = parsed.kpspamsId !== null && parsed.kpspamsId !== undefined ? Number(parsed.kpspamsId) : null;
        parsed.kpspamsId = kId;
        setUser(parsed);
        if (kId !== null) {
          setActiveKpspamsId(kId);
        } else {
          setActiveKpspamsId(1); // default Lemo Baru
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
          setActiveKpspamsId(Number(found.kpspamsId));
        } else {
          setActiveKpspamsId(1);
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
    const baseUrl = getApiBaseUrl();
    // 1. Coba otentikasi utama melalui REST API Backend resmi
    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const json = await res.json();
        const token = json.data?.token || json.data?.access_token;
        if (token && json.data?.user) {
          const apiUser = json.data.user;
          const roleName = (apiUser.role || apiUser.roles?.[0] || "admin_desa") as DemoUser['role'];
          const roleLabel = apiUser.role_display || apiUser.role_labels?.[0] || "Petugas";
          const kId = apiUser.kpspams_id !== null && apiUser.kpspams_id !== undefined ? Number(apiUser.kpspams_id) : null;

          const mappedUser: DemoUser = {
            id: apiUser.id,
            username: apiUser.username,
            name: apiUser.name,
            role: roleName,
            roleLabel: roleLabel,
            kpspamsId: kId,
            kpspamsName: apiUser.kpspams_name ?? (kId === 1 ? "KPSPAMS Lemo Baru" : null),
            phone: apiUser.phone || "",
          };

          setUser(mappedUser);
          setActiveKpspamsId(mappedUser.kpspamsId ?? 1);
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(mappedUser));
          localStorage.setItem("demo_user_id", String(mappedUser.id));
          if (mappedUser.kpspamsId) {
            localStorage.setItem("kpspams_context_id", String(mappedUser.kpspamsId));
          }
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
        setActiveKpspamsId(Number(found.kpspamsId));
        localStorage.setItem("kpspams_context_id", String(found.kpspamsId));
      } else {
        setActiveKpspamsId(1);
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
    // KPSPAMS Lemo Tua (2) dan Sarampu 1 (3) dinonaktifkan sementara
    if (id === 2 || id === 3) {
      setActiveKpspamsId(1);
      return;
    }
    // Only desa-level users can switch to global or other KPSPAMS
    if (isDesaLevel) {
      setActiveKpspamsId(id ?? 1);
      localStorage.setItem("kpspams_context_id", id ? String(id) : "1");
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
