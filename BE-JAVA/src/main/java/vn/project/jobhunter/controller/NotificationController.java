package vn.project.jobhunter.controller;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.notification.ResNotificationDTO;
import vn.project.jobhunter.service.NotificationService;
import vn.project.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications")
    @ApiMessage("Fetch current user notifications")
    public ResponseEntity<ResultPaginationDTO> fetchCurrentUserNotifications(Pageable pageable) {
        return ResponseEntity.ok(this.notificationService.fetchCurrentUserNotifications(pageable));
    }

    @GetMapping("/notifications/unread-count")
    @ApiMessage("Count current user unread notifications")
    public ResponseEntity<Map<String, Long>> countUnread() {
        return ResponseEntity.ok(Map.of("count", this.notificationService.countCurrentUserUnread()));
    }

    @PutMapping("/notifications/{id}/read")
    @ApiMessage("Mark notification as read")
    public ResponseEntity<ResNotificationDTO> markAsRead(@PathVariable("id") Long id) {
        return ResponseEntity.ok(this.notificationService.markAsRead(id));
    }

    @PutMapping("/notifications/read-all")
    @ApiMessage("Mark all notifications as read")
    public ResponseEntity<Void> markAllAsRead() {
        this.notificationService.markAllAsRead();
        return ResponseEntity.ok().body(null);
    }
}
