package com.examly.springapp.controller;

import com.examly.springapp.model.Reservation;
import com.examly.springapp.model.ReservationStatus;
import com.examly.springapp.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "*")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<Reservation> createReservation(@Valid @RequestBody Reservation reservation) {
        Long effectiveRestaurantId = reservation.getRestaurantId() != null
                ? reservation.getRestaurantId()
                : reservation.getRestaurant() != null ? reservation.getRestaurant().getId() : null;
        if (effectiveRestaurantId == null) {
            throw new IllegalArgumentException("restaurantId is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.createReservation(reservation, effectiveRestaurantId));
    }

    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationService.getAllReservations();
    }

    @GetMapping("/{id}")
    public Reservation getReservationById(@PathVariable Long id) {
        return reservationService.getReservationById(id);
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<Reservation> getReservationsByRestaurant(@PathVariable Long restaurantId) {
        return reservationService.getReservationsByRestaurant(restaurantId);
    }

    @PutMapping("/{id}/status")
    public Reservation updateReservationStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusValue = body.get("status");
        if (statusValue == null) {
            throw new IllegalArgumentException("Status is required");
        }
        return reservationService.updateReservationStatus(id, ReservationStatus.valueOf(statusValue.toUpperCase()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }
}
