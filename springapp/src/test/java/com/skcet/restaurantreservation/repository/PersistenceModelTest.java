package com.skcet.restaurantreservation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.skcet.restaurantreservation.entity.Notification;
import com.skcet.restaurantreservation.entity.Reservation;
import com.skcet.restaurantreservation.entity.ReservationStatus;
import com.skcet.restaurantreservation.entity.Restaurant;
import com.skcet.restaurantreservation.entity.RestaurantTable;
import com.skcet.restaurantreservation.entity.User;
import com.skcet.restaurantreservation.entity.UserRole;

@DataJpaTest
class PersistenceModelTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void shouldPersistAndRetrieveTheNormalizedReservationModel() {
        User owner = userRepository.save(
                new User(
                        "Restaurant Owner",
                        "owner@example.com",
                        "hashed-owner-password",
                        UserRole.OWNER
                )
        );

        User customer = userRepository.save(
                new User(
                        "Customer",
                        "customer@example.com",
                        "hashed-customer-password",
                        UserRole.CUSTOMER
                )
        );

        Restaurant restaurant = restaurantRepository.save(
                new Restaurant(
                        owner,
                        "Italian Delight",
                        "123 Main Street",
                        "Italian",
                        LocalTime.of(11, 0),
                        LocalTime.of(22, 0)
                )
        );

        RestaurantTable table = restaurantTableRepository.save(
                new RestaurantTable(restaurant, 1, 4)
        );

        Reservation reservation = reservationRepository.save(
                new Reservation(
                        restaurant,
                        customer,
                        LocalDate.of(2026, 7, 1),
                        LocalTime.of(19, 0),
                        4,
                        "Window seat preferred",
                        ReservationStatus.PENDING
                )
        );

        Notification notification = notificationRepository.save(
                new Notification(
                        owner,
                        "A new reservation request has been submitted."
                )
        );

        assertThat(owner.getId()).isNotNull();
        assertThat(customer.getId()).isNotNull();
        assertThat(restaurant.getId()).isNotNull();
        assertThat(table.getId()).isNotNull();
        assertThat(reservation.getId()).isNotNull();
        assertThat(notification.getId()).isNotNull();

        assertThat(userRepository.findByEmail("customer@example.com"))
                .isPresent()
                .get()
                .extracting(User::getRole)
                .isEqualTo(UserRole.CUSTOMER);

        assertThat(reservationRepository.findById(reservation.getId()))
                .isPresent()
                .get()
                .extracting(Reservation::getStatus)
                .isEqualTo(ReservationStatus.PENDING);
    }
}
