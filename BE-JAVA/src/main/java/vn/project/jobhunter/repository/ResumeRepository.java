package vn.project.jobhunter.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import vn.project.jobhunter.domain.Resume;
import vn.project.jobhunter.util.constant.ResumeStateEnum;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long>, JpaSpecificationExecutor<Resume> {
    long countByJobIdAndStatus(Long jobId, ResumeStateEnum status);

    long countByJobIdAndStatusAndIdNot(Long jobId, ResumeStateEnum status, Long id);

    List<Resume> findByJobIdAndStatusInAndIdNot(Long jobId, Collection<ResumeStateEnum> statuses, Long id);
}
