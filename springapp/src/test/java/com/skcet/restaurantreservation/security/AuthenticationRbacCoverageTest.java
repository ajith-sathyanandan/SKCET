package com.skcet.restaurantreservation.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.UserRepository;
import com.skcet.restaurantreservation.service.JwtService;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@SpringBootTest(properties = {
        "JWT_SECRET="
                + AuthenticationRbacCoverageTest.TEST_JWT_SECRET,
        "JWT_EXPIRATION_MINUTES=60"
})
@AutoConfigureMockMvc
@Import(AuthenticationRbacCoverageTest.SecurityTestController.class)
class AuthenticationRbacCoverageTest {

    static final String TEST_JWT_SECRET =
            "issue-33-test-secret-for-jwt-authentication-"
                    + "and-rbac-coverage-2026";

    private static final String PASSWORD = "StrongPass123";

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
    private User owner;
    private User admin;

    @BeforeEach
    void prepareUsers() {
        userRepository.deleteAll();

        customer = createUser(
                "Customer",
                "customer@example.com",
                UserRole.CUSTOMER
        );

        owner = createUser(
                "Owner",
                "owner@example.com",
                UserRole.OWNER
        );

        admin = createUser(
                "Administrator",
                "admin@example.com",
                UserRole.ADMIN
        );
    }

    @Test
    void shouldRegisterAndLoginCustomerThroughRealEndpoints()
            throws Exception {
        String registration = """
                {
                  "name": "New Customer",
                  "email": "new.customer@example.com",
                  "password": "RegistrationPass123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registration)
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email")
                        .value("new.customer@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User registeredUser = userRepository
                .findByEmailIgnoreCase("new.customer@example.com")
                .orElseThrow();

        assertThat(registeredUser.getPasswordHash())
                .isNotEqualTo("RegistrationPass123");

        assertThat(
                passwordEncoder.matches(
                        "RegistrationPass123",
                        registeredUser.getPasswordHash()
                )
        ).isTrue();

        String login = """
                {
                  "email": "new.customer@example.com",
                  "password": "RegistrationPass123"
                }
                """;

        MvcResult result = mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(login)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andReturn();

        JsonNode body = objectMapper.readTree(
                result.getResponse().getContentAsString()
        );

        String token = body.get("accessToken").asText();

        mockMvc.perform(
                        get("/api/customer/security-coverage")
                                .header(
                                        "Authorization",
                                        bearer(token)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void shouldRejectRegistrationAndLoginFailureCases()
            throws Exception {
        String duplicateRegistration = """
                {
                  "name": "Duplicate Customer",
                  "email": "CUSTOMER@example.com",
                  "password": "AnotherStrongPass123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(duplicateRegistration)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code")
                        .value("DUPLICATE_EMAIL"));

        String wrongPasswordLogin = """
                {
                  "email": "customer@example.com",
                  "password": "WrongPassword123"
                }
                """;

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(wrongPasswordLogin)
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code")
                        .value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.accessToken").doesNotExist());

        String invalidLoginRequest = """
                {
                  "email": "invalid-email",
                  "password": ""
                }
                """;

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(invalidLoginRequest)
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code")
                        .value("REGISTRATION_VALIDATION_FAILED"));
    }

    @Test
    void shouldRejectMalformedAndTamperedTokens()
            throws Exception {
        mockMvc.perform(
                        get("/api/private/security-coverage")
                                .header(
                                        "Authorization",
                                        "Bearer not-a-valid-jwt"
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        String tokenSignedWithWrongKey = createToken(
                customer,
                Instant.now().minusSeconds(10),
                Instant.now().plusSeconds(600),
                Keys.hmacShaKeyFor(
                        (
                                "different-signing-secret-for-invalid-"
                                        + "jwt-test-2026-1234567890"
                        ).getBytes(StandardCharsets.UTF_8)
                )
        );

        mockMvc.perform(
                        get("/api/private/security-coverage")
                                .header(
                                        "Authorization",
                                        bearer(tokenSignedWithWrongKey)
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldRejectExpiredToken()
            throws Exception {
        Instant now = Instant.now();

        String expiredToken = createToken(
                customer,
                now.minusSeconds(600),
                now.minusSeconds(60),
                testSigningKey()
        );

        mockMvc.perform(
                        get("/api/private/security-coverage")
                                .header(
                                        "Authorization",
                                        bearer(expiredToken)
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldRejectTokenWhenUserNoLongerExists()
            throws Exception {
        String token = jwtService.generateToken(customer);
        userRepository.delete(customer);
        userRepository.flush();

        mockMvc.perform(
                        get("/api/private/security-coverage")
                                .header(
                                        "Authorization",
                                        bearer(token)
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldRejectTokenWhoseRoleClaimDoesNotMatchDatabase()
            throws Exception {
        Instant now = Instant.now();

        String forgedRoleToken = Jwts.builder()
                .subject(customer.getId().toString())
                .claim("email", customer.getEmail())
                .claim("role", "ADMIN")
                .issuedAt(Date.from(now.minusSeconds(10)))
                .expiration(Date.from(now.plusSeconds(600)))
                .signWith(testSigningKey())
                .compact();

        mockMvc.perform(
                        get("/api/admin/security-coverage")
                                .header(
                                        "Authorization",
                                        bearer(forgedRoleToken)
                                )
                )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void shouldEnforceCustomerRolePermissions()
            throws Exception {
        String token = jwtService.generateToken(customer);

        expectAllowed(
                "/api/customer/security-coverage",
                token,
                "CUSTOMER"
        );

        expectForbidden(
                "/api/owner/security-coverage",
                token
        );

        expectForbidden(
                "/api/admin/security-coverage",
                token
        );
    }

    @Test
    void shouldEnforceOwnerRolePermissions()
            throws Exception {
        String token = jwtService.generateToken(owner);

        expectAllowed(
                "/api/owner/security-coverage",
                token,
                "OWNER"
        );

        expectForbidden(
                "/api/customer/security-coverage",
                token
        );

        expectForbidden(
                "/api/admin/security-coverage",
                token
        );
    }

    @Test
    void shouldAllowAdminAcrossAllRoleNamespaces()
            throws Exception {
        String token = jwtService.generateToken(admin);

        expectAllowed(
                "/api/customer/security-coverage",
                token,
                "CUSTOMER"
        );

        expectAllowed(
                "/api/owner/security-coverage",
                token,
                "OWNER"
        );

        expectAllowed(
                "/api/admin/security-coverage",
                token,
                "ADMIN"
        );
    }

    @Test
    void shouldKeepPublicEndpointsOpenAndPrivateEndpointsProtected()
            throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "email": "missing@example.com",
                                          "password": "StrongPass123"
                                        }
                                        """)
                )
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/private/security-coverage"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
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
                        passwordEncoder.encode(PASSWORD),
                        role
                )
        );
    }

    private String createToken(
            User user,
            Instant issuedAt,
            Instant expiresAt,
            SecretKey signingKey
    ) {
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    private SecretKey testSigningKey() {
        return Keys.hmacShaKeyFor(
                TEST_JWT_SECRET.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private void expectAllowed(
            String path,
            String token,
            String expectedRole
    ) throws Exception {
        mockMvc.perform(
                        get(path)
                                .header(
                                        "Authorization",
                                        bearer(token)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role")
                        .value(expectedRole));
    }

    private void expectForbidden(
            String path,
            String token
    ) throws Exception {
        mockMvc.perform(
                        get(path)
                                .header(
                                        "Authorization",
                                        bearer(token)
                                )
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @RestController
    static class SecurityTestController {

        @GetMapping("/api/private/security-coverage")
        Map<String, String> authenticated() {
            return Map.of("access", "AUTHENTICATED");
        }

        @GetMapping("/api/customer/security-coverage")
        Map<String, String> customer() {
            return Map.of("role", "CUSTOMER");
        }

        @GetMapping("/api/owner/security-coverage")
        Map<String, String> owner() {
            return Map.of("role", "OWNER");
        }

        @GetMapping("/api/admin/security-coverage")
        Map<String, String> admin() {
            return Map.of("role", "ADMIN");
        }
    }
}
