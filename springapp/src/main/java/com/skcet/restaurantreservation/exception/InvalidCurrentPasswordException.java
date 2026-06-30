package com.skcet.restaurantreservation.exception;

public class InvalidCurrentPasswordException
        extends RuntimeException {

    public InvalidCurrentPasswordException() {
        super("Current password is incorrect");
    }
}
