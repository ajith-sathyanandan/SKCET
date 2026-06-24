package com.skcet.restaurantreservation.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
