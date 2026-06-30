package com.skcet.restaurantreservation.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestaurantExceptionHandler {

    @ExceptionHandler(RestaurantNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(
            RestaurantNotFoundException exception
    ) {
        ApiError error = new ApiError(
                "RESTAURANT_NOT_FOUND",
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(error);
    }

    @ExceptionHandler(RestaurantAccessDeniedException.class)
    ResponseEntity<ApiError> handleDenied(
            RestaurantAccessDeniedException exception
    ) {
        ApiError error = new ApiError(
                "RESTAURANT_ACCESS_DENIED",
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(error);
    }

    @ExceptionHandler(InvalidRestaurantOwnerException.class)
    ResponseEntity<ApiError> handleInvalidOwner(
            InvalidRestaurantOwnerException exception
    ) {
        ApiError error = new ApiError(
                "INVALID_RESTAURANT_OWNER",
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(error);
    }
}
