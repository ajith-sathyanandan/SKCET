package com.skcet.restaurantreservation.exception;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ProfileExceptionHandler {

    @ExceptionHandler(InvalidCurrentPasswordException.class)
    public ResponseEntity<ApiError> handleInvalidCurrentPassword(
            InvalidCurrentPasswordException exception
    ) {
        ApiError error = new ApiError(
                "INVALID_CURRENT_PASSWORD",
                exception.getMessage(),
                Map.of()
        );

        return ResponseEntity.badRequest().body(error);
    }
}
