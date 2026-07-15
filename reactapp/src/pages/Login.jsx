import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getDashboardPath(role) {
  if (role === "OWNER") {
    return "/owner/dashboard";
  }

  if (role === "ADMIN") {
    return "/admin/dashboard";
  }

  return "/customer/dashboard";
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registeredMessage = location.state?.registered
    ? "Registration completed. You can sign in now."
    : "";

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      setApiError("");

      const response = await login({
        email: form.email.trim(),
        password: form.password,
      });

      navigate(getDashboardPath(response?.user?.role), { replace: true });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
            Reserve with confidence
          </div>
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to browse restaurants and manage your bookings.
          </p>
        </div>

        {registeredMessage && (
          <div
            className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {registeredMessage}
          </div>
        )}

        {apiError && (
          <div
            className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-amber-400"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-2 text-sm text-rose-300">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400"
              placeholder="Password"
            />
            {errors.password && <p className="mt-2 text-sm text-rose-300">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          New here?{" "}
          <Link to="/register" className="font-semibold text-amber-300 hover:text-amber-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
