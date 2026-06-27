package vn.project.jobhunter.controller;

import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.domain.request.ForgotPasswordRequest;
import vn.project.jobhunter.domain.request.ReqLoginDTO;
import vn.project.jobhunter.domain.request.ResetPasswordRequest;
import vn.project.jobhunter.domain.response.ApiResponse;
import vn.project.jobhunter.domain.response.ResCreateUserDTO;
import vn.project.jobhunter.domain.response.ResLoginDTO;
import vn.project.jobhunter.service.AuthService;
import vn.project.jobhunter.service.UserService;
import vn.project.jobhunter.util.annotation.ApiMessage;
import vn.project.jobhunter.util.error.IdInvalidException;
import vn.project.jobhunter.util.error.SecurityUtil;
import org.springframework.web.bind.annotation.PutMapping;
import org.apache.coyote.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import vn.project.jobhunter.domain.request.UpdateProfileRequest;
import vn.project.jobhunter.domain.request.ChangePasswordRequest;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtil securityUtil;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final UserService userService;
    private final AuthService authService;
    @Value("${myProject.jwt.validity-token-refresh-in-seconds}")
    private long refreshTokenExpiration;

    public AuthController(AuthenticationManagerBuilder authenticationManagerBuilder, SecurityUtil securityUtil,
            UserService userService, PasswordEncoder passwordEncoder, AuthService authService) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.securityUtil = securityUtil;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody ReqLoginDTO loginDto) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginDto.getUsername(), loginDto.getPassword());

        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        ResLoginDTO res = new ResLoginDTO();

        User currentUserDB = this.userService.handleGetUserByUsername(loginDto.getUsername());

        if (currentUserDB != null) {
            ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                    currentUserDB.getId(),
                    currentUserDB.getEmail(),
                    currentUserDB.getName(),
                    currentUserDB.getAvatar(),
                    currentUserDB.getRole(),
                    buildCompanyLogin(currentUserDB));
            res.setUser(userLogin);
        }

        String access_token = this.securityUtil.createAccessToken(authentication.getName(), res);
        res.setAccessToken(access_token);

        String refresh_token = this.securityUtil.createReFreshToken(loginDto.getUsername(), res);

        this.userService.updateUserToken(refresh_token, loginDto.getUsername());

        ResponseCookie resCookies = ResponseCookie
                .from("refresh_token", refresh_token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshTokenExpiration).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(res);

    }

    @GetMapping("/auth/account")
    @ApiMessage("Fetch Account Message")
    public ResponseEntity<ResLoginDTO.UserGetAccount> getAccount() {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        User currentUserDB = this.userService.handleGetUserByUsername(email);

        ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin();
        ResLoginDTO.UserGetAccount userGetAccount = new ResLoginDTO.UserGetAccount();

        if (currentUserDB != null) {
            userLogin.setId(currentUserDB.getId());
            userLogin.setEmail(currentUserDB.getEmail());
            userLogin.setName(currentUserDB.getName());
            userLogin.setAvatar(currentUserDB.getAvatar());
            userLogin.setRole(currentUserDB.getRole());
            userLogin.setCompany(buildCompanyLogin(currentUserDB));
            userGetAccount.setUser(userLogin);
        }

        return ResponseEntity.ok().body(userGetAccount);

    }

    @GetMapping("/auth/refresh")
    @ApiMessage("Get user by refresh token")
    public ResponseEntity<ResLoginDTO> getRefreshToken(
            @CookieValue(name = "refresh_token", defaultValue = "default") String refresh_token) {
        if (refresh_token.equals("default")) {
            throw new IdInvalidException("you don't have refresh token in cookie");
        }
        // check valid
        Jwt decodedToken = this.securityUtil.checkValidRefreshToken(refresh_token);
        String email = decodedToken.getSubject();

        User currentUser = this.userService.getUserByRefreshTokenAndEmail(refresh_token, email);
        if (currentUser == null) {
            throw new IdInvalidException("Something went wrong");
        }

        ResLoginDTO res = new ResLoginDTO();

        User currentUserDB = this.userService.handleGetUserByUsername(email);

        if (currentUserDB != null) {
            ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
                    currentUserDB.getId(),
                    currentUserDB.getEmail(),
                    currentUserDB.getName(),
                    currentUserDB.getAvatar(),
                    currentUserDB.getRole(),
                    buildCompanyLogin(currentUserDB));
            res.setUser(userLogin);
        }

        String access_token = this.securityUtil.createAccessToken(email, res);

        res.setAccessToken(access_token);
        String new_refresh_token = this.securityUtil.createReFreshToken(email, res);
        this.userService.updateUserToken(new_refresh_token, email);

        ResponseCookie resCookies = ResponseCookie
                .from("refresh_token", new_refresh_token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshTokenExpiration).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(res);
    }

    @PostMapping("/auth/logout")
    @ApiMessage("Lougout User")
    public ResponseEntity<Void> logout() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        if (email.equals("")) {
            throw new IdInvalidException("Access Token không hợp lệ");
        }
        this.userService.updateUserToken(null, email);
        ResponseCookie cookie = ResponseCookie.from("refresh_token", null)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(null);

    }

    @PostMapping("/auth/register")
    @ApiMessage("Create a new user")
    public ResponseEntity<ResCreateUserDTO> register(@Valid @RequestBody User postManUser)
            throws IdInvalidException {
        boolean isEmailExist = this.userService.isEmailExist(postManUser.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + postManUser.getEmail() + " đã tồn tại, vui lòng sử dụng email khác");
        }
        String HashCode = passwordEncoder.encode(postManUser.getPassword());
        postManUser.setPassword(HashCode);
        User newUser = this.userService.handleCreateUser(postManUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(newUser));
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.generateResetPasswordToken(request.getEmail());
        return ResponseEntity.ok("Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu");
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Đặt lại mật khẩu thành công");
    }

    @PutMapping("/auth/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        User result = authService.updateProfile(request);
        return ResponseEntity.ok(result);
    }

    // src/main/java/vn/project/jobhunter/controller/AuthController.java

    @PutMapping("/auth/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody ChangePasswordRequest request) throws BadRequestException {

        authService.changePassword(request);

        ApiResponse<String> res = ApiResponse.<String>builder()
                .statusCode(200)
                .message("Đổi mật khẩu thành công")
                .build();

        return ResponseEntity.ok(res);
    }

    private ResLoginDTO.CompanyLogin buildCompanyLogin(User user) {
        if (user == null || user.getCompany() == null) {
            return null;
        }

        return new ResLoginDTO.CompanyLogin(
                user.getCompany().getId(),
                user.getCompany().getName(),
                user.getCompany().getLogo());
    }

}
