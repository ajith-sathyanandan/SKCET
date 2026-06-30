package com.skcet.restaurantreservation.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RestaurantRequest(
        Long ownerId,

        @NotBlank(message = "Restaurant name is required")
        @Size(max = 255)
        String name,

        @NotBlank(message = "Address is required")
        @Size(max = 255)
        String address,

        @NotBlank(message = "Cuisine is required")
        @Size(max = 100)
        String cuisine,

        @NotNull(message = "Opening time is required")
        LocalTime openingTime,

        @NotNull(message = "Closing time is required")
        LocalTime closingTime
) {

    @AssertTrue(message = "Closing time must be after opening time")
    public boolean isOperatingTimeValid() {
        return openingTime == null
                || closingTime == null
                || closingTime.isAfter(openingTime);
    }
}
