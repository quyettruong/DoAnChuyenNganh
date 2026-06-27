package vn.project.jobhunter.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.UserCv;
import vn.project.jobhunter.domain.request.ReqUserCvDTO;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.usercv.ResUserCvDTO;
import vn.project.jobhunter.repository.UserCvRepository;
import vn.project.jobhunter.repository.UserRepository;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.SecurityUtil;

@Service
public class UserCvService {
    private final UserCvRepository userCvRepository;
    private final UserRepository userRepository;

    public UserCvService(UserCvRepository userCvRepository, UserRepository userRepository) {
        this.userCvRepository = userCvRepository;
        this.userRepository = userRepository;
    }

    private String getCurrentEmail() {
        return SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new IdInvalidException("Bạn cần đăng nhập để quản lý CV"));
    }

    private User getCurrentUser() {
        String email = getCurrentEmail();
        return this.userRepository.findByEmail(email)
                .orElseThrow(() -> new IdInvalidException("Không tìm thấy user hiện tại"));
    }

    private UserCv getOwnedCv(Long id) {
        String email = getCurrentEmail();
        return this.userCvRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new IdInvalidException("CV không tồn tại hoặc không thuộc tài khoản của bạn"));
    }

    public ResUserCvDTO convertToResUserCvDTO(UserCv cv) {
        ResUserCvDTO res = new ResUserCvDTO();
        res.setId(cv.getId());
        res.setTitle(cv.getTitle());
        res.setTemplateCode(cv.getTemplateCode());
        res.setTheme(cv.getTheme());
        res.setCvData(cv.getCvData());
        res.setDefaultCv(cv.isDefaultCv());
        res.setCreatedAt(cv.getCreatedAt());
        res.setUpdatedAt(cv.getUpdatedAt());
        return res;
    }

    public ResultPaginationDTO fetchCurrentUserCvs(Pageable pageable) {
        String email = getCurrentEmail();
        Page<UserCv> pageCv = this.userCvRepository.findByUserEmailOrderByUpdatedAtDescCreatedAtDesc(email, pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageCv.getNumber() + 1);
        mt.setPageSize(pageCv.getSize());
        mt.setPages(pageCv.getTotalPages());
        mt.setTotal(pageCv.getTotalElements());
        rs.setMeta(mt);

        List<ResUserCvDTO> cvs = pageCv.getContent()
                .stream()
                .map(this::convertToResUserCvDTO)
                .collect(Collectors.toList());
        rs.setResult(cvs);
        return rs;
    }

    public ResUserCvDTO fetchById(Long id) {
        return convertToResUserCvDTO(getOwnedCv(id));
    }

    @Transactional
    public ResUserCvDTO create(ReqUserCvDTO req) {
        User currentUser = getCurrentUser();
        boolean shouldSetDefault = req.isDefaultCv() || !this.userCvRepository.existsByUserEmail(currentUser.getEmail());

        if (shouldSetDefault) {
            this.userCvRepository.clearDefaultByUserEmail(currentUser.getEmail());
        }

        UserCv cv = new UserCv();
        cv.setTitle(req.getTitle());
        cv.setTemplateCode(req.getTemplateCode());
        cv.setTheme(req.getTheme());
        cv.setCvData(req.getCvData());
        cv.setDefaultCv(shouldSetDefault);
        cv.setUser(currentUser);

        return convertToResUserCvDTO(this.userCvRepository.save(cv));
    }

    @Transactional
    public ResUserCvDTO update(Long id, ReqUserCvDTO req) {
        String email = getCurrentEmail();
        UserCv cv = getOwnedCv(id);

        if (req.isDefaultCv()) {
            this.userCvRepository.clearDefaultByUserEmail(email);
        }

        cv.setTitle(req.getTitle());
        cv.setTemplateCode(req.getTemplateCode());
        cv.setTheme(req.getTheme());
        cv.setCvData(req.getCvData());
        cv.setDefaultCv(req.isDefaultCv() || cv.isDefaultCv());

        return convertToResUserCvDTO(this.userCvRepository.save(cv));
    }

    @Transactional
    public ResUserCvDTO setDefault(Long id) {
        String email = getCurrentEmail();
        UserCv cv = getOwnedCv(id);
        this.userCvRepository.clearDefaultByUserEmail(email);
        cv.setDefaultCv(true);
        return convertToResUserCvDTO(this.userCvRepository.save(cv));
    }

    public void delete(Long id) {
        UserCv cv = getOwnedCv(id);
        this.userCvRepository.delete(cv);
    }
}
