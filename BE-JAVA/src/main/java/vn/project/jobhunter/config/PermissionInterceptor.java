package vn.project.jobhunter.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vn.project.jobhunter.domain.Permission;
import vn.project.jobhunter.domain.Role;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.service.UserService;
import vn.project.jobhunter.util.error.PermissionException;
import vn.project.jobhunter.util.error.SecurityUtil;

public class PermissionInterceptor implements HandlerInterceptor {
    @Autowired
    UserService userService;

    @Override
    @Transactional
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response, Object handler)
            throws Exception {

        String path = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String requestURI = request.getRequestURI();
        String httpMethod = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(httpMethod) || isPublicReadEndpoint(httpMethod, requestURI)) {
            return true;
        }

        String email = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        if (email != null && !email.isEmpty()) {
            User user = this.userService.handleGetUserByUsername(email);
            if (user != null) {
                Role role = user.getRole();
                if (role != null) {
                    List<Permission> permissions = role.getPermissions();
                    if (permissions == null) {
                        throw new PermissionException("Bạn không có quyền truy cập endpoint");
                    }
                    boolean isAllow = permissions.stream().anyMatch(
                            item -> item.getApiPath().equals(path) && item.getMethod().equals(httpMethod));
                    if (isAllow == false) {
                        throw new PermissionException("Bạn không có quyền truy cập endpoint");
                    }
                } else {
                    throw new PermissionException("Bạn không có quyền truy cập endpoint");
                }
            }
        }
        return true;
    }

    private boolean isPublicReadEndpoint(String httpMethod, String requestURI) {
        if (!"GET".equalsIgnoreCase(httpMethod) || requestURI == null) {
            return false;
        }

        return requestURI.startsWith("/api/v1/companies")
                || requestURI.startsWith("/api/v1/skills");
    }
}
