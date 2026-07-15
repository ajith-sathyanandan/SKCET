package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.exception.ValidationException;
import com.examly.springapp.model.Reservation;
import com.examly.springapp.model.ReservationStatus;
import com.examly.springapp.model.Restaurant;
import com.examly.springapp.repository.ReservationRepository;
import com.examly.springapp.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RestaurantRepository restaurantRepository;

    public ReservationService(ReservationRepository reservationRepository, RestaurantRepository restaurantRepository) {
        this.reservationRepository = reservationRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public Reservation createReservation(Reservation reservation, Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        reservationRepository.findByRestaurant_IdAndReservationDate(restaurantId, reservation.getReservationDate());

        LocalTime requestedTime = reservation.getReservationTime();
        if (requestedTime.isBefore(restaurant.getOpeningTime()) || requestedTime.isAfter(restaurant.getClosingTime())) {
            throw new ValidationException("Reservation time is outside restaurant operating hours");
        }

        reservation.setRestaurant(restaurant);
        reservation.setStatus(ReservationStatus.PENDING);
        return reservationRepository.save(reservation);
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + id));
    }

    public List<Reservation> getReservationsByRestaurant(Long restaurantId) {
        return reservationRepository.findByRestaurant_Id(restaurantId);
    }

    public Reservation updateReservationStatus(Long id, ReservationStatus status) {
        Reservation reservation = getReservationById(id);
        reservation.setStatus(status);
        return reservationRepository.save(reservation);
    }

    public void cancelReservation(Long id) {
        Reservation reservation = getReservationById(id);
        reservationRepository.delete(reservation);
    }
}
