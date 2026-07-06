package com.skcet.restaurantreservation.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.skcet.restaurantreservation.dto.RestaurantTableRequest;
import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.exception.RestaurantAccessDeniedException;
import com.skcet.restaurantreservation.exception.RestaurantNotFoundException;
import com.skcet.restaurantreservation.repository.RestaurantRepository;
import com.skcet.restaurantreservation.repository.RestaurantTableRepository;

@Service
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;
    private final RestaurantRepository restaurantRepository;

    public RestaurantTableService(RestaurantTableRepository tableRepository, RestaurantRepository restaurantRepository) {
        this.tableRepository = tableRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantTable addTable(Long restaurantId, RestaurantTableRequest request, String username) {
        Restaurant restaurant = getAndValidateOwner(restaurantId, username);
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
        getAndValidateOwner(restaurantId, username);
        
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
        getAndValidateOwner(restaurantId, username);
        
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found with ID: " + tableId));

        if (!table.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("Table does not belong to this restaurant.");
        }

        tableRepository.delete(table);
    }

    // --- Helper Methods ---

    private Restaurant getAndValidateOwner(Long restaurantId, String username) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException(restaurantId)); // Fixed to pass Long
        
        if (!restaurant.getOwner().getEmail().equals(username)) {
            throw new RestaurantAccessDeniedException(); // Fixed to pass no arguments
        }
        return restaurant;
    }

    private void validateTableData(Long restaurantId, Integer tableNumber, Integer capacity, Long existingTableId) {
        Optional<RestaurantTable> existingTable = tableRepository.findByRestaurant_IdAndTableNumber(restaurantId, tableNumber);
        
        if (existingTable.isPresent() && !existingTable.get().getId().equals(existingTableId)) {
            throw new IllegalArgumentException("Table number " + tableNumber + " already exists for this restaurant.");
        }
    }
}