package com.skcet.restaurantreservation.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skcet.restaurantreservation.dto.RestaurantDetailsResponse;
import com.skcet.restaurantreservation.dto.RestaurantRequest;
import com.skcet.restaurantreservation.dto.RestaurantResponse;
import com.skcet.restaurantreservation.service.RestaurantService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(
            RestaurantService restaurantService
    ) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<RestaurantResponse> create(
            @Valid @RequestBody RestaurantRequest request
    ) {
        RestaurantResponse response =
                restaurantService.create(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<RestaurantResponse> findAll(
            @RequestParam(required = false)
            String search,

            @RequestParam(
                    name = "q",
                    required = false
            )
            String query,

            @RequestParam(required = false)
            String cuisine,

            @RequestParam(required = false)
            String location
    ) {
        String effectiveSearch =
                StringUtils.hasText(search)
                        ? search
                        : query;

        return restaurantService.discover(
                effectiveSearch,
                cuisine,
                location
        );
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public RestaurantDetailsResponse findById(
            @PathVariable Long id
    ) {
        return restaurantService.findById(id);
    }

    @GetMapping("/cuisine/{cuisine}")
    @PreAuthorize("isAuthenticated()")
    public List<RestaurantResponse> findByCuisine(
            @PathVariable String cuisine
    ) {
        return restaurantService.findByCuisine(cuisine);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public RestaurantResponse update(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantRequest request
    ) {
        return restaurantService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        restaurantService.delete(id);

        return ResponseEntity.noContent().build();
    }
}
