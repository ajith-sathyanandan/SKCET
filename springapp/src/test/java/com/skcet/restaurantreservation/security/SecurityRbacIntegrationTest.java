package com.skcet.restaurantreservation.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.UserRepository;
import com.skcet.restaurantreservation.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(SecurityRbacIntegrationTest.SecurityProbeController.class)
class SecurityRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String customerToken;
    private String ownerToken;
    private String adminToken;

    @BeforeEach
    void createUsersAndTokens() {
        userRepository.deleteAll();

        User customer = createUser(
                "Customer",
                "customer@example.com",
                UserRole.CUSTOMER
        );
        User owner = createUser(
                "Owner",
                "owner@example.com",
                UserRole.OWNER
        );
        User admin = createUser(
                "Admin",
                "admin@example.com",
                UserRole.ADMIN
        );

        customerToken = jwtService.generateToken(customer);
        ownerToken = jwtService.generateToken(owner);
        adminToken = jwtService.generateToken(admin);
    }

    @Test
    void shouldKeepPublicHealthEndpointAccessibleWithoutToken()
            throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnUnauthorizedWithoutBearerToken()
            throws Exception {
        mockMvc.perform(get("/api/private/security-check"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldAllowCustomerToAccessAuthenticatedAndCustomerEndpoints()
            throws Exception {
        mockMvc.perform(
                        get("/api/private/security-check")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk());

        mockMvc.perform(
                        get("/api/customer/security-check")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void shouldReturnForbiddenWhenCustomerAccessesOwnerEndpoint()
            throws Exception {
        mockMvc.perform(
                        get("/api/owner/security-check")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void shouldAllowOwnerToAccessOwnerEndpoint()
            throws Exception {
        mockMvc.perform(
                        get("/api/owner/security-check")
                                .header(
                                        "Authorization",
                                        bearer(ownerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void shouldAllowAdminToAccessOwnerAndAdminEndpoints()
            throws Exception {
        mockMvc.perform(
                        get("/api/owner/security-check")
                                .header(
                                        "Authorization",
                                        bearer(adminToken)
                                )
                )
                .andExpect(status().isOk());

        mockMvc.perform(
                        get("/api/admin/security-check")
                                .header(
                                        "Authorization",
                                        bearer(adminToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    private User createUser(
            String name,
            String email,
            UserRole role
    ) {
        return userRepository.saveAndFlush(
                new User(
                        name,
                        email,
                        passwordEncoder.encode("StrongPass123"),
                        role
                )
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    @RestController
    static class SecurityProbeController {

        @GetMapping("/api/private/security-check")
        Map<String, String> authenticated() {
            return Map.of("access", "AUTHENTICATED");
        }

        @GetMapping("/api/customer/security-check")
        Map<String, String> customer() {
            return Map.of("role", "CUSTOMER");
        }

        @GetMapping("/api/owner/security-check")
        Map<String, String> owner() {
            return Map.of("role", "OWNER");
        }

        @GetMapping("/api/admin/security-check")
        Map<String, String> admin() {
            return Map.of("role", "ADMIN");
        }
    }
}
