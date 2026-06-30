package com.skcet.restaurantreservation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.Restaurant;

public interface RestaurantRepository
        extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByCuisineTypeIgnoreCaseOrderByNameAsc(
            String cuisineType
    );
}
