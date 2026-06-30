package com.skcet.restaurantreservation.restaurant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

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
class RestaurantDiscoveryIntegrationTest {

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

    private User owner;
    private User customer;
    private String customerToken;

    @BeforeEach
    void setup() {
        restaurantTableRepository.deleteAll();
        restaurantRepository.deleteAll();
        userRepository.deleteAll();

        owner = createUser(
                "Restaurant Owner",
                "owner@example.com",
                UserRole.OWNER
        );

        customer = createUser(
                "Customer",
                "customer@example.com",
                UserRole.CUSTOMER
        );

        customerToken = jwtService.generateToken(customer);
    }

    @Test
    void shouldListRestaurantsForAuthenticatedCustomer()
            throws Exception {
        createRestaurant(
                "Spice Garden",
                "RS Puram, Coimbatore",
                "Indian"
        );

        createRestaurant(
                "Pasta Corner",
                "Gandhipuram, Coimbatore",
                "Italian"
        );

        mockMvc.perform(
                        get("/api/restaurants")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name")
                        .value("Pasta Corner"))
                .andExpect(jsonPath("$[1].name")
                        .value("Spice Garden"));
    }

    @Test
    void shouldSearchByRestaurantNameAndCuisine()
            throws Exception {
        createRestaurant(
                "Harbor Grill",
                "Race Course, Coimbatore",
                "Seafood"
        );

        createRestaurant(
                "Pasta Corner",
                "Gandhipuram, Coimbatore",
                "Italian"
        );

        createRestaurant(
                "Spice Route",
                "RS Puram, Coimbatore",
                "Indian"
        );

        mockMvc.perform(
                        get("/api/restaurants")
                                .param("search", "harbor")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name")
                        .value("Harbor Grill"));

        mockMvc.perform(
                        get("/api/restaurants")
                                .param("q", "italian")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].cuisine")
                        .value("Italian"));
    }

    @Test
    void shouldFilterByCuisineAndLocation()
            throws Exception {
        createRestaurant(
                "Coimbatore Spice",
                "RS Puram, Coimbatore",
                "Indian"
        );

        createRestaurant(
                "Chennai Spice",
                "Anna Nagar, Chennai",
                "Indian"
        );

        createRestaurant(
                "Coimbatore Pasta",
                "Peelamedu, Coimbatore",
                "Italian"
        );

        mockMvc.perform(
                        get("/api/restaurants")
                                .param("cuisine", "indian")
                                .param("location", "coimbatore")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name")
                        .value("Coimbatore Spice"));
    }

    @Test
    void shouldReturnRestaurantDetailsWithTableInformation()
            throws Exception {
        Restaurant restaurant = createRestaurant(
                "Family Dining",
                "Avinashi Road, Coimbatore",
                "Multi Cuisine",
                LocalTime.of(9, 0),
                LocalTime.of(23, 0)
        );

        restaurantTableRepository.saveAndFlush(
                new RestaurantTable(restaurant, 1, 2)
        );

        restaurantTableRepository.saveAndFlush(
                new RestaurantTable(restaurant, 2, 4)
        );

        restaurantTableRepository.saveAndFlush(
                new RestaurantTable(restaurant, 3, 6)
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
                .andExpect(jsonPath("$.name")
                        .value("Family Dining"))
                .andExpect(jsonPath("$.openingTime")
                        .value("09:00:00"))
                .andExpect(jsonPath("$.closingTime")
                        .value("23:00:00"))
                .andExpect(jsonPath("$.totalTables")
                        .value(3))
                .andExpect(jsonPath("$.totalCapacity")
                        .value(12))
                .andExpect(jsonPath("$.tables.length()")
                        .value(3))
                .andExpect(jsonPath("$.tables[0].tableNumber")
                        .value(1))
                .andExpect(jsonPath("$.tables[0].capacity")
                        .value(2));
    }

    @Test
    void shouldReturnEmptyListWhenNoRestaurantsMatch()
            throws Exception {
        createRestaurant(
                "Spice Garden",
                "RS Puram, Coimbatore",
                "Indian"
        );

        mockMvc.perform(
                        get("/api/restaurants")
                                .param("search", "not-existing")
                                .header(
                                        "Authorization",
                                        bearer(customerToken)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void shouldRejectUnauthenticatedDiscoveryRequests()
            throws Exception {
        mockMvc.perform(get("/api/restaurants"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/restaurants/1"))
                .andExpect(status().isUnauthorized());
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
            String name,
            String address,
            String cuisine
    ) {
        return createRestaurant(
                name,
                address,
                cuisine,
                LocalTime.of(11, 0),
                LocalTime.of(22, 0)
        );
    }

    private Restaurant createRestaurant(
            String name,
            String address,
            String cuisine,
            LocalTime openingTime,
            LocalTime closingTime
    ) {
        return restaurantRepository.saveAndFlush(
                new Restaurant(
                        owner,
                        name,
                        address,
                        cuisine,
                        openingTime,
                        closingTime
                )
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
