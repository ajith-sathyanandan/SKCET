package com.skcet.restaurantreservation.controller;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.skcet.restaurantreservation.dto.RestaurantTableRequest;
import com.skcet.restaurantreservation.dto.RestaurantTableResponse;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.service.RestaurantTableService;

@RestController
@RequestMapping("/api/restaurants/{restaurantId}/tables")
public class RestaurantTableController {

    private final RestaurantTableService tableService;

    public RestaurantTableController(RestaurantTableService tableService) {
        this.tableService = tableService;
    }

    @PostMapping
    public ResponseEntity<RestaurantTableResponse> createTable(
            @PathVariable Long restaurantId,
            @Valid @RequestBody RestaurantTableRequest request,
            Principal principal) {

        RestaurantTable table = tableService.addTable(restaurantId, request, principal.getName());
        return new ResponseEntity<>(RestaurantTableResponse.from(table), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RestaurantTableResponse>> getAllTables(@PathVariable Long restaurantId) {
        List<RestaurantTableResponse> responses = tableService.getTablesByRestaurant(restaurantId)
                .stream()
                .map(RestaurantTableResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{tableId}")
    public ResponseEntity<RestaurantTableResponse> updateTable(
            @PathVariable Long restaurantId,
            @PathVariable Long tableId,
            @Valid @RequestBody RestaurantTableRequest request,
            Principal principal) {

        RestaurantTable table = tableService.updateTable(restaurantId, tableId, request, principal.getName());
        return ResponseEntity.ok(RestaurantTableResponse.from(table));
    }

    @DeleteMapping("/{tableId}")
    public ResponseEntity<Void> deleteTable(
            @PathVariable Long restaurantId,
            @PathVariable Long tableId,
            Principal principal) {

        tableService.deleteTable(restaurantId, tableId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}