package vn.project.jobhunter.domain.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReqUserCvDTO {
    @NotBlank(message = "title không được để trống")
    private String title;

    private String templateCode;

    private String theme;

    @NotBlank(message = "cvData không được để trống")
    private String cvData;

    private boolean defaultCv;
}
