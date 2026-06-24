package com.skcet.restaurantreservation.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
class CustomerRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearUsers() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterCustomerAndStoreBcryptPassword() throws Exception {
        String requestBody = """
                {
                  "name": "John Doe",
                  "email": "John@example.com",
                  "password": "StrongPass123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("John Doe"))
                .andExpect(jsonPath("$.email").value("john@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User savedCustomer = userRepository
                .findByEmailIgnoreCase("john@example.com")
                .orElseThrow();

        assertThat(savedCustomer.getRole()).isEqualTo(UserRole.CUSTOMER);
        assertThat(savedCustomer.getPasswordHash())
                .isNotEqualTo("StrongPass123");
        assertThat(savedCustomer.getPasswordHash())
                .startsWith("$2");
        assertThat(
                passwordEncoder.matches(
                        "StrongPass123",
                        savedCustomer.getPasswordHash()
                )
        ).isTrue();
    }

    @Test
    void shouldRejectDuplicateEmailIgnoringCase() throws Exception {
        userRepository.saveAndFlush(
                new User(
                        "Existing Customer",
                        "customer@example.com",
                        passwordEncoder.encode("ExistingPass123"),
                        UserRole.CUSTOMER
                )
        );

        String requestBody = """
                {
                  "name": "Another Customer",
                  "email": "CUSTOMER@example.com",
                  "password": "AnotherPass123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_EMAIL"))
                .andExpect(jsonPath("$.message").value(
                        "An account already exists for email: customer@example.com"
                ));

        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    void shouldRejectInvalidRegistrationRequest() throws Exception {
        String requestBody = """
                {
                  "name": "",
                  "email": "invalid-email",
                  "password": "short"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code")
                        .value("REGISTRATION_VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        assertThat(userRepository.count()).isZero();
    }
}
