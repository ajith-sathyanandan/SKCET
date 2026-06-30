package com.skcet.restaurantreservation.exception;

public class RestaurantAccessDeniedException extends RuntimeException {

    public RestaurantAccessDeniedException() {
        super("You cannot modify a restaurant owned by another user");
    }
}
