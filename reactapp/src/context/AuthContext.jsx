import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { authService } from "../services/authService";
import {
  clearSession,
  readSession,
  saveSession,
} from "../services/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);

    const nextSession = {
      accessToken: response.accessToken,
      tokenType: response.tokenType ?? "Bearer",
      expiresAt: Date.now() + response.expiresIn * 1000,
      user: response.user,
    };

    saveSession(nextSession);
    setSession(nextSession);

    return nextSession;
  }, []);

  const register = useCallback((registration) => {
    return authService.register(registration);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>
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
