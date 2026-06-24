package com.skcet.restaurantreservation.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skcet.restaurantreservation.dto.LoginRequest;
import com.skcet.restaurantreservation.dto.LoginResponse;
import com.skcet.restaurantreservation.dto.UserResponse;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.exception.InvalidCredentialsException;
import com.skcet.restaurantreservation.repository.UserRepository;

@Service
public class LoginService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtService.generateToken(user);

        return new LoginResponse(
                accessToken,
                jwtService.getTokenType(),
                jwtService.getExpirationSeconds(),
                UserResponse.from(user)
        );
    }
}
