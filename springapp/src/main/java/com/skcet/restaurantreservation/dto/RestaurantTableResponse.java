package com.skcet.restaurantreservation.dto;

import com.skcet.restaurantreservation.entity.RestaurantTable;

public record RestaurantTableResponse(
        Long id,
        Integer tableNumber,
        Integer capacity
) {

    public static RestaurantTableResponse from(
            RestaurantTable restaurantTable
    ) {
        return new RestaurantTableResponse(
                restaurantTable.getId(),
                restaurantTable.getTableNumber(),
                restaurantTable.getCapacity()
        );
    }
}
