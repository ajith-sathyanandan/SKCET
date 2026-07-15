package com.skcet.restaurantreservation.acceptance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalTime;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
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
import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.RestaurantRepository;
import com.skcet.restaurantreservation.repository.RestaurantTableRepository;
import com.skcet.restaurantreservation.repository.UserRepository;
import com.skcet.restaurantreservation.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
class RestaurantUserManagementAcceptanceTest {

    private static final String PASSWORD = "StrongPass123";

    private static final String NEW_PASSWORD =
            "NewSecurePass123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniqueValue;

    private User owner;
    private User secondOwner;
    private User customer;
    private User admin;

    private String ownerToken;
    private String secondOwnerToken;
    private String customerToken;
    private String adminToken;

    @BeforeEach
    void prepareUsers() {
        uniqueValue = UUID.randomUUID()
                .toString()
                .substring(0, 8);

        owner = createUser(
                "Owner " + uniqueValue,
                "owner-" + uniqueValue + "@example.com",
                UserRole.OWNER,
                PASSWORD
        );

        secondOwner = createUser(
                "Second Owner " + uniqueValue,
                "second-owner-" + uniqueValue + "@example.com",
                UserRole.OWNER,
                PASSWORD
        );

        customer = createUser(
                "Customer " + uniqueValue,
                "customer-" + uniqueValue + "@example.com",
                UserRole.CUSTOMER,
                PASSWORD
        );

        admin = createUser(
                "Admin " + uniqueValue,
                "admin-" + uniqueValue + "@example.com",
                UserRole.ADMIN,
                PASSWORD
        );

        ownerToken = jwtService.generateToken(owner);
        secondOwnerToken = jwtService.generateToken(secondOwner);
        customerToken = jwtService.generateToken(customer);
        adminToken = jwtService.generateToken(admin);
    }

    @Test
    void shouldCompleteRestaurantCreateGetUpdateDeleteWorkflow()
            throws Exception {
        String originalName =
                "Acceptance Restaurant " + uniqueValue;

        MvcResult createResult = mockMvc.perform(
                        post("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(ownerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        originalName,
                                        "RS Puram " + uniqueValue,
                                        "Indian",
                                        "10:00:00",
                                        "22:00:00"
                                ))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.ownerId")
                        .value(owner.getId()))
                .andExpect(jsonPath("$.name")
                        .value(originalName))
                .andReturn();

        Long restaurantId = responseId(createResult);

        mockMvc.perform(
                        get(
                                "/api/restaurants/{id}",
                                restaurantId
                        )
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(restaurantId))
                .andExpect(jsonPath("$.name")
                        .value(originalName))
                .andExpect(jsonPath("$.openingTime")
                        .value("10:00:00"))
                .andExpect(jsonPath("$.closingTime")
                        .value("22:00:00"));

        String updatedName =
                "Updated Restaurant " + uniqueValue;

        mockMvc.perform(
                        put(
                                "/api/restaurants/{id}",
                                restaurantId
                        )
                                .header(
                                        "Authorization",
                                        bearer(ownerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        updatedName,
                                        "Peelamedu " + uniqueValue,
                                        "Continental",
                                        "09:00:00",
                                        "23:00:00"
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name")
                        .value(updatedName))
                .andExpect(jsonPath("$.cuisine")
                        .value("Continental"));

        mockMvc.perform(
                        delete(
                                "/api/restaurants/{id}",
                                restaurantId
                        )
                                .header(
                                        "Authorization",
                                        bearer(adminToken)
                                )
                )
                .andExpect(status().isNoContent());

        assertThat(
                restaurantRepository.existsById(restaurantId)
        ).isFalse();

        mockMvc.perform(
                        get(
                                "/api/restaurants/{id}",
                                restaurantId
                        )
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code")
                        .value("RESTAURANT_NOT_FOUND"));
    }

    @Test
    void shouldSearchAndFilterRestaurants()
            throws Exception {
        String cuisine =
                "Fusion" + uniqueValue;

        String location =
                "DiscoveryArea" + uniqueValue;

        createRestaurant(
                owner,
                "Search Target " + uniqueValue,
                location + ", Coimbatore",
                cuisine
        );

        createRestaurant(
                owner,
                "Other Restaurant " + uniqueValue,
                "DifferentArea " + uniqueValue,
                "Italian"
        );

        mockMvc.perform(
                        get("/api/restaurants")
                                .param(
                                        "search",
                                        "Search Target "
                                                + uniqueValue
                                )
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()")
                        .value(1))
                .andExpect(jsonPath("$[0].name")
                        .value(
                                "Search Target "
                                        + uniqueValue
                        ));

        mockMvc.perform(
                        get("/api/restaurants")
                                .param("cuisine", cuisine)
                                .param("location", location)
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()")
                        .value(1))
                .andExpect(jsonPath("$[0].cuisine")
                        .value(cuisine));
    }

    @Test
    void shouldReturnRestaurantTableInformation()
            throws Exception {
        Restaurant restaurant = createRestaurant(
                owner,
                "Table Details " + uniqueValue,
                "Avinashi Road " + uniqueValue,
                "Multi Cuisine"
        );

        restaurantTableRepository.saveAndFlush(
                new RestaurantTable(
                        restaurant,
                        1,
                        2
                )
        );

        restaurantTableRepository.saveAndFlush(
                new RestaurantTable(
                        restaurant,
                        2,
                        4
                )
        );

        mockMvc.perform(
                        get(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTables")
                        .value(2))
                .andExpect(jsonPath("$.totalCapacity")
                        .value(6))
                .andExpect(jsonPath("$.tables.length()")
                        .value(2))
                .andExpect(jsonPath("$.tables[0].tableNumber")
                        .value(1))
                .andExpect(jsonPath("$.tables[1].capacity")
                        .value(4));
    }

    @Test
    void shouldEnforceOwnerAndCustomerAuthorization()
            throws Exception {
        Restaurant restaurant = createRestaurant(
                owner,
                "Private Restaurant " + uniqueValue,
                "Race Course " + uniqueValue,
                "Indian"
        );

        mockMvc.perform(
                        post("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Customer Attempt "
                                                + uniqueValue,
                                        "Forbidden Address",
                                        "Indian",
                                        "10:00:00",
                                        "22:00:00"
                                ))
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        put(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(secondOwnerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Unauthorized Update",
                                        "Wrong Address",
                                        "Fusion",
                                        "10:00:00",
                                        "22:00:00"
                                ))
                )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code")
                        .value("RESTAURANT_ACCESS_DENIED"));

        mockMvc.perform(
                        delete(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(ownerToken)
                                )
                )
                .andExpect(status().isForbidden());

        assertThat(
                restaurantRepository.existsById(
                        restaurant.getId()
                )
        ).isTrue();
    }

    @Test
    void shouldExposeOnlyAuthenticatedUsersProfile()
            throws Exception {
        mockMvc.perform(
                        get("/api/profile")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(customer.getId()))
                .andExpect(jsonPath("$.email")
                        .value(customer.getEmail()))
                .andExpect(jsonPath("$.passwordHash")
                        .doesNotExist());

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldProtectProfileFromDuplicateEmail()
            throws Exception {
        mockMvc.perform(
                        put("/api/profile")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(profileJson(
                                        "Updated Customer",
                                        owner.getEmail()
                                ))
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code")
                        .value("DUPLICATE_EMAIL"));

        User unchangedCustomer = userRepository
                .findById(customer.getId())
                .orElseThrow();

        assertThat(unchangedCustomer.getEmail())
                .isEqualTo(customer.getEmail());
    }

    @Test
    void shouldRequireCorrectCurrentPassword()
            throws Exception {
        String originalPasswordHash =
                customer.getPasswordHash();

        mockMvc.perform(
                        put("/api/profile/password")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "currentPassword": "WrongPassword123",
                                          "newPassword": "NewSecurePass123"
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code")
                        .value("INVALID_CURRENT_PASSWORD"));

        User unchangedCustomer = userRepository
                .findById(customer.getId())
                .orElseThrow();

        assertThat(unchangedCustomer.getPasswordHash())
                .isEqualTo(originalPasswordHash);
    }

    @Test
    void shouldChangePasswordWithBcryptAndAllowNewLogin()
            throws Exception {
        String originalPasswordHash =
                customer.getPasswordHash();

        mockMvc.perform(
                        put("/api/profile/password")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "currentPassword": "StrongPass123",
                                          "newPassword": "NewSecurePass123"
                                        }
                                        """)
                )
                .andExpect(status().isNoContent());

        User updatedCustomer = userRepository
                .findById(customer.getId())
                .orElseThrow();

        assertThat(updatedCustomer.getPasswordHash())
                .isNotEqualTo(originalPasswordHash);

        assertThat(updatedCustomer.getPasswordHash())
                .isNotEqualTo(NEW_PASSWORD);

        assertThat(
                passwordEncoder.matches(
                        NEW_PASSWORD,
                        updatedCustomer.getPasswordHash()
                )
        ).isTrue();

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(loginJson(
                                        customer.getEmail(),
                                        PASSWORD
                                ))
                )
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(loginJson(
                                        customer.getEmail(),
                                        NEW_PASSWORD
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken")
                        .isNotEmpty())
                .andExpect(jsonPath("$.user.id")
                        .value(customer.getId()));
    }

    @AfterEach
    void cleanUpAfterTest() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        restaurantTableRepository.deleteAllInBatch();
        restaurantRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }
    private User createUser(
            String name,
            String email,
            UserRole role,
            String password
    ) {
        return userRepository.saveAndFlush(
                new User(
                        name,
                        email,
                        passwordEncoder.encode(password),
                        role
                )
        );
    }

    private Restaurant createRestaurant(
            User restaurantOwner,
            String name,
            String address,
            String cuisine
    ) {
        return restaurantRepository.saveAndFlush(
                new Restaurant(
                        restaurantOwner,
                        name,
                        address,
                        cuisine,
                        LocalTime.of(10, 0),
                        LocalTime.of(22, 0)
                )
        );
    }

    private Long responseId(MvcResult result)
            throws Exception {
        JsonNode response = objectMapper.readTree(
                result.getResponse().getContentAsString()
        );

        return response.get("id").asLong();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String restaurantJson(
            String name,
            String address,
            String cuisine,
            String openingTime,
            String closingTime
    ) {
        return """
                {
                  "name": "%s",
                  "address": "%s",
                  "cuisine": "%s",
                  "openingTime": "%s",
                  "closingTime": "%s"
                }
                """.formatted(
                name,
                address,
                cuisine,
                openingTime,
                closingTime
        );
    }

    private String profileJson(
            String name,
            String email
    ) {
        return """
                {
                  "name": "%s",
                  "email": "%s"
                }
                """.formatted(name, email);
    }

    private String loginJson(
            String email,
            String password
    ) {
        return """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);
    }
}
