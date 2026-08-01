'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getSession,
  logout as logoutService,
} from "./auth-service";

import { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  permissions: string[];
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const router = useRouter();

  const loadUser = useCallback(async () => {

    try {

      const session = getSession();

      console.log("SESSION =>", session);

      if (!session) {

        setLoading(false);

        return;

      }

      setAccessToken(session.accessToken);

      console.log("Calling /auth/me");

      const me = await getCurrentUser();

      console.log("ME =>", me);

      setUser(me);

    } catch (e) {

      console.error("AUTH ERROR", e);

      await logoutService();

      setUser(null);

      setAccessToken(null);

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadUser();

  }, [loadUser]);

  const refreshUser = async () => {

    await loadUser();

  };

  const logout = useCallback(async () => {

    await logoutService();

    setUser(null);

    setAccessToken(null);

    router.replace("/login");

  }, [router]);

  return (

    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        permissions: user?.permissions ?? [],
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>

  );

}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {

    throw new Error("useAuth must be used inside AuthProvider");

  }

  return context;

}