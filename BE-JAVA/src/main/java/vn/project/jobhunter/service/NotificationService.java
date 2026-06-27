package vn.project.jobhunter.service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.project.jobhunter.domain.Company;
import vn.project.jobhunter.domain.Job;
import vn.project.jobhunter.domain.Notification;
import vn.project.jobhunter.domain.Resume;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.notification.ResNotificationDTO;
import vn.project.jobhunter.repository.NotificationRepository;
import vn.project.jobhunter.repository.UserRepository;
import vn.project.jobhunter.util.constant.ResumeStateEnum;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.SecurityUtil;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private String getCurrentEmail() {
        return SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Bạn cần đăng nhập để xem thông báo"));
    }

    public ResNotificationDTO convertToDTO(Notification notification) {
        ResNotificationDTO res = new ResNotificationDTO();
        res.setId(notification.getId());
        res.setTitle(notification.getTitle());
        res.setMessage(notification.getMessage());
        res.setType(notification.getType());
        res.setTargetType(notification.getTargetType());
        res.setTargetId(notification.getTargetId());
        res.setRead(notification.isRead());
        res.setCreatedAt(notification.getCreatedAt());
        res.setReadAt(notification.getReadAt());
        return res;
    }

    public ResultPaginationDTO fetchCurrentUserNotifications(Pageable pageable) {
        String email = getCurrentEmail();
        Page<Notification> page = this.notificationRepository.findByUserEmailOrderByCreatedAtDesc(email, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(page.getNumber() + 1);
        mt.setPageSize(page.getSize());
        mt.setPages(page.getTotalPages());
        mt.setTotal(page.getTotalElements());
        rs.setMeta(mt);

        List<ResNotificationDTO> notifications = page.getContent()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        rs.setResult(notifications);
        return rs;
    }

    public long countCurrentUserUnread() {
        return this.notificationRepository.countByUserEmailAndReadFalse(getCurrentEmail());
    }

    @Transactional
    public ResNotificationDTO markAsRead(Long id) {
        String email = getCurrentEmail();
        Notification notification = this.notificationRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new IdInvalidException("Thông báo không tồn tại"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        }

        return convertToDTO(this.notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead() {
        String email = getCurrentEmail();
        Page<Notification> page = this.notificationRepository.findByUserEmailOrderByCreatedAtDesc(
                email,
                Pageable.unpaged());

        page.getContent().stream()
                .filter(item -> !item.isRead())
                .forEach(item -> {
                    item.setRead(true);
                    item.setReadAt(Instant.now());
                });

        this.notificationRepository.saveAll(page.getContent());
    }

    public void createResumeStatusNotification(Resume resume, ResumeStateEnum status) {
        if (resume == null || resume.getUser() == null || status == null) {
            return;
        }

        String statusText = toStatusText(status);
        String jobName = getJobName(resume);
        String companyName = getCompanyName(resume);
        String title = "Hồ sơ ứng tuyển đã đổi trạng thái";
        String message = "Hồ sơ của bạn cho vị trí " + jobName + " tại " + companyName
                + " hiện là " + statusText + ". " + safe(resume.getStatusNote());

        createForResume(resume.getUser(), title, message.trim(), "RESUME_STATUS", resume.getId());
    }

    public void createJobFullNotification(Resume resume) {
        if (resume == null || resume.getUser() == null) {
            return;
        }

        String jobName = getJobName(resume);
        String companyName = getCompanyName(resume);
        String message = "Công việc " + jobName + " tại " + companyName
                + " đã đủ số lượng tuyển. Hồ sơ của bạn được chuyển sang trạng thái Đã đủ số lượng.";

        createForResume(resume.getUser(), "Công việc đã đủ số lượng", message, "JOB_FULL", resume.getId());
    }

    private void createForResume(User user, String title, String message, String type, Long resumeId) {
        if (user == null || user.getId() == 0) {
            return;
        }

        User currentUser = this.userRepository.findById(user.getId()).orElse(null);
        if (currentUser == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(currentUser);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setTargetType("RESUME");
        notification.setTargetId(resumeId);
        notification.setRead(false);
        this.notificationRepository.save(notification);
    }

    private String getJobName(Resume resume) {
        Job job = resume.getJob();
        return job != null && job.getName() != null ? job.getName() : "công việc đã ứng tuyển";
    }

    private String getCompanyName(Resume resume) {
        Job job = resume.getJob();
        Company company = job != null ? job.getCompany() : null;
        return company != null && company.getName() != null ? company.getName() : "công ty tuyển dụng";
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String toStatusText(ResumeStateEnum status) {
        return switch (status) {
            case PENDING -> "Đang chờ duyệt";
            case REVIEWING -> "Đang xem xét";
            case APPROVED -> "Được chấp thuận";
            case REJECTED -> "Chưa phù hợp";
            case FULL -> "Đã đủ số lượng";
        };
    }
}
