package com.skcet.restaurantreservation.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.RestaurantTable;

public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable>
            findByRestaurant_IdOrderByTableNumberAsc(
                    Long restaurantId
            );

    // Added for S3-01: Check if a table number already exists for a specific restaurant
    boolean existsByRestaurant_IdAndTableNumber(Long restaurantId, Integer tableNumber);

    // Added for S3-01: Fetch a specific table to check for duplicates during an update
    Optional<RestaurantTable> findByRestaurant_IdAndTableNumber(Long restaurantId, Integer tableNumber);
}