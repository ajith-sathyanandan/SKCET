package com.skcet.restaurantreservation.dto;

import java.time.LocalTime;

import com.skcet.restaurantreservation.entity.Restaurant;

public record RestaurantResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String name,
        String address,
        String cuisine,
        LocalTime openingTime,
        LocalTime closingTime
) {

    public static RestaurantResponse from(Restaurant restaurant) {
        return new RestaurantResponse(
                restaurant.getId(),
                restaurant.getOwner().getId(),
                restaurant.getOwner().getName(),
                restaurant.getName(),
                restaurant.getAddress(),
                restaurant.getCuisineType(),
                restaurant.getOpeningTime(),
                restaurant.getClosingTime()
        );
    }
}
