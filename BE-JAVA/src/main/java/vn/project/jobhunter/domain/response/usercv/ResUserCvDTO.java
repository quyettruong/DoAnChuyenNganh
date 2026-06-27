package vn.project.jobhunter.domain.response.usercv;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResUserCvDTO {
    private Long id;
    private String title;
    private String templateCode;
    private String theme;
    private String cvData;
    private boolean defaultCv;
    private Instant createdAt;
    private Instant updatedAt;
}
