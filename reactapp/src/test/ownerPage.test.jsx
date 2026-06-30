import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OwnerPage from "../pages/OwnerPage";
import { restaurantService } from "../services/restaurantService";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 7,
      name: "Restaurant Owner",
      email: "owner@example.com",
      role: "OWNER",
    },
  })),
}));

vi.mock("../services/restaurantService", () => ({
  restaurantService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const ownerRestaurant = {
  id: 12,
  ownerId: 7,
  ownerName: "Restaurant Owner",
  name: "Spice Garden",
  address: "123 Main Street",
  cuisine: "Indian",
  openingTime: "11:00:00",
  closingTime: "22:00:00",
};

describe("OwnerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays the owner's restaurant", async () => {
    restaurantService.getAll.mockResolvedValue([
      ownerRestaurant,
      {
        ...ownerRestaurant,
        id: 99,
        ownerId: 999,
        name: "Another Owner Restaurant",
      },
    ]);

    render(<OwnerPage />);

    expect(
      screen.getByText("Loading restaurant profile..."),
    ).toBeInTheDocument();

    expect(
      await screen.findByDisplayValue("Spice Garden"),
    ).toBeInTheDocument();

    expect(
      screen.queryByDisplayValue(
        "Another Owner Restaurant",
      ),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    ).toBeInTheDocument();
  });

  it("validates required fields before creating", async () => {
    const user = userEvent.setup();

    restaurantService.getAll.mockResolvedValue([]);

    render(<OwnerPage />);

    const createButton = await screen.findByRole(
      "button",
      {
        name: "Create restaurant",
      },
    );

    await user.click(createButton);

    expect(
      screen.getByText("Restaurant name is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Address is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Cuisine is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Opening time is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Closing time is required"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Total tables is required"),
    ).toBeInTheDocument();

    expect(restaurantService.create).not.toHaveBeenCalled();
  });

  it("creates a restaurant and shows success state", async () => {
    const user = userEvent.setup();

    restaurantService.getAll.mockResolvedValue([]);

    restaurantService.create.mockResolvedValue({
      ...ownerRestaurant,
      id: 25,
      name: "New Restaurant",
      cuisine: "Continental",
    });

    render(<OwnerPage />);

    await user.type(
      await screen.findByLabelText("Restaurant name"),
      "New Restaurant",
    );

    await user.type(
      screen.getByLabelText("Address"),
      "45 Lake Road",
    );

    await user.type(
      screen.getByLabelText("Cuisine"),
      "Continental",
    );

    fireEvent.change(
      screen.getByLabelText("Total tables"),
      {
        target: { value: "18" },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Opening time"),
      {
        target: { value: "10:00" },
      },
    );

    fireEvent.change(
      screen.getByLabelText("Closing time"),
      {
        target: { value: "22:00" },
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create restaurant",
      }),
    );

    await waitFor(() => {
      expect(restaurantService.create).toHaveBeenCalledWith({
        name: "New Restaurant",
        address: "45 Lake Road",
        cuisine: "Continental",
        openingTime: "10:00:00",
        closingTime: "22:00:00",
        totalTables: 18,
      });
    });

    expect(
      await screen.findByText(
        "Restaurant profile created successfully",
      ),
    ).toBeInTheDocument();
  });

  it("updates an existing restaurant", async () => {
    const user = userEvent.setup();

    restaurantService.getAll.mockResolvedValue([
      ownerRestaurant,
    ]);

    restaurantService.update.mockResolvedValue({
      ...ownerRestaurant,
      name: "Updated Spice Garden",
    });

    render(<OwnerPage />);

    const nameInput =
      await screen.findByDisplayValue("Spice Garden");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Spice Garden");

    fireEvent.change(
      screen.getByLabelText("Total tables"),
      {
        target: { value: "20" },
      },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save changes",
      }),
    );

    await waitFor(() => {
      expect(restaurantService.update).toHaveBeenCalledWith(
        12,
        expect.objectContaining({
          name: "Updated Spice Garden",
          totalTables: 20,
        }),
      );
    });

    expect(
      await screen.findByText(
        "Restaurant profile updated successfully",
      ),
    ).toBeInTheDocument();
  });

  it("shows an API loading error", async () => {
    restaurantService.getAll.mockRejectedValue(
      new Error("Network unavailable"),
    );

    render(<OwnerPage />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Unable to load restaurant information",
    );
  });
});
