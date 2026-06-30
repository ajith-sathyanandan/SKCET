package com.skcet.restaurantreservation.service;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skcet.restaurantreservation.dto.PasswordChangeRequest;
import com.skcet.restaurantreservation.dto.ProfileUpdateRequest;
import com.skcet.restaurantreservation.dto.ProfileUpdateResponse;
import com.skcet.restaurantreservation.dto.UserResponse;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.exception.DuplicateEmailException;
import com.skcet.restaurantreservation.exception.InvalidCurrentPasswordException;
import com.skcet.restaurantreservation.exception.InvalidCredentialsException;
import com.skcet.restaurantreservation.repository.UserRepository;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public ProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentProfile() {
        return UserResponse.from(getCurrentUser());
    }

    @Transactional
    public ProfileUpdateResponse updateCurrentProfile(
            ProfileUpdateRequest request
    ) {
        User user = getCurrentUser();

        String normalizedEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .filter(existingUser ->
                        !existingUser.getId().equals(user.getId())
                )
                .ifPresent(existingUser -> {
                    throw new DuplicateEmailException(
                            normalizedEmail
                    );
                });

        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);

        try {
            User updatedUser =
                    userRepository.saveAndFlush(user);

            String refreshedToken =
                    jwtService.generateToken(updatedUser);

            return new ProfileUpdateResponse(
                    refreshedToken,
                    jwtService.getTokenType(),
                    jwtService.getExpirationSeconds(),
                    UserResponse.from(updatedUser)
            );
        }
        catch (DataIntegrityViolationException exception) {
            throw new DuplicateEmailException(
                    normalizedEmail
            );
        }
    }

    @Transactional
    public void changeCurrentPassword(
            PasswordChangeRequest request
    ) {
        User user = getCurrentUser();

        boolean currentPasswordMatches =
                passwordEncoder.matches(
                        request.currentPassword(),
                        user.getPasswordHash()
                );

        if (!currentPasswordMatches) {
            throw new InvalidCurrentPasswordException();
        }

        user.setPasswordHash(
                passwordEncoder.encode(request.newPassword())
        );

        userRepository.saveAndFlush(user);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || authentication.getName() == null) {
            throw new InvalidCredentialsException();
        }

        return userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(InvalidCredentialsException::new);
    }
}
