package com.examly.springapp.repository;

import com.examly.springapp.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByRestaurant_IdAndReservationDate(Long restaurantId, LocalDate reservationDate);
    List<Reservation> findByRestaurant_Id(Long restaurantId);
}
