package com.skcet.restaurantreservation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.skcet.restaurantreservation.entity.Restaurant;

public interface RestaurantRepository
        extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByCuisineTypeIgnoreCaseOrderByNameAsc(
            String cuisineType
    );

    @Query("""
            select restaurant
            from Restaurant restaurant
            where (
                :search is null
                or lower(restaurant.name) like lower(
                    concat(concat('%', :search), '%')
                )
                or lower(restaurant.cuisineType) like lower(
                    concat(concat('%', :search), '%')
                )
            )
            and (
                :cuisine is null
                or lower(restaurant.cuisineType) = lower(:cuisine)
            )
            and (
                :location is null
                or lower(restaurant.address) like lower(
                    concat(concat('%', :location), '%')
                )
            )
            order by restaurant.name asc
            """)
    List<Restaurant> discover(
            @Param("search") String search,
            @Param("cuisine") String cuisine,
            @Param("location") String location
    );
}
