package com.skcet.restaurantreservation.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.skcet.restaurantreservation.dto.RestaurantTableRequest;
import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;
import com.skcet.restaurantreservation.exception.RestaurantAccessDeniedException;
import com.skcet.restaurantreservation.exception.RestaurantNotFoundException;
import com.skcet.restaurantreservation.repository.RestaurantRepository;
import com.skcet.restaurantreservation.repository.RestaurantTableRepository;
import com.skcet.restaurantreservation.repository.UserRepository;

@Service
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public RestaurantTableService(
            RestaurantTableRepository tableRepository,
            RestaurantRepository restaurantRepository,
            UserRepository userRepository
    ) {
        this.tableRepository = tableRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    public RestaurantTable addTable(Long restaurantId, RestaurantTableRequest request, String username) {
        Restaurant restaurant = getAndValidateManager(restaurantId, username);
        validateTableData(restaurantId, request.tableNumber(), request.capacity(), null);

        RestaurantTable table = new RestaurantTable(restaurant, request.tableNumber(), request.capacity());
        return tableRepository.save(table);
    }

    public List<RestaurantTable> getTablesByRestaurant(Long restaurantId) {
        if (!restaurantRepository.existsById(restaurantId)) {
            throw new RestaurantNotFoundException(restaurantId); // Fixed to pass Long
        }
        return tableRepository.findByRestaurant_IdOrderByTableNumberAsc(restaurantId);
    }

    public RestaurantTable updateTable(Long restaurantId, Long tableId, RestaurantTableRequest request, String username) {
        getAndValidateManager(restaurantId, username);
        
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found with ID: " + tableId));

        if (!table.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("Table does not belong to this restaurant.");
        }

        validateTableData(restaurantId, request.tableNumber(), request.capacity(), tableId);

        table.setTableNumber(request.tableNumber());
        table.setCapacity(request.capacity());
        return tableRepository.save(table);
    }

    public void deleteTable(Long restaurantId, Long tableId, String username) {
        getAndValidateManager(restaurantId, username);
        
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found with ID: " + tableId));

        if (!table.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("Table does not belong to this restaurant.");
        }

        tableRepository.delete(table);
    }

    // --- Helper Methods ---

    private Restaurant getAndValidateManager(Long restaurantId, String username) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId)); // Fixed to pass Long

        User currentUser = findCurrentUser(username);

        if (currentUser.getRole() == UserRole.ADMIN) {
            return restaurant;
        }

        if (!restaurant.getOwner().getEmail().equalsIgnoreCase(username)) {
            throw new RestaurantAccessDeniedException(); // Fixed to pass no arguments
        }
        return restaurant;
    }

    private User findCurrentUser(String username) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String effectiveUsername = username;
        if (authentication != null && authentication.getName() != null) {
            effectiveUsername = authentication.getName();
        }

        return userRepository.findByEmailIgnoreCase(effectiveUsername)
                .orElseThrow(RestaurantAccessDeniedException::new);
    }

    private void validateTableData(Long restaurantId, Integer tableNumber, Integer capacity, Long existingTableId) {
        Optional<RestaurantTable> existingTable = tableRepository.findByRestaurant_IdAndTableNumber(restaurantId, tableNumber);
        
        if (existingTable.isPresent() && !existingTable.get().getId().equals(existingTableId)) {
            throw new IllegalArgumentException("Table number " + tableNumber + " already exists for this restaurant.");
        }
    }
}
