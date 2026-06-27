package vn.project.jobhunter.service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.turkraft.springfilter.builder.FilterBuilder;
import com.turkraft.springfilter.converter.FilterSpecification;
import com.turkraft.springfilter.converter.FilterSpecificationConverter;
import com.turkraft.springfilter.parser.FilterParser;
import com.turkraft.springfilter.parser.node.FilterNode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.project.jobhunter.domain.Job;
import vn.project.jobhunter.domain.Resume;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.resume.ResCreateResumeDTO;
import vn.project.jobhunter.domain.response.resume.ResFetchResumeDTO;
import vn.project.jobhunter.domain.response.resume.ResUpdateResumeDTO;
import vn.project.jobhunter.repository.JobRepository;
import vn.project.jobhunter.repository.ResumeRepository;
import vn.project.jobhunter.repository.UserRepository;
import vn.project.jobhunter.util.constant.ResumeStateEnum;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.SecurityUtil;

@Service
public class ResumeService {
    private static final String FULL_STATUS_NOTE = "Công việc này đã đủ số lượng tuyển. Cảm ơn bạn đã ứng tuyển.";

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;
    @Autowired
    FilterBuilder fb;

    @Autowired
    private FilterParser filterParser;

    @Autowired
    FilterSpecificationConverter filterSpecificationConverter;

    public ResumeService(
            ResumeRepository resumeRepository,
            UserRepository userRepository,
            JobRepository jobRepository,
            NotificationService notificationService) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.notificationService = notificationService;
    }

    public Optional<Resume> fetchById(long id) {
        return this.resumeRepository.findById(id);
    }

    public boolean checkResumeExistByUserAndJob(Resume resume) {
        // Kiểm tra user
        if (resume.getUser() == null) {
            return false;
        }
        Optional<User> userOptional = this.userRepository.findById(resume.getUser().getId());
        if (userOptional.isEmpty()) {
            return false;
        }

        // Kiểm tra job
        if (resume.getJob() == null) {
            return false;
        }
        Optional<Job> jobOptional = this.jobRepository.findById(resume.getJob().getId());
        if (jobOptional.isEmpty()) {
            return false;
        }

        return true;
    }

    public Resume save(Resume resume) {
        return resumeRepository.save(resume);
    }

    public Optional<Resume> findById(Long id) {
        return resumeRepository.findById(id);
    }

    public ResCreateResumeDTO create(Resume resume) {
        Job job = this.jobRepository.findById(resume.getJob().getId())
                .orElseThrow(() -> new IdInvalidException("Job không tồn tại"));

        if (!job.isActive()) {
            throw new IdInvalidException("Công việc này đã đủ số lượng tuyển hoặc đã ngừng nhận hồ sơ");
        }

        long approvedCount = this.resumeRepository.countByJobIdAndStatus(job.getId(), ResumeStateEnum.APPROVED);
        if (job.getQuantity() > 0 && approvedCount >= job.getQuantity()) {
            job.setActive(false);
            this.jobRepository.save(job);
            throw new IdInvalidException("Công việc này đã đủ số lượng tuyển");
        }

        resume.setJob(job);
        if (resume.getStatus() == null) {
            resume.setStatus(ResumeStateEnum.PENDING);
        }

        resume = this.resumeRepository.save(resume);

        ResCreateResumeDTO res = new ResCreateResumeDTO();
        res.setId(resume.getId());
        res.setCreatedBy(resume.getCreatedBy());
        res.setCreatedAt(resume.getCreatedAt());

        return res;
    }

    public ResUpdateResumeDTO update(Resume resume) {
        resume = this.resumeRepository.save(resume);

        ResUpdateResumeDTO res = new ResUpdateResumeDTO();
        res.setUpdatedAt(resume.getUpdatedAt());
        res.setUpdatedBy(resume.getUpdatedBy());
        res.setStatus(resume.getStatus() != null ? resume.getStatus().name() : null);
        res.setStatusNote(resume.getStatusNote());

        return res;
    }

    @Transactional
    public ResUpdateResumeDTO updateStatus(Resume resume, ResumeStateEnum nextStatus) {
        if (nextStatus == null) {
            throw new IdInvalidException("Trạng thái CV không hợp lệ");
        }

        if (resume.getJob() == null) {
            throw new IdInvalidException("Resume chưa gắn với job hợp lệ");
        }

        Job job = this.jobRepository.findById(resume.getJob().getId())
                .orElseThrow(() -> new IdInvalidException("Job không tồn tại"));

        if (ResumeStateEnum.APPROVED.equals(nextStatus)) {
            long approvedCount = this.resumeRepository.countByJobIdAndStatusAndIdNot(
                    job.getId(),
                    ResumeStateEnum.APPROVED,
                    resume.getId());

            if (job.getQuantity() > 0 && approvedCount >= job.getQuantity()) {
                throw new IdInvalidException("Công việc này đã đủ số lượng tuyển");
            }
        }

        ResumeStateEnum previousStatus = resume.getStatus();
        boolean statusChanged = !nextStatus.equals(previousStatus);

        resume.setStatus(nextStatus);
        resume.setStatusNote(buildStatusNote(nextStatus));
        Resume savedResume = this.resumeRepository.save(resume);

        if (statusChanged) {
            this.notificationService.createResumeStatusNotification(savedResume, nextStatus);
        }

        if (ResumeStateEnum.APPROVED.equals(nextStatus)) {
            closeJobIfRecruitmentIsFull(job, savedResume.getId());
        }

        ResUpdateResumeDTO res = new ResUpdateResumeDTO();
        res.setUpdatedAt(savedResume.getUpdatedAt());
        res.setUpdatedBy(savedResume.getUpdatedBy());
        res.setStatus(savedResume.getStatus().name());
        res.setStatusNote(savedResume.getStatusNote());
        return res;
    }

    public void delete(long id) {
        this.resumeRepository.deleteById(id);
    }

    public ResFetchResumeDTO getResume(Resume resume) {
        ResFetchResumeDTO res = new ResFetchResumeDTO();
        res.setId(resume.getId());
        res.setEmail(resume.getEmail());
        res.setUrl(resume.getUrl());
        res.setStatus(resume.getStatus());
        res.setStatusNote(resume.getStatusNote());
        res.setCreatedAt(resume.getCreatedAt());
        res.setCreatedBy(resume.getCreatedBy());
        res.setUpdatedAt(resume.getUpdatedAt());
        res.setUpdatedBy(resume.getUpdatedBy());
        res.setSummaryAi(resume.getSummaryAi());
        res.setAiMatchScore(resume.getAiMatchScore());
        res.setAiRecommendation(resume.getAiRecommendation());
        res.setAiMatchedSkills(textToList(resume.getAiMatchedSkills()));
        res.setAiMissingSkills(textToList(resume.getAiMissingSkills()));
        res.setAiStrengths(textToList(resume.getAiStrengths()));
        res.setAiWeaknesses(textToList(resume.getAiWeaknesses()));
        res.setAiEvaluation(resume.getAiEvaluation());
        res.setAiEvaluatedAt(resume.getAiEvaluatedAt());
        if (resume.getJob() != null) {
            res.setCompanyName(resume.getJob().getCompany().getName());
        }

        res.setUser(new ResFetchResumeDTO.UserResume(
                resume.getUser().getId(),
                resume.getUser().getName()));

        res.setJob(new ResFetchResumeDTO.JobResume(
                resume.getJob().getId(),
                resume.getJob().getName()));

        return res;
    }

    public ResultPaginationDTO fetchAllResume(Specification<Resume> spec, Pageable pageable) {
        Page<Resume> pageUser = this.resumeRepository.findAll(spec, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);

        // remove sensitive data
        List<ResFetchResumeDTO> listResume = pageUser.getContent()
                .stream()
                .map(item -> this.getResume(item))
                .collect(Collectors.toList());

        rs.setResult(listResume);

        return rs;
    }

    public ResultPaginationDTO fetchResumeByUser(Pageable pageable) {
        // 1. Lấy email của user đang đăng nhập
        Optional<String> opt = SecurityUtil.getCurrentUserLogin();
        if (opt.isEmpty()) {
            // Nếu không đăng nhập => trả về danh sách rỗng
            ResultPaginationDTO emptyResult = new ResultPaginationDTO();
            ResultPaginationDTO.Meta meta = new ResultPaginationDTO.Meta();
            meta.setPage(pageable.getPageNumber() + 1);
            meta.setPageSize(pageable.getPageSize());
            meta.setPages(0);
            meta.setTotal(0);
            emptyResult.setMeta(meta);
            emptyResult.setResult(Collections.emptyList());
            return emptyResult;
        }

        String email = opt.get();

        // 2. Tạo filter truy vấn bằng Specification (an toàn, không lỗi cú pháp)
        Specification<Resume> spec = (root, query, cb) -> cb.equal(root.get("email"), email);

        // 3. Truy vấn CSDL
        Page<Resume> page = resumeRepository.findAll(spec, pageable);

        // 4. Build DTO trả về
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(page.getTotalPages());
        mt.setTotal(page.getTotalElements());
        rs.setMeta(mt);
        rs.setResult(page.getContent());
        return rs;
    }

    private void closeJobIfRecruitmentIsFull(Job job, long approvedResumeId) {
        if (job.getQuantity() <= 0) {
            return;
        }

        long approvedCount = this.resumeRepository.countByJobIdAndStatus(job.getId(), ResumeStateEnum.APPROVED);
        if (approvedCount < job.getQuantity()) {
            return;
        }

        job.setActive(false);
        this.jobRepository.save(job);

        List<Resume> remainingResumes = this.resumeRepository.findByJobIdAndStatusInAndIdNot(
                job.getId(),
                List.of(ResumeStateEnum.PENDING, ResumeStateEnum.REVIEWING),
                approvedResumeId);

        remainingResumes.forEach(item -> {
            item.setStatus(ResumeStateEnum.FULL);
            item.setStatusNote(FULL_STATUS_NOTE);
            this.notificationService.createJobFullNotification(item);
        });

        this.resumeRepository.saveAll(remainingResumes);
    }

    private String buildStatusNote(ResumeStateEnum status) {
        if (status == null) {
            return null;
        }

        return switch (status) {
            case PENDING -> "Hồ sơ của bạn đã được gửi và đang chờ nhà tuyển dụng xem xét.";
            case REVIEWING -> "Hồ sơ của bạn đang được nhà tuyển dụng xem xét.";
            case APPROVED -> "Hồ sơ của bạn đã được chấp thuận.";
            case REJECTED -> "Hồ sơ của bạn chưa phù hợp với vị trí này.";
            case FULL -> FULL_STATUS_NOTE;
        };
    }

    private List<String> textToList(String value) {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(value.split("\\R"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .collect(Collectors.toList());
    }

}
