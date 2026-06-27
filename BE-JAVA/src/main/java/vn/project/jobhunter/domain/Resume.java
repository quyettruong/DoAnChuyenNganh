package vn.project.jobhunter.domain;

import java.time.Instant;
import jakarta.persistence.Transient;
import com.fasterxml.jackson.annotation.JsonProperty;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import vn.project.jobhunter.util.constant.ResumeStateEnum;
import vn.project.jobhunter.util.error.SecurityUtil;

@Entity
@Getter
@Table(name = "resumes")
@Setter
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    @NotBlank(message = "email không được để trống")
    private String email;
    @NotBlank(message = "url không được để trống")
    private String url;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private ResumeStateEnum status;

    @Column(columnDefinition = "TEXT")
    private String statusNote;

    private Instant createdAt;
    private Instant updatedAt;

    private String createdBy;
    private String updatedBy;

    @Column(columnDefinition = "TEXT")
    private String summaryAi;

    private Integer aiMatchScore;

    @Column(length = 40)
    private String aiRecommendation;

    @Column(columnDefinition = "TEXT")
    private String aiMatchedSkills;

    @Column(columnDefinition = "TEXT")
    private String aiMissingSkills;

    @Column(columnDefinition = "TEXT")
    private String aiStrengths;

    @Column(columnDefinition = "TEXT")
    private String aiWeaknesses;

    @Column(columnDefinition = "TEXT")
    private String aiEvaluation;

    private Instant aiEvaluatedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "job_id")
    private Job job;

    @Transient
    @JsonProperty("companyName")
    public String getCompanyName() {
        if (this.getJob() != null && this.getJob().getCompany() != null) {
            return this.getJob().getCompany().getName();
        }
        return null;
    }

    @PrePersist
    public void handleBeforeCreate() {
        this.createdBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedBy = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        this.updatedAt = Instant.now();
    }
}
