import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registeredMessage = location.state?.registered
    ? "Registration completed. Log in with your new account."
    : "";

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
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

      await login({
        email: form.email.trim(),
        password: form.password,
      });

      const destination =
        location.state?.from?.pathname ?? "/dashboard";

      navigate(destination, { replace: true });
    } catch (error) {
      setApiError(error.message ?? "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="eyebrow">Welcome back</span>
          <h2>Log in to your account</h2>
          <p>Manage reservations using your secure account.</p>
        </div>

        {registeredMessage && (
          <div className="alert alert-success" role="status">
            {registeredMessage}
          </div>
        )}

        {apiError && (
          <div className="alert alert-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "login-email-error" : undefined
              }
            />
            {errors.email && (
              <span id="login-email-error" className="field-error">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? "login-password-error"
                  : undefined
              }
            />
            {errors.password && (
              <span
                id="login-password-error"
                className="field-error"
              >
                {errors.password}
              </span>
            )}
          </div>

          <button
            className="primary-button full-width"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          New customer? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
