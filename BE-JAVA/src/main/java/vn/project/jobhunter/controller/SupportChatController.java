package vn.project.jobhunter.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.project.jobhunter.service.AiSummaryService;
import vn.project.jobhunter.util.annotation.ApiMessage;
import vn.project.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class SupportChatController {

    private final AiSummaryService aiSummaryService;

    public SupportChatController(AiSummaryService aiSummaryService) {
        this.aiSummaryService = aiSummaryService;
    }

    @PostMapping("/support-chat")
    @ApiMessage("Support chat")
    public ResponseEntity<Map<String, Object>> supportChat(@RequestBody Map<String, Object> body)
            throws IdInvalidException {
        Map<String, Object> result = this.aiSummaryService.supportChat(body);
        if (result == null || result.isEmpty()) {
            throw new IdInvalidException("AI hỗ trợ chưa phản hồi được lúc này");
        }

        return ResponseEntity.ok(result);
    }
}
