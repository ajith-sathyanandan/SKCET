package com.skcet.restaurantreservation.authentication;

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
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.UserRepository;
import com.skcet.restaurantreservation.service.JwtService;

import io.jsonwebtoken.Claims;

@SpringBootTest
@AutoConfigureMockMvc
class LoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User customer;

    @BeforeEach
    void createCustomer() {
        userRepository.deleteAll();

        customer = userRepository.saveAndFlush(
                new User(
                        "John Doe",
                        "john@example.com",
                        passwordEncoder.encode("StrongPass123"),
                        UserRole.CUSTOMER
                )
        );
    }

    @Test
    void shouldAuthenticateAndReturnSignedJwtWithIdentityAndRole()
            throws Exception {
        String requestBody = """
                {
                  "email": "JOHN@example.com",
                  "password": "StrongPass123"
                }
                """;

        MvcResult result = mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.id").value(customer.getId()))
                .andExpect(jsonPath("$.user.email").value("john@example.com"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        JsonNode responseBody = objectMapper.readTree(
                result.getResponse().getContentAsString()
        );
        String token = responseBody.get("accessToken").asText();

        Claims claims = jwtService.parseClaims(token);

        assertThat(claims.getSubject())
                .isEqualTo(customer.getId().toString());
        assertThat(claims.get("email", String.class))
                .isEqualTo("john@example.com");
        assertThat(claims.get("role", String.class))
                .isEqualTo("CUSTOMER");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @Test
    void shouldRejectIncorrectPasswordWithUnauthorizedResponse()
            throws Exception {
        String requestBody = """
                {
                  "email": "john@example.com",
                  "password": "WrongPassword123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid email or password")
                )
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void shouldRejectUnknownEmailWithUnauthorizedResponse()
            throws Exception {
        String requestBody = """
                {
                  "email": "missing@example.com",
                  "password": "StrongPass123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(
                        jsonPath("$.message")
                                .value("Invalid email or password")
                );
    }
}
