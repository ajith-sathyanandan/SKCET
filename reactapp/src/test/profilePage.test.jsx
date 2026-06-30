import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useAuth } from "../context/AuthContext";
import ProfilePage from "../pages/ProfilePage";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProfilePage", () => {
  const refreshProfile = vi.fn();
  const updateProfile = vi.fn();
  const changePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: {
        id: 7,
        name: "Ajith",
        email: "ajith@example.com",
        role: "CUSTOMER",
      },
      refreshProfile,
      updateProfile,
      changePassword,
    });

    refreshProfile.mockResolvedValue({
      id: 7,
      name: "Ajith",
      email: "ajith@example.com",
      role: "CUSTOMER",
    });
  });

  it("loads and displays the authenticated profile", async () => {
    render(<ProfilePage />);

    expect(
      screen.getByText("Loading profile..."),
    ).toBeInTheDocument();

    expect(
      await screen.findByDisplayValue("Ajith"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("ajith@example.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("CUSTOMER"),
    ).toBeInTheDocument();

    expect(refreshProfile).toHaveBeenCalledTimes(1);
  });

  it("validates profile fields before saving", async () => {
    const user = userEvent.setup();

    render(<ProfilePage />);

    const nameInput =
      await screen.findByLabelText("Full name");

    const emailInput =
      screen.getByLabelText("Email address");

    await user.clear(nameInput);
    await user.clear(emailInput);
    await user.click(
      screen.getByRole("button", {
        name: "Save profile",
      }),
    );

    expect(
      screen.getByText("Name is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Email is required"),
    ).toBeInTheDocument();

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("updates the authenticated user's profile", async () => {
    const user = userEvent.setup();

    updateProfile.mockResolvedValue({
      id: 7,
      name: "Ajith Sathyanandan",
      email: "ajith.new@example.com",
      role: "CUSTOMER",
    });

    render(<ProfilePage />);

    const nameInput =
      await screen.findByLabelText("Full name");

    const emailInput =
      screen.getByLabelText("Email address");

    await user.clear(nameInput);
    await user.type(nameInput, "Ajith Sathyanandan");

    await user.clear(emailInput);
    await user.type(
      emailInput,
      "ajith.new@example.com",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save profile",
      }),
    );

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        name: "Ajith Sathyanandan",
        email: "ajith.new@example.com",
      });
    });

    expect(
      await screen.findByText(
        "Profile information updated successfully",
      ),
    ).toBeInTheDocument();
  });

  it("validates password confirmation", async () => {
    const user = userEvent.setup();

    render(<ProfilePage />);

    await screen.findByDisplayValue("Ajith");

    await user.type(
      screen.getByLabelText("Current password"),
      "CurrentPass123",
    );

    await user.type(
      screen.getByLabelText("New password"),
      "NewSecurePass123",
    );

    await user.type(
      screen.getByLabelText("Confirm new password"),
      "DifferentPass123",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Change password",
      }),
    );

    expect(
      screen.getByText("Passwords do not match"),
    ).toBeInTheDocument();

    expect(changePassword).not.toHaveBeenCalled();
  });

  it("changes the password after validation", async () => {
    const user = userEvent.setup();

    changePassword.mockResolvedValue(null);

    render(<ProfilePage />);

    await screen.findByDisplayValue("Ajith");

    await user.type(
      screen.getByLabelText("Current password"),
      "CurrentPass123",
    );

    await user.type(
      screen.getByLabelText("New password"),
      "NewSecurePass123",
    );

    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewSecurePass123",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Change password",
      }),
    );

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: "CurrentPass123",
        newPassword: "NewSecurePass123",
      });
    });

    expect(
      await screen.findByText(
        "Password changed successfully",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Current password"),
    ).toHaveValue("");

    expect(
      screen.getByLabelText("New password"),
    ).toHaveValue("");
  });
});
