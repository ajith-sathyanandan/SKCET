package com.skcet.restaurantreservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
}
