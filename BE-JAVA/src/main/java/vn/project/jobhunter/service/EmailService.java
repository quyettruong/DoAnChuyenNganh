package vn.project.jobhunter.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@jobhunter.com}")
    private String fromAddress;

    private final String frontendUrl = "http://localhost:4173";

    public void sendResetPasswordEmail(String toEmail, String token) {

        String link = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Đặt lại mật khẩu JobHunter");
        message.setText(
                "Xin chào,\n\nBạn đã yêu cầu đặt lại mật khẩu.\n" +
                        "Nhấn vào link sau để đặt lại mật khẩu:\n" +
                        link + "\n\n" +
                        "Liên kết có hiệu lực trong 15 phút.\n\n" +
                        "Trân trọng,\nJobHunter Team");

        mailSender.send(message);
    }
}
