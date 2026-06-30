package com.skcet.restaurantreservation.dto;

import java.time.LocalTime;
import java.util.List;

import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;

public record RestaurantDetailsResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String name,
        String address,
        String cuisine,
        LocalTime openingTime,
        LocalTime closingTime,
        Integer totalTables,
        Integer totalCapacity,
        List<RestaurantTableResponse> tables
) {

    public static RestaurantDetailsResponse from(
            Restaurant restaurant,
            List<RestaurantTable> restaurantTables
    ) {
        List<RestaurantTableResponse> tableResponses =
                restaurantTables
                        .stream()
                        .map(RestaurantTableResponse::from)
                        .toList();

        int totalCapacity = restaurantTables
                .stream()
                .mapToInt(RestaurantTable::getCapacity)
                .sum();

        return new RestaurantDetailsResponse(
                restaurant.getId(),
                restaurant.getOwner().getId(),
                restaurant.getOwner().getName(),
                restaurant.getName(),
                restaurant.getAddress(),
                restaurant.getCuisineType(),
                restaurant.getOpeningTime(),
                restaurant.getClosingTime(),
                restaurantTables.size(),
                totalCapacity,
                tableResponses
        );
    }
}
