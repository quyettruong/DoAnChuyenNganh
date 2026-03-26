package vn.project.jobhunter.domain.response.resume;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ResAiSummaryDTO {
    private Long resumeId;
    private String summaryAi;
}
