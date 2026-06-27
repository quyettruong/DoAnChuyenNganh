package vn.project.jobhunter.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Service
public class AiSummaryService {

    @Value("${ai.summary.url}")
    private String summaryUrl;

    @Value("${ai.evaluation.url:http://localhost:8000/evaluate-resume}")
    private String evaluationUrl;

    @Value("${ai.cv.url:http://localhost:8000/generate-cv}")
    private String cvUrl;

    @Value("${ai.support.url:http://localhost:8000/support-chat}")
    private String supportUrl;

    private final RestTemplate restTemplate;

    public AiSummaryService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String summarizeText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("text", text);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<SummaryResponse> res = restTemplate.exchange(summaryUrl, HttpMethod.POST, request,
                SummaryResponse.class);

        if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
            return null;
        }

        SummaryResponse responseBody = res.getBody();
        if (responseBody.getSummary() != null) {
            return responseBody.getSummary();
        }

        return responseBody.getData() != null ? responseBody.getData().getSummary() : null;
    }

    public ResumeEvaluationData evaluateResume(ResumeEvaluationRequest payload) {
        if (payload == null || payload.getCvText() == null || payload.getCvText().isBlank()) {
            return null;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<ResumeEvaluationRequest> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<EvaluationResponse> res = restTemplate.exchange(
                    evaluationUrl,
                    HttpMethod.POST,
                    request,
                    EvaluationResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                return null;
            }

            EvaluationResponse responseBody = res.getBody();
            if (responseBody.getData() != null) {
                return responseBody.getData();
            }

            return new ResumeEvaluationData(
                    responseBody.getAiMatchScore(),
                    responseBody.getAiRecommendation(),
                    responseBody.getAiMatchedSkills(),
                    responseBody.getAiMissingSkills(),
                    responseBody.getAiStrengths(),
                    responseBody.getAiWeaknesses(),
                    responseBody.getAiEvaluation());
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Map<String, Object> generateCvFromJob(CvGenerationRequest payload) {
        if (payload == null || payload.getJobTitle() == null || payload.getJobTitle().isBlank()) {
            return null;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CvGenerationRequest> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<CvGenerationResponse> res = restTemplate.exchange(
                    cvUrl,
                    HttpMethod.POST,
                    request,
                    CvGenerationResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                return null;
            }

            return res.getBody().getData();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Map<String, Object> supportChat(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<SupportChatResponse> res = restTemplate.exchange(
                    supportUrl,
                    HttpMethod.POST,
                    request,
                    SupportChatResponse.class);

            if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                return null;
            }

            return res.getBody().getData();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private String summary;
        private String language;
        private SummaryData data;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryData {
        private String summary;
        private String language;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeEvaluationRequest {
        private String cvText;
        private String jobTitle;
        private String companyName;
        private String jobDescription;
        private String level;
        private String location;
        private Double salary;
        private Integer quantity;
        private List<String> skills;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CvGenerationRequest {
        private String userPrompt;
        private Map<String, Object> currentCv;
        private Map<String, Object> profile;
        private String jobTitle;
        private String companyName;
        private String jobDescription;
        private String level;
        private String location;
        private Double salary;
        private Integer quantity;
        private List<String> skills;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CvGenerationResponse {
        private Map<String, Object> data;
        private String message;
        private Integer statusCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupportChatResponse {
        private Map<String, Object> data;
        private String message;
        private Integer statusCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationResponse {
        private Integer aiMatchScore;
        private String aiRecommendation;
        private List<String> aiMatchedSkills;
        private List<String> aiMissingSkills;
        private List<String> aiStrengths;
        private List<String> aiWeaknesses;
        private String aiEvaluation;
        private ResumeEvaluationData data;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResumeEvaluationData {
        private Integer aiMatchScore;
        private String aiRecommendation;
        private List<String> aiMatchedSkills;
        private List<String> aiMissingSkills;
        private List<String> aiStrengths;
        private List<String> aiWeaknesses;
        private String aiEvaluation;
    }
}
