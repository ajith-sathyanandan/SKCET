package com.skcet.restaurantreservation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RestaurantTableRequest(
        
        @NotNull(message = "Table number is required")
        @Positive(message = "Table number must be positive")
        Integer tableNumber,

        @NotNull(message = "Capacity is required")
        @Positive(message = "Capacity must be greater than 0")
        Integer capacity
) {
}