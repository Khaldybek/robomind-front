"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/tokens";
import { fetchStudentProfile } from "@/lib/api/student/courses";
import type { StudentProfile } from "@/lib/api/types";
import type { AuthLoginUser } from "@/lib/api/auth-api";
import { apiAuthLogout, apiAuthLogoutAll } from "@/lib/api/auth-api";

type AuthContextValue = {
  user: StudentProfile | null;
  profileLoading: boolean;
  logout: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyUserFromLogin: (u: AuthLoginUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loginUserToProfile(u: AuthLoginUser): StudentProfile {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    schoolId: u.schoolId ?? undefined,
    role: u.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const applyUserFromLogin = useCallback((u: AuthLoginUser) => {
    setUser(loginUserToProfile(u));
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const p = await fetchStudentProfile();
      setUser(p);
    } catch {
      setUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    await apiAuthLogout(getRefreshToken());
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const logoutAllSessions = useCallback(async () => {
    const at = getAccessToken();
    if (at) {
      try {
        await apiAuthLogoutAll(at);
      } catch {
        /* всё равно чистим локально */
      }
    }
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profileLoading,
        logout,
        logoutAllSessions,
        refreshProfile,
        applyUserFromLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth: оберните приложение в AuthProvider");
  }
  return ctx;
}
