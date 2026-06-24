package com.skcet.restaurantreservation.dto;

import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
