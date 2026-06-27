package vn.project.jobhunter.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.turkraft.springfilter.boot.Filter;

import jakarta.validation.Valid;
import vn.project.jobhunter.domain.Company;
import vn.project.jobhunter.domain.Job;
import vn.project.jobhunter.domain.Skill;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.project.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.project.jobhunter.service.AiSummaryService;
import vn.project.jobhunter.service.JobService;
import vn.project.jobhunter.service.UserService;
import vn.project.jobhunter.util.annotation.ApiMessage;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.PermissionException;
import vn.project.jobhunter.util.error.SecurityUtil;

@RestController
@RequestMapping("/api/v1")
public class JobController {

    private final JobService jobService;
    private final UserService userService;
    private final AiSummaryService aiSummaryService;

    public JobController(JobService jobService, UserService userService, AiSummaryService aiSummaryService) {
        this.jobService = jobService;
        this.userService = userService;
        this.aiSummaryService = aiSummaryService;
    }

    @PostMapping("jobs")
    @ApiMessage("Create a job")
    public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job)
            throws PermissionException {
        User currentUser = getCurrentUser();
        ensureCanManageJob(currentUser);

        if (isHr(currentUser)) {
            job.setCompany(getHrCompany(currentUser));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.jobService.create(job));
    }

    @PutMapping("/jobs")
    @ApiMessage("Update a job")
    public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job)
            throws IdInvalidException, PermissionException {
        Optional<Job> currentJob = this.jobService.fetchJobById(job.getId());
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        User currentUser = getCurrentUser();
        ensureCanManageJob(currentUser);

        if (isHr(currentUser)) {
            Company hrCompany = getHrCompany(currentUser);
            if (!belongsToCompany(currentJob.get(), hrCompany)) {
                throw new PermissionException("HR chỉ được cập nhật job thuộc công ty của mình");
            }
            job.setCompany(hrCompany);
        }

        return ResponseEntity.ok().body(this.jobService.update(job, currentJob.get()));
    }

    @DeleteMapping("/jobs/{id}")
    @ApiMessage("Delete a job by id")
    public ResponseEntity<Void> delete(@PathVariable("id") long id)
            throws IdInvalidException, PermissionException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        User currentUser = getCurrentUser();
        ensureCanManageJob(currentUser);

        if (isHr(currentUser) && !belongsToCompany(currentJob.get(), getHrCompany(currentUser))) {
            throw new PermissionException("HR chỉ được xóa job thuộc công ty của mình");
        }

        this.jobService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/jobs/{id}")
    @ApiMessage("Get a job by id")
    public ResponseEntity<Job> getJob(
            @PathVariable("id") long id,
            @RequestParam(name = "admin", required = false, defaultValue = "false") boolean admin)
            throws IdInvalidException, PermissionException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        if (admin) {
            User currentUser = getCurrentUser();
            ensureCanManageJob(currentUser);

            if (isHr(currentUser) && !belongsToCompany(currentJob.get(), getHrCompany(currentUser))) {
                throw new PermissionException("HR chỉ được xem chi tiết job thuộc công ty của mình trong trang quản trị");
            }
        }

        return ResponseEntity.ok().body(currentJob.get());
    }

    @PostMapping("/jobs/{id}/ai-cv")
    @ApiMessage("Generate CV draft from job")
    public ResponseEntity<Map<String, Object>> generateCvFromJob(
            @PathVariable("id") long id,
            @RequestBody(required = false) Map<String, Object> body)
            throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        Job job = currentJob.get();
        List<String> skills = job.getSkills() != null
                ? job.getSkills().stream()
                        .map(Skill::getName)
                        .filter(name -> name != null && !name.isBlank())
                        .collect(Collectors.toList())
                : Collections.emptyList();

        Map<String, Object> requestBody = body != null ? body : new HashMap<>();
        Object currentCv = requestBody.get("currentCv");
        Object profile = requestBody.get("profile");

        AiSummaryService.CvGenerationRequest request = new AiSummaryService.CvGenerationRequest(
                asString(requestBody.get("userPrompt")),
                currentCv instanceof Map ? castMap(currentCv) : Collections.emptyMap(),
                profile instanceof Map ? castMap(profile) : Collections.emptyMap(),
                job.getName(),
                job.getCompany() != null ? job.getCompany().getName() : "",
                job.getDescription(),
                job.getLevel() != null ? job.getLevel().name() : "",
                job.getLocation(),
                job.getSalary(),
                job.getQuantity(),
                skills);

        Map<String, Object> result = aiSummaryService.generateCvFromJob(request);
        if (result == null || result.isEmpty()) {
            throw new IdInvalidException("AI không tạo được CV cho công việc này");
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/jobs")
    @ApiMessage("Get with pagination")
    public ResponseEntity<ResultPaginationDTO> getAllJob(
            @Filter Specification<Job> spec,
            Pageable pageable,
            @RequestParam(name = "admin", required = false, defaultValue = "false") boolean admin) {

        Specification<Job> currentSpec = spec != null ? spec : (root, query, cb) -> cb.conjunction();

        if (!admin) {
            Specification<Job> activeSpec = (root, query, cb) -> cb.isTrue(root.get("active"));
            return ResponseEntity.ok(
                    this.jobService.fetchAll(currentSpec.and(activeSpec), pageable));
        }

        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() == null) {
            return ResponseEntity.ok().body(buildEmptyResult(pageable));
        }

        if (isAdmin(currentUser)) {
            return ResponseEntity.ok(
                    this.jobService.fetchAll(currentSpec, pageable));
        }

        if (isHr(currentUser)) {
            Company company = currentUser.getCompany();
            if (company == null) {
                return ResponseEntity.ok().body(buildEmptyResult(pageable));
            }

            Long companyId = company.getId();
            Specification<Job> companySpec = (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);

            return ResponseEntity.ok(
                    this.jobService.fetchAll(currentSpec.and(companySpec), pageable));
        }

        return ResponseEntity.ok().body(buildEmptyResult(pageable));
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserLogin().orElse(null);
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return null;
        }

        try {
            return this.userService.handleGetUserByUsername(email);
        } catch (UsernameNotFoundException ex) {
            return null;
        }
    }

    private void ensureCanManageJob(User user) throws PermissionException {
        if (user == null || user.getRole() == null) {
            throw new PermissionException("Bạn cần đăng nhập bằng tài khoản quản trị để quản lý job");
        }

        if (!isAdmin(user) && !isHr(user)) {
            throw new PermissionException("Bạn không có quyền quản lý job");
        }
    }

    private Company getHrCompany(User user) throws PermissionException {
        if (user.getCompany() == null) {
            throw new PermissionException("Tài khoản HR chưa được gán công ty");
        }
        return user.getCompany();
    }

    private boolean isAdmin(User user) {
        String roleName = user.getRole().getName();
        return "ADMIN".equalsIgnoreCase(roleName)
                || "SUPER_ADMIN".equalsIgnoreCase(roleName);
    }

    private boolean isHr(User user) {
        return "HR".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean belongsToCompany(Job job, Company company) {
        return job.getCompany() != null
                && company != null
                && Objects.equals(job.getCompany().getId(), company.getId());
    }

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

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        return (Map<String, Object>) value;
    }

    private String asString(Object value) {
        return value != null ? value.toString() : "";
    }
}
