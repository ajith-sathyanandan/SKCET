import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
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

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/login", { replace: true, state: { registered: true } });
    } catch (error) {
      setApiError(error.message ?? "Unable to create an account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-4 py-12 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
            Join the community
          </div>
          <h1 className="text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign up to discover restaurants and reserve your next table.
          </p>
        </div>

        {apiError && (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="Alex Carter"
            />
            {errors.name && <p className="mt-2 text-sm text-rose-300">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
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
              value={form.password}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-2 text-sm text-rose-300">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={updateField}
              className="w-full rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-2 text-sm text-rose-300">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
