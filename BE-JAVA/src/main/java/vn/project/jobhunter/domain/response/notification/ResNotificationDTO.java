package vn.project.jobhunter.domain.response.notification;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResNotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String targetType;
    private Long targetId;
    private boolean read;
    private Instant createdAt;
    private Instant readAt;
}
