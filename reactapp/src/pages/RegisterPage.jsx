import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPage() {
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
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required.";
    } else if (trimmedName.length > 255) {
      nextErrors.name = "Name must not exceed 255 characters.";
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8 || form.password.length > 72) {
      nextErrors.password =
        "Password must contain between 8 and 72 characters.";
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

      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (error) {
      const fieldErrors = error.details?.fieldErrors;

      if (fieldErrors) {
        setErrors((current) => ({
          ...current,
          ...fieldErrors,
        }));
      }

      setApiError(error.message ?? "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="eyebrow">Customer registration</span>
          <h2>Create your account</h2>
          <p>Register to search restaurants and reserve tables.</p>
        </div>

        {apiError && (
          <div className="alert alert-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <span className="field-error">{errors.name}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="register-confirm-password">
              Confirm password
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword && (
              <span className="field-error">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            className="primary-button full-width"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;
