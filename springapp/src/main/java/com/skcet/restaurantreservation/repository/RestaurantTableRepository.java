package com.skcet.restaurantreservation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.RestaurantTable;

public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable>
            findByRestaurant_IdOrderByTableNumberAsc(
                    Long restaurantId
            );
}
