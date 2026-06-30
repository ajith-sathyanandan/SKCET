import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import RestaurantDetailsPage from "../pages/RestaurantDetailsPage";
import RestaurantDiscoveryPage from "../pages/RestaurantDiscoveryPage";
import { restaurantService } from "../services/restaurantService";

vi.mock("../services/restaurantService", () => ({
  restaurantService: {
    discover: vi.fn(),
    getById: vi.fn(),
  },
}));

const restaurants = [
  {
    id: 1,
    name: "Spice Garden",
    address: "RS Puram, Coimbatore",
    cuisine: "Indian",
    openingTime: "11:00:00",
    closingTime: "22:00:00",
  },
  {
    id: 2,
    name: "Pasta Corner",
    address: "Peelamedu, Coimbatore",
    cuisine: "Italian",
    openingTime: "10:00:00",
    closingTime: "23:00:00",
  },
];

function renderDiscoveryPage() {
  return render(
    <MemoryRouter>
      <RestaurantDiscoveryPage />
    </MemoryRouter>,
  );
}

describe("Restaurant discovery interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays restaurant cards", async () => {
    restaurantService.discover.mockResolvedValue(
      restaurants,
    );

    renderDiscoveryPage();

    expect(
      screen.getByText("Loading restaurants..."),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Spice Garden"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Pasta Corner"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 results"),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", {
        name: "View restaurant details",
      }),
    ).toHaveLength(2);
  });

  it("submits search and filter values", async () => {
    const user = userEvent.setup();

    restaurantService.discover
      .mockResolvedValueOnce(restaurants)
      .mockResolvedValueOnce([restaurants[0]]);

    renderDiscoveryPage();

    await screen.findByText("Spice Garden");

    await user.type(
      screen.getByLabelText("Search"),
      "spice",
    );

    await user.type(
      screen.getByLabelText("Cuisine"),
      "Indian",
    );

    await user.type(
      screen.getByLabelText("Location"),
      "Coimbatore",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Search",
      }),
    );

    await waitFor(() => {
      expect(
        restaurantService.discover,
      ).toHaveBeenLastCalledWith({
        search: "spice",
        cuisine: "Indian",
        location: "Coimbatore",
      });
    });

    expect(
      await screen.findByText("1 result"),
    ).toBeInTheDocument();
  });

  it("shows empty and error states", async () => {
    restaurantService.discover.mockResolvedValue([]);

    const { unmount } = renderDiscoveryPage();

    expect(
      await screen.findByText("No restaurants found"),
    ).toBeInTheDocument();

    unmount();

    restaurantService.discover.mockRejectedValue(
      new Error("Network failed"),
    );

    renderDiscoveryPage();

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("Unable to load restaurants");
  });

  it("displays responsive restaurant details", async () => {
    restaurantService.getById.mockResolvedValue({
      id: 1,
      ownerId: 7,
      ownerName: "Restaurant Owner",
      name: "Spice Garden",
      address: "RS Puram, Coimbatore",
      cuisine: "Indian",
      openingTime: "11:00:00",
      closingTime: "22:00:00",
      totalTables: 2,
      totalCapacity: 6,
      tables: [
        {
          id: 10,
          tableNumber: 1,
          capacity: 2,
        },
        {
          id: 11,
          tableNumber: 2,
          capacity: 4,
        },
      ],
    });

    render(
      <MemoryRouter
        initialEntries={["/restaurants/1"]}
      >
        <Routes>
          <Route
            path="/restaurants/:restaurantId"
            element={<RestaurantDetailsPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Spice Garden",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Restaurant Owner"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 tables"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Table 1"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("4 seats"),
    ).toBeInTheDocument();

    expect(
      restaurantService.getById,
    ).toHaveBeenCalledWith("1");
  });
});
