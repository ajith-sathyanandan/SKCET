package com.skcet.restaurantreservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skcet.restaurantreservation.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
