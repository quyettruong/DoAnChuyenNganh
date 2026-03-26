package vn.project.jobhunter.service;

import lombok.RequiredArgsConstructor;

import org.apache.coyote.BadRequestException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import vn.project.jobhunter.domain.request.UpdateProfileRequest;
import vn.project.jobhunter.domain.request.ChangePasswordRequest;
import vn.project.jobhunter.util.error.SecurityUtil;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Tạo token + gửi mail
    public void generateResetPasswordToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        String token = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plus(15, ChronoUnit.MINUTES);

        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(expiry);
        userRepository.save(user);

        emailService.sendResetPasswordEmail(user.getEmail(), token);
    }

    // Đặt lại mật khẩu
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ"));

        if (user.getResetPasswordTokenExpiry().isBefore(Instant.now())) {
            throw new RuntimeException("Token đã hết hạn");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null); // clear token
        user.setResetPasswordTokenExpiry(null); // clear expiry

        userRepository.save(user);
    }

    // ---------------------- UPDATE PROFILE ----------------------
    public User updateProfile(UpdateProfileRequest request) {
        String email = SecurityUtil.getCurrentUserLogin().orElseThrow();
        User user = userRepository.findByEmail(email).orElseThrow();

        if (request.getName() != null)
            user.setName(request.getName());
        if (request.getAddress() != null)
            user.setAddress(request.getAddress());
        if (request.getAge() != null)
            user.setAge(request.getAge());

        return userRepository.save(user);
    }

    // src/main/java/vn/project/jobhunter/service/AuthService.java

    @Transactional
    public void changePassword(ChangePasswordRequest request) throws BadRequestException {
        // Lấy email user hiện tại từ SecurityContext
        String email = SecurityUtil.getCurrentUserLogin()
                .orElseThrow(() -> new RuntimeException("User not logged in"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Sai mật khẩu cũ -> trả về 400 (Bad Request), KHÔNG phải 403
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

}
