package vn.project.jobhunter.controller;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.turkraft.springfilter.boot.Filter;
import com.turkraft.springfilter.builder.FilterBuilder;
import com.turkraft.springfilter.converter.FilterSpecificationConverter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import jakarta.validation.Valid;
import vn.project.jobhunter.domain.Company;
import vn.project.jobhunter.domain.Job;
import vn.project.jobhunter.domain.Resume;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.resume.ResAiSummaryDTO;
import vn.project.jobhunter.domain.response.resume.ResCreateResumeDTO;
import vn.project.jobhunter.domain.response.resume.ResFetchResumeDTO;
import vn.project.jobhunter.domain.response.resume.ResUpdateResumeDTO;
import vn.project.jobhunter.service.AiSummaryService;
import vn.project.jobhunter.service.ResumeService;
import vn.project.jobhunter.service.UserService;
import vn.project.jobhunter.util.annotation.ApiMessage;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.SecurityUtil;

@RestController
@RequestMapping("/api/v1")
public class ResumeController {
    private final ResumeService resumeService;
    private final UserService userService;
    private final FilterBuilder filterBuilder;
    private final FilterSpecificationConverter filterSpecificationConverter;
    private final AiSummaryService aiSummaryService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public ResumeController(ResumeService resumeService, UserService userService,
            FilterSpecificationConverter filterSpecificationConverter, FilterBuilder filterBuilder,
            AiSummaryService aiSummaryService) {
        this.resumeService = resumeService;
        this.userService = userService;
        this.filterSpecificationConverter = filterSpecificationConverter;
        this.filterBuilder = filterBuilder;
        this.aiSummaryService = aiSummaryService;
    }

    @PostMapping("/resumes")
    @ApiMessage("Create resume")
    public ResponseEntity<ResCreateResumeDTO> create(@Valid @RequestBody Resume resume) throws IdInvalidException {
        // Kiểm tra xem resume đã tồn tại chưa
        boolean isIdExist = this.resumeService.checkResumeExistByUserAndJob(resume);
        if (!isIdExist) {
            throw new IdInvalidException("User id/Job id không tồn tại");
        }

        // Tạo mới resume
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.resumeService.create(resume));
    }

    @PutMapping("/resumes")
    @ApiMessage("update resume")
    public ResponseEntity<ResUpdateResumeDTO> update(@RequestBody Resume resume) throws IdInvalidException {
        // Kiểm tra resume có tồn tại không
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(resume.getId());
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + resume.getId() + " không tồn tại");
        }

        // Cập nhật trạng thái
        Resume reqResume = reqResumeOptional.get();
        reqResume.setStatus(resume.getStatus());

        return ResponseEntity.ok().body(this.resumeService.update(reqResume));
    }

    @DeleteMapping("/resumes/{id}")
    @ApiMessage("Delete a resume by id")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }

        this.resumeService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/resumes/{id}")
    @ApiMessage("Lấy resume by id")
    public ResponseEntity<ResFetchResumeDTO> fetchById(@PathVariable Long id) throws IdInvalidException {
        Optional<Resume> resResumeOptional = this.resumeService.fetchById(id);
        if (resResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }

        return ResponseEntity.ok().body(this.resumeService.getResume(resResumeOptional.get()));
    }

    @GetMapping("/resumes")
    @ApiMessage("Fetch all resume with paginate")
    public ResponseEntity<ResultPaginationDTO> fetchAll(
            @Filter Specification<Resume> spec,
            Pageable pageable) {

        // tránh null spec
        if (spec == null) {
            spec = (root, query, cb) -> cb.conjunction();
        }

        // Lấy user hiện tại
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        if (email == null) {
            return ResponseEntity.ok().body(buildEmptyResult(pageable));
        }

        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null || currentUser.getRole() == null) {
            return ResponseEntity.ok().body(this.resumeService.fetchAllResume(spec, pageable));
        }

        String roleName = currentUser.getRole().getName();
        System.out.println("Current user = " + email + " | role = " + roleName);

        // 1. ADMIN / SUPER_ADMIN -> xem tất cả
        if ("ADMIN".equalsIgnoreCase(roleName)
                || "SUPER_ADMIN".equalsIgnoreCase(roleName)) {
            return ResponseEntity.ok().body(this.resumeService.fetchAllResume(spec, pageable));
        }

        // 2. HR -> chỉ xem CV của company mình
        if ("HR".equalsIgnoreCase(roleName)) {
            Company company = currentUser.getCompany();
            if (company == null) {
                System.out.println("HR không có company -> trả rỗng");
                return ResponseEntity.ok().body(buildEmptyResult(pageable));
            }

            Long companyId = company.getId();
            System.out.println("HR companyId = " + companyId);

            // thêm điều kiện job.company.id = companyId
            Specification<Resume> companySpec = (root, query, cb) -> cb.equal(root.get("job").get("company").get("id"),
                    companyId);

            Specification<Resume> finalSpec = spec.and(companySpec);

            return ResponseEntity.ok().body(this.resumeService.fetchAllResume(finalSpec, pageable));
        }

        // 3. Role khác -> tạm thời trả rỗng
        return ResponseEntity.ok().body(buildEmptyResult(pageable));
    }

    /**
     * Helper: tạo result rỗng cho dễ debug
     */
    private ResultPaginationDTO buildEmptyResult(Pageable pageable) {
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
        meta.setPage(pageable.getPageNumber() + 1);
        meta.setPageSize(pageable.getPageSize());
        meta.setPages(0);
        meta.setTotal(0L);
        rs.setMeta(meta);
        rs.setResult(Collections.emptyList());
        return rs;
    }

    @GetMapping("/resumes/by-user")
    @ApiMessage("Post list resumes by user")
    public ResponseEntity<ResultPaginationDTO> fetchResumeByUser(Pageable pageable) {
        return ResponseEntity.ok().body(this.resumeService.fetchResumeByUser(pageable));
    }

    private String extractTextFromResume(Resume resume) {
        // Nếu chưa có url thì fallback về text đơn giản
        if (resume.getUrl() == null || resume.getUrl().isBlank()) {
            StringBuilder sb = new StringBuilder();
            sb.append("Email: ").append(resume.getEmail()).append(". ");
            if (resume.getJob() != null) {
                sb.append("Job: ").append(resume.getJob().getName()).append(". ");
                if (resume.getJob().getCompany() != null) {
                    sb.append("Company: ")
                            .append(resume.getJob().getCompany().getName())
                            .append(". ");
                }
            }
            return sb.toString();
        }

        // Làm sạch tên file, bỏ dấu \ nếu có
        String rawFileName = resume.getUrl().replace("\\", "").trim();
        String lowerName = rawFileName.toLowerCase();

        // Ghép đường dẫn đầy đủ tới file
        Path filePath = Paths.get(uploadDir, rawFileName);
        System.out.println("Reading CV file from: " + filePath);

        try {
            // Đọc DOCX
            if (lowerName.endsWith(".docx")) {
                try (FileInputStream fis = new FileInputStream(filePath.toFile());
                        XWPFDocument document = new XWPFDocument(fis);
                        XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {

                    String text = extractor.getText();
                    return text != null ? text : "";
                }
            }

            // Đọc PDF
            if (lowerName.endsWith(".pdf")) {
                try (PDDocument pdfDoc = PDDocument.load(filePath.toFile())) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    String text = stripper.getText(pdfDoc);
                    return text != null ? text : "";
                }
            }

            // Đọc TXT nếu có
            if (lowerName.endsWith(".txt")) {
                return Files.readString(filePath);
            }

            // Các loại khác tạm thời fallback
            return "Email: " + resume.getEmail()
                    + ". Company: " + (resume.getJob() != null && resume.getJob().getCompany() != null
                            ? resume.getJob().getCompany().getName()
                            : "");

        } catch (IOException e) {
            e.printStackTrace();
            return "Error reading CV file. Email: " + resume.getEmail();
        }
    }

    @PostMapping("/resumes/{id}/ai-summary")
    public ResponseEntity<ResAiSummaryDTO> generateAiSummary(@PathVariable Long id) {

        // 1. Lấy resume từ DB
        Resume resume = resumeService.findById(id)
                .orElseThrow(() -> new RuntimeException("Resume not found with id = " + id));

        // 2. Lấy text từ file CV (docx) hoặc fallback
        String cvText = extractTextFromResume(resume);
        System.out.println("===== RAW CV TEXT (first 200 chars) =====");
        System.out.println(cvText.substring(0, Math.min(200, cvText.length())));

        // 3. Gọi AI Python để tóm tắt
        String summary = aiSummaryService.summarizeText(cvText);
        System.out.println("===== AI SUMMARY (first 200 chars) =====");
        System.out.println(summary != null ? summary.substring(0, Math.min(200, summary.length())) : "null");

        // 4. Lưu summary vào DB
        resume.setSummaryAi(summary);
        resumeService.save(resume);

        // 5. Trả về cho FE
        ResAiSummaryDTO resDto = new ResAiSummaryDTO(resume.getId(), summary);
        return ResponseEntity.ok(resDto);
    }

}
