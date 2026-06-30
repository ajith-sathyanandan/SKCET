package com.skcet.restaurantreservation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skcet.restaurantreservation.dto.PasswordChangeRequest;
import com.skcet.restaurantreservation.dto.ProfileUpdateRequest;
import com.skcet.restaurantreservation.dto.ProfileUpdateResponse;
import com.skcet.restaurantreservation.dto.UserResponse;
import com.skcet.restaurantreservation.service.ProfileService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(
            ProfileService profileService
    ) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserResponse getCurrentProfile() {
        return profileService.getCurrentProfile();
    }

    @PutMapping
    public ProfileUpdateResponse updateCurrentProfile(
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return profileService.updateCurrentProfile(request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changeCurrentPassword(
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        profileService.changeCurrentPassword(request);

        return ResponseEntity.noContent().build();
    }
}
