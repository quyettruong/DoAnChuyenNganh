package vn.project.jobhunter.service;

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
        return res.getBody().getSummary();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryResponse {
        private String summary;
        private String language;
    }
}
