package com.skcet.restaurantreservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.Restaurant;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
}
