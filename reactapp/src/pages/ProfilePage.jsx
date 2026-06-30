import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function validateProfile(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required";
  } else if (form.name.trim().length > 255) {
    errors.name = "Name must not exceed 255 characters";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    errors.email = "Enter a valid email address";
  }

  return errors;
}

function validatePasswords(form) {
  const errors = {};

  if (!form.currentPassword) {
    errors.currentPassword =
      "Current password is required";
  }

  if (!form.newPassword) {
    errors.newPassword = "New password is required";
  } else if (
    form.newPassword.length < 8
    || form.newPassword.length > 72
  ) {
    errors.newPassword =
      "New password must contain between 8 and 72 characters";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword =
      "Confirm the new password";
  } else if (
    form.confirmPassword !== form.newPassword
  ) {
    errors.confirmPassword =
      "Passwords do not match";
  }

  if (
    form.currentPassword
    && form.newPassword
    && form.currentPassword === form.newPassword
  ) {
    errors.newPassword =
      "New password must be different from the current password";
  }

  return errors;
}

function getErrorMessage(error, fallback) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
}

function ProfilePage() {
  const {
    user,
    refreshProfile,
    updateProfile,
    changePassword,
  } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });

  const [passwordForm, setPasswordForm] =
    useState(emptyPasswordForm);

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] =
    useState(false);

  const [isChangingPassword, setIsChangingPassword] =
    useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      setProfileError("");

      try {
        const currentProfile = await refreshProfile();

        if (active) {
          setProfileForm({
            name: currentProfile.name ?? "",
            email: currentProfile.email ?? "",
          });
        }
      } catch (error) {
        if (active) {
          setProfileError(
            getErrorMessage(
              error,
              "Unable to load profile information",
            ),
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const updateProfileField = (event) => {
    const { name, value } = event.target;

    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setProfileSuccess("");
    setProfileError("");
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;

    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));

    setPasswordErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setPasswordSuccess("");
    setPasswordError("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const errors = validateProfile(profileForm);

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setProfileError(
        "Correct the highlighted profile fields",
      );
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const updatedUser = await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });

      setProfileForm({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      setProfileSuccess(
        "Profile information updated successfully",
      );
    } catch (error) {
      setProfileError(
        getErrorMessage(
          error,
          "Unable to update profile information",
        ),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const errors = validatePasswords(passwordForm);

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setPasswordError(
        "Correct the highlighted password fields",
      );
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      await changePassword({
        currentPassword:
          passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(emptyPasswordForm);

      setPasswordSuccess(
        "Password changed successfully",
      );
    } catch (error) {
      setPasswordError(
        getErrorMessage(
          error,
          "Unable to change password",
        ),
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resetProfileForm = () => {
    setProfileForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
    });

    setProfileErrors({});
    setProfileSuccess("");
    setProfileError("");
  };

  if (isLoading) {
    return (
      <section
        className="profile-page"
        aria-busy="true"
      >
        <div className="profile-loading-card">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="profile-header">
        <div>
          <span className="eyebrow">
            Account management
          </span>

          <h2>My profile</h2>

          <p>
            Manage your personal details and account
            password securely.
          </p>
        </div>

        <div className="profile-role-card">
          <span>Account role</span>
          <strong>{user?.role}</strong>
        </div>
      </header>

      <div className="profile-grid">
        <form
          className="profile-card"
          onSubmit={handleProfileSubmit}
          noValidate
        >
          <div className="profile-card-heading">
            <div>
              <span className="profile-card-label">
                Personal details
              </span>
              <h3>Profile information</h3>
            </div>

            <span className="profile-user-id">
              ID #{user?.id}
            </span>
          </div>

          {profileError && (
            <div
              className="profile-alert profile-alert-error"
              role="alert"
            >
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div
              className="profile-alert profile-alert-success"
              role="status"
            >
              {profileSuccess}
            </div>
          )}

          <div className="profile-field">
            <label htmlFor="profile-name">
              Full name
            </label>

            <input
              id="profile-name"
              name="name"
              type="text"
              maxLength="255"
              value={profileForm.name}
              onChange={updateProfileField}
              aria-invalid={Boolean(
                profileErrors.name,
              )}
            />

            {profileErrors.name && (
              <small className="profile-field-error">
                {profileErrors.name}
              </small>
            )}
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email">
              Email address
            </label>

            <input
              id="profile-email"
              name="email"
              type="email"
              maxLength="255"
              value={profileForm.email}
              onChange={updateProfileField}
              aria-invalid={Boolean(
                profileErrors.email,
              )}
            />

            {profileErrors.email && (
              <small className="profile-field-error">
                {profileErrors.email}
              </small>
            )}
          </div>

          <p className="profile-security-note">
            Updating your email refreshes your secure
            authentication session automatically.
          </p>

          <div className="profile-actions">
            <button
              type="submit"
              className="profile-primary-button"
              disabled={isSavingProfile}
            >
              {isSavingProfile
                ? "Saving..."
                : "Save profile"}
            </button>

            <button
              type="button"
              className="profile-secondary-button"
              onClick={resetProfileForm}
              disabled={isSavingProfile}
            >
              Reset
            </button>
          </div>
        </form>

        <form
          className="profile-card"
          onSubmit={handlePasswordSubmit}
          noValidate
        >
          <div className="profile-card-heading">
            <div>
              <span className="profile-card-label">
                Account security
              </span>
              <h3>Change password</h3>
            </div>

            <span className="profile-security-badge">
              BCrypt protected
            </span>
          </div>

          {passwordError && (
            <div
              className="profile-alert profile-alert-error"
              role="alert"
            >
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div
              className="profile-alert profile-alert-success"
              role="status"
            >
              {passwordSuccess}
            </div>
          )}

          <div className="profile-field">
            <label htmlFor="current-password">
              Current password
            </label>

            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={updatePasswordField}
              aria-invalid={Boolean(
                passwordErrors.currentPassword,
              )}
            />

            {passwordErrors.currentPassword && (
              <small className="profile-field-error">
                {passwordErrors.currentPassword}
              </small>
            )}
          </div>

          <div className="profile-field">
            <label htmlFor="new-password">
              New password
            </label>

            <input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={updatePasswordField}
              aria-invalid={Boolean(
                passwordErrors.newPassword,
              )}
            />

            {passwordErrors.newPassword && (
              <small className="profile-field-error">
                {passwordErrors.newPassword}
              </small>
            )}
          </div>

          <div className="profile-field">
            <label htmlFor="confirm-password">
              Confirm new password
            </label>

            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={updatePasswordField}
              aria-invalid={Boolean(
                passwordErrors.confirmPassword,
              )}
            />

            {passwordErrors.confirmPassword && (
              <small className="profile-field-error">
                {passwordErrors.confirmPassword}
              </small>
            )}
          </div>

          <p className="profile-security-note">
            Your current password must be verified before
            the new password can be stored.
          </p>

          <div className="profile-actions">
            <button
              type="submit"
              className="profile-primary-button"
              disabled={isChangingPassword}
            >
              {isChangingPassword
                ? "Changing password..."
                : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default ProfilePage;
