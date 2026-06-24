import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  AUTH_SESSION_KEY,
  readSession,
  saveSession,
} from "../services/authStorage";

describe("authentication storage", () => {
  it("stores and restores an active session", () => {
    const session = {
      accessToken: "token-value",
      tokenType: "Bearer",
      expiresAt: Date.now() + 60_000,
      user: {
        id: 1,
        name: "Customer",
        email: "customer@example.com",
        role: "CUSTOMER",
      },
    };

    saveSession(session);

    expect(readSession()).toEqual(session);
  });

  it("removes expired sessions", () => {
    window.localStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        accessToken: "expired-token",
        tokenType: "Bearer",
        expiresAt: Date.now() - 1,
        user: {
          id: 1,
          role: "CUSTOMER",
        },
      }),
    );

    expect(readSession()).toBeNull();
    expect(
      window.localStorage.getItem(AUTH_SESSION_KEY),
    ).toBeNull();
  });

  it("logs out and clears the persisted session", () => {
    saveSession({
      accessToken: "token-value",
      tokenType: "Bearer",
      expiresAt: Date.now() + 60_000,
      user: {
        id: 1,
        role: "CUSTOMER",
      },
    });

    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(readSession()).toBeNull();
  });
});
