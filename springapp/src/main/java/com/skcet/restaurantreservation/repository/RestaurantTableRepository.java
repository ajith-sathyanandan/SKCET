package com.skcet.restaurantreservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.RestaurantTable;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
}
