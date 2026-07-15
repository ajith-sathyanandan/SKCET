import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import components
import RestaurantList from '../components/RestaurantList';
import RestaurantDetail from '../components/RestaurantDetail';
import RestaurantSearch from '../components/RestaurantSearch';
import ReservationForm from '../components/ReservationForm';
import ReservationList from '../components/ReservationList';
import ReservationStatus from '../components/ReservationStatus';

// Mock services
jest.mock('../utils/RestaurantService');
jest.mock('../utils/ReservationService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn()
}));

import RestaurantService from '../utils/RestaurantService';
import ReservationService from '../utils/ReservationService';

const mockRestaurants = [
  {
    id: 1,
    name: 'Test Restaurant',
    cuisine: 'Italian',
    address: '123 Main St',
    openingTime: '09:00',
    closingTime: '22:00',
    totalTables: 20
  },
  {
    id: 2,
    name: 'Pizza Palace',
    cuisine: 'Italian',
    address: '456 Oak Ave',
    openingTime: '11:00',
    closingTime: '23:00',
    totalTables: 15
  }
];

const mockReservations = [
  {
    id: 1,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '123-456-7890',
    reservationDate: '2025-08-15',
    reservationTime: '19:00',
    partySize: 4,
    status: 'PENDING',
    specialRequests: 'Window seat please',
    restaurantId: 1
  },
  {
    id: 2,
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '098-765-4321',
    reservationDate: '2025-08-16',
    reservationTime: '20:00',
    partySize: 2,
    status: 'CONFIRMED',
    specialRequests: '',
    restaurantId: 1
  }
];

describe('Restaurant Reservation System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: RestaurantList renders correctly with restaurants
  test('RestaurantList displays list of restaurants', async () => {
    RestaurantService.getAll.mockResolvedValue(mockRestaurants);
    
    render(
      <BrowserRouter>
        <RestaurantList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Restaurants')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
    });
  });

  // Test Case 2: RestaurantList handles loading state
  test('RestaurantList shows loading state', () => {
    RestaurantService.getAll.mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <RestaurantList />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  // Test Case 3: RestaurantList handles error state
  test('RestaurantList displays error message on failure', async () => {
    RestaurantService.getAll.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <RestaurantList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch restaurants')).toBeInTheDocument();
    });
  });

  // Test Case 4: RestaurantDetail displays restaurant information
  test('RestaurantDetail shows restaurant details and reservation form', async () => {
    RestaurantService.getById.mockResolvedValue(mockRestaurants[0]);
    
    render(
      <BrowserRouter>
        <RestaurantDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
      expect(screen.getByText('Address: 123 Main St')).toBeInTheDocument();
      expect(screen.getByText('Book a Table')).toBeInTheDocument();
    });
  });

  // Test Case 5: RestaurantSearch performs search functionality
  test('RestaurantSearch filters restaurants by cuisine', async () => {
    RestaurantService.searchByCuisine.mockResolvedValue([mockRestaurants[0]]);
    
    render(<RestaurantSearch />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.change(searchInput, { target: { value: 'Italian' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(RestaurantService.searchByCuisine).toHaveBeenCalledWith('Italian');
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });
  });

  // Test Case 6: ReservationForm validates required fields
  test('ReservationForm shows validation errors for empty fields', async () => {
    const mockRestaurant = mockRestaurants[0];
    
    render(<ReservationForm restaurant={mockRestaurant} />);

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
    });
  });

  // Test Case 7: ReservationForm validates email format
  test('ReservationForm validates email format', async () => {
    const mockRestaurant = mockRestaurants[0];
    
    render(<ReservationForm restaurant={mockRestaurant} />);

    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-08-15' } });
    fireEvent.change(screen.getByTestId('time-input'), { target: { value: '19:00' } });

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Valid email is required.')).toBeInTheDocument();
    });
  });

  // Test Case 8: ReservationForm validates party size range
  test('ReservationForm validates party size limits', async () => {
    const mockRestaurant = mockRestaurants[0];
    
    render(<ReservationForm restaurant={mockRestaurant} />);

    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-08-15' } });
    fireEvent.change(screen.getByTestId('time-input'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByTestId('party-size-input'), { target: { value: '25' } });

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Party size must be between 1 and 20.')).toBeInTheDocument();
    });
  });

  // Test Case 9: ReservationForm successfully submits valid data
  test('ReservationForm submits successfully with valid data', async () => {
    const mockRestaurant = mockRestaurants[0];
    ReservationService.create.mockResolvedValue({ id: 3, ...mockReservations[0] });
    
    render(<ReservationForm restaurant={mockRestaurant} />);

    // Fill in valid form data
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByTestId('phone-input'), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-08-15' } });
    fireEvent.change(screen.getByTestId('time-input'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByTestId('party-size-input'), { target: { value: '4' } });

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(ReservationService.create).toHaveBeenCalledWith({
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '123-456-7890',
        reservationDate: '2025-08-15',
        reservationTime: '19:00',
        partySize: 4,
        specialRequests: '',
        restaurantId: 1
      });
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Reservation request submitted!')).toBeInTheDocument();
    });
  });

  // Test Case 10: ReservationList displays all reservations
  test('ReservationList shows all reservations with details', async () => {
    ReservationService.getAll.mockResolvedValue(mockReservations);
    
    render(<ReservationList />);

    await waitFor(() => {
      expect(screen.getByText('All Reservations')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByTestId('reservation-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('reservation-item-2')).toBeInTheDocument();
    });
  });

  // Test Case 11: ReservationList handles empty state
  test('ReservationList shows empty state when no reservations exist', async () => {
    ReservationService.getAll.mockResolvedValue([]);
    
    render(<ReservationList />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
      expect(screen.getByText('No reservations found.')).toBeInTheDocument();
    });
  });

  // Test Case 12: ReservationStatus buttons work correctly
  test('ReservationStatus confirm button updates status', async () => {
    const mockOnStatusUpdate = jest.fn();
    ReservationService.updateStatus.mockResolvedValue({});
    
    render(
      <ReservationStatus 
        reservationId={1} 
        status="PENDING" 
        onStatusUpdate={mockOnStatusUpdate} 
      />
    );

    const confirmButton = screen.getByTestId('confirm-button-1');
    fireEvent.click(confirmButton);

    expect(mockOnStatusUpdate).toHaveBeenCalledWith(1, 'CONFIRMED');
  });

  // Test Case 13: ReservationStatus disables buttons based on status
  test('ReservationStatus disables confirm button when already confirmed', () => {
    const mockOnStatusUpdate = jest.fn();
    
    render(
      <ReservationStatus 
        reservationId={1} 
        status="CONFIRMED" 
        onStatusUpdate={mockOnStatusUpdate} 
      />
    );

    const confirmButton = screen.getByTestId('confirm-button-1');
    expect(confirmButton).toBeDisabled();
  });

  // Test Case 14: ReservationList cancel functionality works
  test('ReservationList cancel button removes reservation', async () => {
    ReservationService.getAll.mockResolvedValue(mockReservations);
    ReservationService.cancel.mockResolvedValue(true);
    
    render(<ReservationList />);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button-1')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button-1');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(ReservationService.cancel).toHaveBeenCalledWith(1);
    });
  });

  // Test Case 15: RestaurantSearch handles no results
  test('RestaurantSearch displays no results message when search returns empty', async () => {
    RestaurantService.searchByCuisine.mockResolvedValue([]);
    
    render(<RestaurantSearch />);

    const searchInput = screen.getByTestId('search-input');
    const searchButton = screen.getByTestId('search-button');

    fireEvent.change(searchInput, { target: { value: 'Japanese' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No matching restaurants found.')).toBeInTheDocument();
    });
  });
});