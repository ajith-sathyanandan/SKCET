package com.skcet.restaurantreservation.profile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

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
import com.skcet.restaurantreservation.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileManagementIntegrationTest {

    private static final String CURRENT_PASSWORD =
            "CurrentPass123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User currentUser;
    private User otherUser;
    private String accessToken;

    @BeforeEach
    void setup() {
        String uniqueValue = UUID.randomUUID().toString();

        currentUser = userRepository.saveAndFlush(
                new User(
                        "Current User",
                        "current-" + uniqueValue + "@example.com",
                        passwordEncoder.encode(CURRENT_PASSWORD),
                        UserRole.CUSTOMER
                )
        );

        otherUser = userRepository.saveAndFlush(
                new User(
                        "Other User",
                        "other-" + uniqueValue + "@example.com",
                        passwordEncoder.encode("OtherPass123"),
                        UserRole.CUSTOMER
                )
        );

        accessToken = jwtService.generateToken(currentUser);
    }

    @Test
    void shouldReturnOnlyAuthenticatedUsersProfile()
            throws Exception {
        mockMvc.perform(
                        get("/api/profile")
                                .header(
                                        "Authorization",
                                        bearer(accessToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(currentUser.getId()))
                .andExpect(jsonPath("$.name")
                        .value("Current User"))
                .andExpect(jsonPath("$.email")
                        .value(currentUser.getEmail()))
                .andExpect(jsonPath("$.role")
                        .value("CUSTOMER"))
                .andExpect(jsonPath("$.passwordHash")
                        .doesNotExist());
    }

    @Test
    void shouldUpdateOnlyAuthenticatedUsersProfile()
            throws Exception {
        String updatedEmail =
                "UPDATED-" + UUID.randomUUID()
                        + "@EXAMPLE.COM";

        mockMvc.perform(
                        put("/api/profile")
                                .header(
                                        "Authorization",
                                        bearer(accessToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "name": "Updated User",
                                          "email": "%s"
                                        }
                                        """.formatted(updatedEmail))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken")
                        .isNotEmpty())
                .andExpect(jsonPath("$.tokenType")
                        .value("Bearer"))
                .andExpect(jsonPath("$.expiresIn")
                        .isNumber())
                .andExpect(jsonPath("$.user.id")
                        .value(currentUser.getId()))
                .andExpect(jsonPath("$.user.name")
                        .value("Updated User"))
                .andExpect(jsonPath("$.user.email")
                        .value(updatedEmail.toLowerCase()));

        User updatedUser = userRepository
                .findById(currentUser.getId())
                .orElseThrow();

        User unchangedOtherUser = userRepository
                .findById(otherUser.getId())
                .orElseThrow();

        assertThat(updatedUser.getName())
                .isEqualTo("Updated User");

        assertThat(updatedUser.getEmail())
                .isEqualTo(updatedEmail.toLowerCase());

        assertThat(unchangedOtherUser.getName())
                .isEqualTo("Other User");
    }

    @Test
    void shouldRejectDuplicateProfileEmail()
            throws Exception {
        mockMvc.perform(
                        put("/api/profile")
                                .header(
                                        "Authorization",
                                        bearer(accessToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "name": "Current User",
                                          "email": "%s"
                                        }
                                        """.formatted(otherUser.getEmail()))
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code")
                        .value("DUPLICATE_EMAIL"));
    }

    @Test
    void shouldRejectIncorrectCurrentPassword()
            throws Exception {
        String originalHash =
                currentUser.getPasswordHash();

        mockMvc.perform(
                        put("/api/profile/password")
                                .header(
                                        "Authorization",
                                        bearer(accessToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "currentPassword": "WrongPass123",
                                          "newPassword": "NewSecurePass123"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code")
                        .value("INVALID_CURRENT_PASSWORD"));

        User unchangedUser = userRepository
                .findById(currentUser.getId())
                .orElseThrow();

        assertThat(unchangedUser.getPasswordHash())
                .isEqualTo(originalHash);
    }

    @Test
    void shouldStoreChangedPasswordUsingBcrypt()
            throws Exception {
        String originalHash =
                currentUser.getPasswordHash();

        mockMvc.perform(
                        put("/api/profile/password")
                                .header(
                                        "Authorization",
                                        bearer(accessToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "currentPassword": "CurrentPass123",
                                          "newPassword": "NewSecurePass123"
                                        }
                                        """)
                )
                .andExpect(status().isNoContent());

        User updatedUser = userRepository
                .findById(currentUser.getId())
                .orElseThrow();

        assertThat(updatedUser.getPasswordHash())
                .isNotEqualTo(originalHash);

        assertThat(updatedUser.getPasswordHash())
                .isNotEqualTo("NewSecurePass123");

        assertThat(
                passwordEncoder.matches(
                        "NewSecurePass123",
                        updatedUser.getPasswordHash()
                )
        ).isTrue();

        assertThat(
                passwordEncoder.matches(
                        CURRENT_PASSWORD,
                        updatedUser.getPasswordHash()
                )
        ).isFalse();
    }

    @Test
    void shouldRequireAuthenticationForProfileEndpoints()
            throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        put("/api/profile")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "name": "Unauthenticated",
                                          "email": "guest@example.com"
                                        }
                                        """)
                )
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        put("/api/profile/password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "currentPassword": "CurrentPass123",
                                          "newPassword": "NewSecurePass123"
                                        }
                                        """)
                )
                .andExpect(status().isUnauthorized());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
