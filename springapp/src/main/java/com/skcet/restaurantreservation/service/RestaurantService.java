package com.skcet.restaurantreservation.service;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.skcet.restaurantreservation.dto.RestaurantDetailsResponse;
import com.skcet.restaurantreservation.dto.RestaurantRequest;
import com.skcet.restaurantreservation.dto.RestaurantResponse;
import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.exception.InvalidRestaurantOwnerException;
import com.skcet.restaurantreservation.exception.RestaurantAccessDeniedException;
import com.skcet.restaurantreservation.exception.RestaurantNotFoundException;
import com.skcet.restaurantreservation.repository.RestaurantRepository;
import com.skcet.restaurantreservation.repository.RestaurantTableRepository;
import com.skcet.restaurantreservation.repository.UserRepository;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final UserRepository userRepository;

    public RestaurantService(
            RestaurantRepository restaurantRepository,
            RestaurantTableRepository restaurantTableRepository,
            UserRepository userRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RestaurantResponse create(RestaurantRequest request) {
        User currentUser = getCurrentUser();

        User owner = resolveOwner(
                currentUser,
                request.ownerId()
        );

        Restaurant restaurant = new Restaurant(
                owner,
                request.name().trim(),
                request.address().trim(),
                request.cuisine().trim(),
                request.openingTime(),
                request.closingTime()
        );

        Restaurant savedRestaurant =
                restaurantRepository.saveAndFlush(restaurant);

        return RestaurantResponse.from(savedRestaurant);
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponse> findAll() {
        return discover(null, null, null);
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponse> discover(
            String search,
            String cuisine,
            String location
    ) {
        return restaurantRepository
                .discover(
                        normalize(search),
                        normalize(cuisine),
                        normalize(location)
                )
                .stream()
                .map(RestaurantResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RestaurantDetailsResponse findById(Long id) {
        Restaurant restaurant = findRestaurant(id);

        List<RestaurantTable> tables =
                restaurantTableRepository
                        .findByRestaurant_IdOrderByTableNumberAsc(id);

        return RestaurantDetailsResponse.from(
                restaurant,
                tables
        );
    }

    @Transactional(readOnly = true)
    public List<RestaurantResponse> findByCuisine(
            String cuisine
    ) {
        return discover(null, cuisine, null);
    }

    @Transactional
    public RestaurantResponse update(
            Long id,
            RestaurantRequest request
    ) {
        Restaurant restaurant = findRestaurant(id);
        User currentUser = getCurrentUser();

        boolean administrator =
                currentUser.getRole() == UserRole.ADMIN;

        boolean restaurantOwner =
                currentUser.getRole() == UserRole.OWNER
                        && restaurant.getOwner()
                        .getId()
                        .equals(currentUser.getId());

        if (!administrator && !restaurantOwner) {
            throw new RestaurantAccessDeniedException();
        }

        restaurant.setName(request.name().trim());
        restaurant.setAddress(request.address().trim());
        restaurant.setCuisineType(request.cuisine().trim());
        restaurant.setOpeningTime(request.openingTime());
        restaurant.setClosingTime(request.closingTime());

        Restaurant updatedRestaurant =
                restaurantRepository.saveAndFlush(restaurant);

        return RestaurantResponse.from(updatedRestaurant);
    }

    @Transactional
    public void delete(Long id) {
        Restaurant restaurant = findRestaurant(id);

        restaurantRepository.delete(restaurant);
        restaurantRepository.flush();
    }

    private Restaurant findRestaurant(Long id) {
        return restaurantRepository
                .findById(id)
                .orElseThrow(
                        () -> new RestaurantNotFoundException(id)
                );
    }

    private String normalize(String value) {
        return StringUtils.hasText(value)
                ? value.trim()
                : null;
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || authentication.getName() == null) {
            throw new RestaurantAccessDeniedException();
        }

        return userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(
                        RestaurantAccessDeniedException::new
                );
    }

    private User resolveOwner(
            User currentUser,
            Long ownerId
    ) {
        if (currentUser.getRole() == UserRole.OWNER) {
            return currentUser;
        }

        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new RestaurantAccessDeniedException();
        }

        if (ownerId == null) {
            throw new InvalidRestaurantOwnerException(
                    "ownerId is required when an ADMIN creates a restaurant"
            );
        }

        User selectedOwner = userRepository
                .findById(ownerId)
                .orElseThrow(
                        () -> new InvalidRestaurantOwnerException(
                                "Restaurant owner was not found"
                        )
                );

        if (selectedOwner.getRole() != UserRole.OWNER) {
            throw new InvalidRestaurantOwnerException(
                    "The selected user must have the OWNER role"
            );
        }

        return selectedOwner;
    }
}
