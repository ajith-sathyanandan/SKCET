package com.skcet.restaurantreservation.restaurant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.repository.RestaurantRepository;
import com.skcet.restaurantreservation.repository.UserRepository;
import com.skcet.restaurantreservation.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
class RestaurantCrudIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private User secondOwner;
    private User customer;
    private User admin;

    @BeforeEach
    void setup() {
        restaurantRepository.deleteAll();
        userRepository.deleteAll();

        owner = createUser(
                "Owner",
                "owner@example.com",
                UserRole.OWNER
        );

        secondOwner = createUser(
                "Second Owner",
                "second.owner@example.com",
                UserRole.OWNER
        );

        customer = createUser(
                "Customer",
                "customer@example.com",
                UserRole.CUSTOMER
        );

        admin = createUser(
                "Admin",
                "admin@example.com",
                UserRole.ADMIN
        );
    }

    @Test
    void shouldCreateAndRetrieveRestaurant() throws Exception {
        mockMvc.perform(
                        post("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(owner)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Italian Delight",
                                        "Italian",
                                        "11:00:00",
                                        "22:00:00"
                                ))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ownerId")
                        .value(owner.getId()))
                .andExpect(jsonPath("$.name")
                        .value("Italian Delight"));

        Long restaurantId =
                restaurantRepository.findAll().get(0).getId();

        mockMvc.perform(
                        get(
                                "/api/restaurants/{id}",
                                restaurantId
                        )
                                .header(
                                        "Authorization",
                                        bearer(customer)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cuisine")
                        .value("Italian"));
    }

    @Test
    void shouldUpdateOwnedRestaurant() throws Exception {
        Restaurant restaurant = createRestaurant(
                owner,
                "Old Name",
                "Indian"
        );

        mockMvc.perform(
                        put(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(owner)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Updated Name",
                                        "Continental",
                                        "10:00:00",
                                        "23:00:00"
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name")
                        .value("Updated Name"));

        assertThat(
                restaurantRepository
                        .findById(restaurant.getId())
                        .orElseThrow()
                        .getName()
        ).isEqualTo("Updated Name");
    }

    @Test
    void shouldSearchCuisineIgnoringCase() throws Exception {
        createRestaurant(
                owner,
                "Italian Delight",
                "Italian"
        );

        createRestaurant(
                owner,
                "Pasta House",
                "ITALIAN"
        );

        createRestaurant(
                owner,
                "Spice Garden",
                "Indian"
        );

        mockMvc.perform(
                        get("/api/restaurants/cuisine/italian")
                                .header(
                                        "Authorization",
                                        bearer(customer)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void shouldDeleteRestaurantAsAdmin() throws Exception {
        Restaurant restaurant = createRestaurant(
                owner,
                "Delete Me",
                "Fusion"
        );

        mockMvc.perform(
                        delete(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(admin)
                                )
                )
                .andExpect(status().isNoContent());

        assertThat(
                restaurantRepository.existsById(
                        restaurant.getId()
                )
        ).isFalse();
    }

    @Test
    void shouldEnforceRestaurantPermissions() throws Exception {
        Restaurant restaurant = createRestaurant(
                owner,
                "Private Restaurant",
                "Indian"
        );

        mockMvc.perform(
                        post("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(customer)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Forbidden",
                                        "Indian",
                                        "11:00:00",
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
                                        bearer(secondOwner)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Wrong Update",
                                        "Fusion",
                                        "11:00:00",
                                        "22:00:00"
                                ))
                )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        delete(
                                "/api/restaurants/{id}",
                                restaurant.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(owner)
                                )
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnNotFoundAndRejectInvalidHours()
            throws Exception {
        mockMvc.perform(
                        get("/api/restaurants/999999")
                                .header(
                                        "Authorization",
                                        bearer(customer)
                                )
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code")
                        .value("RESTAURANT_NOT_FOUND"));

        mockMvc.perform(
                        post("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(owner)
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(restaurantJson(
                                        "Invalid Hours",
                                        "Indian",
                                        "22:00:00",
                                        "11:00:00"
                                ))
                )
                .andExpect(status().isBadRequest());
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

    private Restaurant createRestaurant(
            User restaurantOwner,
            String name,
            String cuisine
    ) {
        return restaurantRepository.saveAndFlush(
                new Restaurant(
                        restaurantOwner,
                        name,
                        "123 Main Street",
                        cuisine,
                        LocalTime.of(11, 0),
                        LocalTime.of(22, 0)
                )
        );
    }

    private String bearer(User user) {
        return "Bearer " + jwtService.generateToken(user);
    }

    private String restaurantJson(
            String name,
            String cuisine,
            String openingTime,
            String closingTime
    ) {
        return """
                {
                  "name": "%s",
                  "address": "123 Main Street",
                  "cuisine": "%s",
                  "openingTime": "%s",
                  "closingTime": "%s"
                }
                """.formatted(
                name,
                cuisine,
                openingTime,
                closingTime
        );
    }
}
