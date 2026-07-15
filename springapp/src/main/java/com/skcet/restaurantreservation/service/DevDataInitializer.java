package com.skcet.restaurantreservation.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.UserRepository;

@Component
@Profile({"dev", "local"})
public class DevDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            createUser("Admin", "admin@example.com", UserRole.ADMIN);
            createUser("Owner", "owner@example.com", UserRole.OWNER);
            createUser("Customer", "customer@example.com", UserRole.CUSTOMER);
        }
    }

    private void createUser(String name, String email, UserRole role) {
        if (userRepository.findByEmailIgnoreCase(email).isEmpty()) {
            userRepository.save(
                    new User(
                            name,
                            email,
                            passwordEncoder.encode("StrongPass123"),
                            role));
        }
    }
}
