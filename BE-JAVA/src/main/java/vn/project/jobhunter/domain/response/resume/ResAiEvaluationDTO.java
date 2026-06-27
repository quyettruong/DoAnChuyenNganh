package vn.project.jobhunter.domain.response.resume;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ResAiEvaluationDTO {
    private Long resumeId;
    private Integer aiMatchScore;
    private String aiRecommendation;
    private List<String> aiMatchedSkills;
    private List<String> aiMissingSkills;
    private List<String> aiStrengths;
    private List<String> aiWeaknesses;
    private String aiEvaluation;
    private Instant aiEvaluatedAt;
}
