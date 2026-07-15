package com.examly.springapp;

import com.examly.springapp.model.*;
import com.examly.springapp.repository.*;
import com.examly.springapp.service.*;
import com.examly.springapp.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RestaurantReservationSystemTests {

    @Mock private RestaurantRepository restaurantRepository;
    @Mock private ReservationRepository reservationRepository;
    
    @InjectMocks private RestaurantService restaurantService;
    @InjectMocks private ReservationService reservationService;

    private Restaurant testRestaurant;
    private Reservation testReservation;

    @BeforeEach
    void setUp() {
        testRestaurant = Restaurant.builder()
                .id(1L)
                .name("Test Restaurant")
                .address("123 Main St")
                .cuisine("Italian")
                .openingTime(LocalTime.of(9, 0))
                .closingTime(LocalTime.of(22, 0))
                .totalTables(10)
                .build();

        testReservation = Reservation.builder()
                .id(1L)
                .restaurant(testRestaurant)
                .customerName("John Doe")
                .customerEmail("john@example.com")
                .customerPhone("123-456-7890")
                .reservationDate(LocalDate.of(2025, 8, 15))
                .reservationTime(LocalTime.of(19, 0))
                .partySize(4)
                .status(ReservationStatus.PENDING)
                .specialRequests("Window seat")
                .build();
    }

    // Test Case 1: Create Restaurant Successfully
    @Test
    public void testCreateRestaurant() {
        when(restaurantRepository.save(any(Restaurant.class))).thenReturn(testRestaurant);
        
        Restaurant created = restaurantService.createRestaurant(testRestaurant);
        
        assertNotNull(created);
        assertEquals("Test Restaurant", created.getName());
        assertEquals("Italian", created.getCuisine());
        verify(restaurantRepository, times(1)).save(testRestaurant);
    }

    // Test Case 2: Get All Restaurants
    @Test
    public void testGetAllRestaurants() {
        List<Restaurant> restaurants = Arrays.asList(testRestaurant);
        when(restaurantRepository.findAll()).thenReturn(restaurants);
        
        List<Restaurant> result = restaurantService.getAllRestaurants();
        
        assertEquals(1, result.size());
        assertEquals("Test Restaurant", result.get(0).getName());
        verify(restaurantRepository, times(1)).findAll();
    }

    // Test Case 3: Get Restaurant by ID
    @Test
    public void testGetRestaurantById() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));
        
        Restaurant found = restaurantService.getRestaurantById(1L);
        
        assertNotNull(found);
        assertEquals("Test Restaurant", found.getName());
        verify(restaurantRepository, times(1)).findById(1L);
    }

    // Test Case 4: Get Restaurant by ID - Not Found
    @Test
    public void testGetRestaurantByIdNotFound() {
        when(restaurantRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThrows(ResourceNotFoundException.class, () -> {
            restaurantService.getRestaurantById(999L);
        });
        
        verify(restaurantRepository, times(1)).findById(999L);
    }

    // Test Case 5: Search Restaurants by Cuisine
    @Test
    public void testSearchByCuisine() {
        List<Restaurant> italianRestaurants = Arrays.asList(testRestaurant);
        when(restaurantRepository.findByCuisineIgnoreCase("Italian")).thenReturn(italianRestaurants);
        
        List<Restaurant> result = restaurantService.searchByCuisine("Italian");
        
        assertEquals(1, result.size());
        assertEquals("Italian", result.get(0).getCuisine());
        verify(restaurantRepository, times(1)).findByCuisineIgnoreCase("Italian");
    }

    // Test Case 6: Create Reservation Successfully
    @Test
    public void testCreateReservation() {
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));
        when(reservationRepository.findByRestaurant_IdAndReservationDate(1L, testReservation.getReservationDate()))
                .thenReturn(Arrays.asList());
        when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
        
        Reservation created = reservationService.createReservation(testReservation, 1L);
        
        assertNotNull(created);
        assertEquals("John Doe", created.getCustomerName());
        assertEquals(ReservationStatus.PENDING, created.getStatus());
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    // Test Case 7: Create Reservation - Restaurant Not Found
    @Test
    public void testCreateReservationRestaurantNotFound() {
        when(restaurantRepository.findById(999L)).thenReturn(Optional.empty());
        
        assertThrows(ResourceNotFoundException.class, () -> {
            reservationService.createReservation(testReservation, 999L);
        });
        
        verify(restaurantRepository, times(1)).findById(999L);
    }

    // Test Case 8: Get All Reservations
    @Test
    public void testGetAllReservations() {
        List<Reservation> reservations = Arrays.asList(testReservation);
        when(reservationRepository.findAll()).thenReturn(reservations);
        
        List<Reservation> result = reservationService.getAllReservations();
        
        assertEquals(1, result.size());
        assertEquals("John Doe", result.get(0).getCustomerName());
        verify(reservationRepository, times(1)).findAll();
    }

    // Test Case 9: Update Reservation Status
    @Test
    public void testUpdateReservationStatus() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
        when(reservationRepository.save(any(Reservation.class))).thenReturn(testReservation);
        
        Reservation updated = reservationService.updateReservationStatus(1L, ReservationStatus.CONFIRMED);
        
        assertNotNull(updated);
        assertEquals(ReservationStatus.CONFIRMED, updated.getStatus());
        verify(reservationRepository, times(1)).findById(1L);
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    // Test Case 10: Cancel Reservation
    @Test
    public void testCancelReservation() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(testReservation));
        doNothing().when(reservationRepository).delete(testReservation);
        
        assertDoesNotThrow(() -> {
            reservationService.cancelReservation(1L);
        });
        
        verify(reservationRepository, times(1)).findById(1L);
        verify(reservationRepository, times(1)).delete(testReservation);
    }
}