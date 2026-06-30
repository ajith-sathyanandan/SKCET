package com.skcet.restaurantreservation.dto;

public record ProfileUpdateResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
