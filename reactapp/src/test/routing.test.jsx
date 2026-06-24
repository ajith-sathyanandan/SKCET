import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router";
import { describe, expect, it } from "vitest";

import ProtectedRoute from "../components/routing/ProtectedRoute";
import RoleRoute from "../components/routing/RoleRoute";
import { AuthProvider } from "../context/AuthContext";
import { saveSession } from "../services/authStorage";

function renderRoutes(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<h1>Login page</h1>} />
          <Route
            path="/unauthorized"
            element={<h1>Access denied</h1>}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<h1>Protected dashboard</h1>}
            />

            <Route
              element={<RoleRoute allowedRoles={["ADMIN"]} />}
            >
              <Route
                path="/admin"
                element={<h1>Admin page</h1>}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function createSession(role) {
  return {
    accessToken: `${role.toLowerCase()}-token`,
    tokenType: "Bearer",
    expiresAt: Date.now() + 60_000,
    user: {
      id: 1,
      name: role,
      email: `${role.toLowerCase()}@example.com`,
      role,
    },
  };
}

describe("protected and role routes", () => {
  it("redirects unauthenticated users to login", () => {
    renderRoutes("/dashboard");

    expect(
      screen.getByRole("heading", { name: "Login page" }),
    ).toBeInTheDocument();
  });

  it("allows an authenticated user into a protected route", () => {
    saveSession(createSession("CUSTOMER"));

    renderRoutes("/dashboard");

    expect(
      screen.getByRole("heading", {
        name: "Protected dashboard",
      }),
    ).toBeInTheDocument();
  });

  it("redirects a disallowed role to the access-denied page", () => {
    saveSession(createSession("CUSTOMER"));

    renderRoutes("/admin");

    expect(
      screen.getByRole("heading", { name: "Access denied" }),
    ).toBeInTheDocument();
  });

  it("allows an administrator into an admin route", () => {
    saveSession(createSession("ADMIN"));

    renderRoutes("/admin");

    expect(
      screen.getByRole("heading", { name: "Admin page" }),
    ).toBeInTheDocument();
  });
});
