package com.examly.springapp.service;

import com.examly.springapp.exception.ResourceNotFoundException;
import com.examly.springapp.model.Restaurant;
import com.examly.springapp.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public Restaurant createRestaurant(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    public Restaurant getRestaurantById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
    }

    public List<Restaurant> searchByCuisine(String cuisine) {
        return restaurantRepository.findByCuisineIgnoreCase(cuisine);
    }

    public Restaurant updateRestaurant(Long id, Restaurant updatedRestaurant) {
        Restaurant restaurant = getRestaurantById(id);
        restaurant.setName(updatedRestaurant.getName());
        restaurant.setAddress(updatedRestaurant.getAddress());
        restaurant.setCuisine(updatedRestaurant.getCuisine());
        restaurant.setOpeningTime(updatedRestaurant.getOpeningTime());
        restaurant.setClosingTime(updatedRestaurant.getClosingTime());
        restaurant.setTotalTables(updatedRestaurant.getTotalTables());
        return restaurantRepository.save(restaurant);
    }

    public void deleteRestaurant(Long id) {
        Restaurant restaurant = getRestaurantById(id);
        restaurantRepository.delete(restaurant);
    }
}
