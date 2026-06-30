package com.skcet.restaurantreservation.exception;

public class RestaurantNotFoundException extends RuntimeException {

    public RestaurantNotFoundException(Long id) {
        super("Restaurant was not found with id: " + id);
    }
}
