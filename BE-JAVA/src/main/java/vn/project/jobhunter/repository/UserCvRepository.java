package vn.project.jobhunter.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.project.jobhunter.domain.UserCv;

@Repository
public interface UserCvRepository extends JpaRepository<UserCv, Long>, JpaSpecificationExecutor<UserCv> {
    Page<UserCv> findByUserEmailOrderByUpdatedAtDescCreatedAtDesc(String email, Pageable pageable);

    Optional<UserCv> findByIdAndUserEmail(Long id, String email);

    boolean existsByUserEmail(String email);

    @Modifying
    @Query("update UserCv cv set cv.defaultCv = false where cv.user.email = :email")
    void clearDefaultByUserEmail(@Param("email") String email);
}
