"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type User = { email: string } | null;

type AuthContextType = {
  user: User;
  signIn: (email: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("ap_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const signIn = (email: string) => {
    const u = { email };
    setUser(u);
    if (typeof window !== "undefined") window.localStorage.setItem("ap_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    if (typeof window !== "undefined") window.localStorage.removeItem("ap_user");
  };

  const value = useMemo(() => ({ user, signIn, signOut }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


