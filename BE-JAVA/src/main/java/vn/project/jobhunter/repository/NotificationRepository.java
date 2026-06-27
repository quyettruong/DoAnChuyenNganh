package vn.project.jobhunter.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.project.jobhunter.domain.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserEmailOrderByCreatedAtDesc(String email, Pageable pageable);

    long countByUserEmailAndReadFalse(String email);

    Optional<Notification> findByIdAndUserEmail(Long id, String email);
}
