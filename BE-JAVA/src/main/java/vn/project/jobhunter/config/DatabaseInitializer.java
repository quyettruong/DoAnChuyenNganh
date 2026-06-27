package vn.project.jobhunter.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.project.jobhunter.domain.Permission;
import vn.project.jobhunter.domain.Role;
import vn.project.jobhunter.domain.User;
import vn.project.jobhunter.repository.PermissionRepository;
import vn.project.jobhunter.repository.RoleRepository;
import vn.project.jobhunter.repository.UserRepository;
import vn.project.jobhunter.util.constant.GenderEnum;

@Service
public class DatabaseInitializer implements CommandLineRunner {
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT DATABASE");

        long countPermissions = this.permissionRepository.count();
        long countRoles = this.roleRepository.count();
        long countUsers = this.userRepository.count();

        if (countPermissions == 0) {
            List<Permission> arr = new ArrayList<>();

            // COMPANIES
            arr.add(new Permission("Create a company", "/api/v1/companies", "POST", "COMPANIES"));
            arr.add(new Permission("Update a company", "/api/v1/companies", "PUT", "COMPANIES"));
            arr.add(new Permission("Delete a company", "/api/v1/companies/{id}", "DELETE", "COMPANIES"));
            arr.add(new Permission("Get a company by id", "/api/v1/companies/{id}", "GET", "COMPANIES"));
            arr.add(new Permission("Get companies with pagination", "/api/v1/companies", "GET", "COMPANIES"));

            // JOBS
            arr.add(new Permission("Create a job", "/api/v1/jobs", "POST", "JOBS"));
            arr.add(new Permission("Update a job", "/api/v1/jobs", "PUT", "JOBS"));
            arr.add(new Permission("Delete a job", "/api/v1/jobs/{id}", "DELETE", "JOBS"));
            arr.add(new Permission("Get a job by id", "/api/v1/jobs/{id}", "GET", "JOBS"));
            arr.add(new Permission("Get jobs with pagination", "/api/v1/jobs", "GET", "JOBS"));

            // SKILLS
            arr.add(new Permission("Create a skill", "/api/v1/skills", "POST", "SKILLS"));
            arr.add(new Permission("Update a skill", "/api/v1/skills", "PUT", "SKILLS"));
            arr.add(new Permission("Delete a skill", "/api/v1/skills/{id}", "DELETE", "SKILLS"));
            arr.add(new Permission("Get skills with pagination", "/api/v1/skills", "GET", "SKILLS"));

            // PERMISSIONS
            arr.add(new Permission("Create a permission", "/api/v1/permissions", "POST", "PERMISSIONS"));
            arr.add(new Permission("Update a permission", "/api/v1/permissions", "PUT", "PERMISSIONS"));
            arr.add(new Permission("Delete a permission", "/api/v1/permissions/{id}", "DELETE", "PERMISSIONS"));
            arr.add(new Permission("Get a permission by id", "/api/v1/permissions/{id}", "GET", "PERMISSIONS"));
            arr.add(new Permission("Get permissions with pagination", "/api/v1/permissions", "GET", "PERMISSIONS"));

            // ROLES
            arr.add(new Permission("Create a role", "/api/v1/roles", "POST", "ROLES"));
            arr.add(new Permission("Update a role", "/api/v1/roles", "PUT", "ROLES"));
            arr.add(new Permission("Delete a role", "/api/v1/roles/{id}", "DELETE", "ROLES"));
            arr.add(new Permission("Get a role by id", "/api/v1/roles/{id}", "GET", "ROLES"));
            arr.add(new Permission("Get roles with pagination", "/api/v1/roles", "GET", "ROLES"));

            // USERS
            arr.add(new Permission("Create a user", "/api/v1/users", "POST", "USERS"));
            arr.add(new Permission("Update a user", "/api/v1/users", "PUT", "USERS"));
            arr.add(new Permission("Delete a user", "/api/v1/users/{id}", "DELETE", "USERS"));
            arr.add(new Permission("Get a user by id", "/api/v1/users/{id}", "GET", "USERS"));
            arr.add(new Permission("Get users with pagination", "/api/v1/users", "GET", "USERS"));

            // RESUMES
            arr.add(new Permission("Create a resume", "/api/v1/resumes", "POST", "RESUMES"));
            arr.add(new Permission("Update a resume", "/api/v1/resumes", "PUT", "RESUMES"));
            arr.add(new Permission("Delete a resume", "/api/v1/resumes/{id}", "DELETE", "RESUMES"));
            arr.add(new Permission("Get a resume by id", "/api/v1/resumes/{id}", "GET", "RESUMES"));
            arr.add(new Permission("Get resumes with pagination", "/api/v1/resumes", "GET", "RESUMES"));
            arr.add(new Permission("Generate AI resume summary", "/api/v1/resumes/{id}/ai-summary", "POST", "RESUMES"));
            arr.add(new Permission("Evaluate resume by AI", "/api/v1/resumes/{id}/ai-evaluate", "POST", "RESUMES"));

            // SUBSCRIBERS
            arr.add(new Permission("Create a subscriber", "/api/v1/subscribers", "POST", "SUBSCRIBERS"));
            arr.add(new Permission("Update a subscriber", "/api/v1/subscribers", "PUT", "SUBSCRIBERS"));
            arr.add(new Permission("Delete a subscriber", "/api/v1/subscribers/{id}", "DELETE", "SUBSCRIBERS"));
            arr.add(new Permission("Get a subscriber by id", "/api/v1/subscribers/{id}", "GET", "SUBSCRIBERS"));
            arr.add(new Permission("Get subscribers with pagination", "/api/v1/subscribers", "GET", "SUBSCRIBERS"));

            // FILES
            arr.add(new Permission("Download a file", "/api/v1/files", "POST", "FILES"));
            arr.add(new Permission("Upload a file", "/api/v1/files", "GET", "FILES"));

            // Lưu vào DB
            this.permissionRepository.saveAll(arr);

        }
        Permission aiSummaryPermission = ensurePermission(
                "Generate AI resume summary",
                "/api/v1/resumes/{id}/ai-summary",
                "POST",
                "RESUMES");
        Permission aiEvaluatePermission = ensurePermission(
                "Evaluate resume by AI",
                "/api/v1/resumes/{id}/ai-evaluate",
                "POST",
                "RESUMES");
        Permission createSkillPermission = ensurePermission("Create a skill", "/api/v1/skills", "POST", "SKILLS");
        Permission updateSkillPermission = ensurePermission("Update a skill", "/api/v1/skills", "PUT", "SKILLS");
        Permission deleteSkillPermission = ensurePermission("Delete a skill", "/api/v1/skills/{id}", "DELETE",
                "SKILLS");
        Permission getSkillPermission = ensurePermission("Get skills with pagination", "/api/v1/skills", "GET",
                "SKILLS");

        if (countRoles == 0) {
            List<Permission> allPermissions = this.permissionRepository.findAll();

            Role adminRole = new Role();
            adminRole.setName("SUPER_ADMIN");
            adminRole.setDescription("Admin thì full permissions");
            adminRole.setActive(true);
            adminRole.setPermissions(allPermissions);

            this.roleRepository.save(adminRole);
        }

        grantPermissionToRole("SUPER_ADMIN", aiSummaryPermission);
        grantPermissionToRole("SUPER_ADMIN", aiEvaluatePermission);
        grantPermissionToRole("SUPER_ADMIN", createSkillPermission);
        grantPermissionToRole("SUPER_ADMIN", updateSkillPermission);
        grantPermissionToRole("SUPER_ADMIN", deleteSkillPermission);
        grantPermissionToRole("SUPER_ADMIN", getSkillPermission);
        grantPermissionToRole("HR", aiSummaryPermission);
        grantPermissionToRole("HR", aiEvaluatePermission);

        // Khởi tạo User admin nếu chưa có
        if (!this.userRepository.findByEmail("admin@gmail.com").isPresent()) {
            User adminUser = new User();
            adminUser.setEmail("admin@gmail.com");
            adminUser.setAddress("tphcm");
            adminUser.setAge(21);
            adminUser.setGender(GenderEnum.MALE);
            adminUser.setName("I'm super admin");
            adminUser.setPassword(this.passwordEncoder.encode("123456"));

            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            if (adminRole != null) {
                adminUser.setRole(adminRole);
            }

            this.userRepository.save(adminUser);
        }

        if (countPermissions > 0 && countRoles > 0 && countUsers > 0) {
            System.out.println(">>> SKIP INIT DATABASE ~ ALREADY HAVE DATA...");
        } else {
            System.out.println(">>> END INIT DATABASE");
        }
    }

    private Permission ensurePermission(String name, String apiPath, String method, String module) {
        return this.permissionRepository.findByModuleAndApiPathAndMethod(module, apiPath, method)
                .orElseGet(() -> this.permissionRepository.save(new Permission(name, apiPath, method, module)));
    }

    private void grantPermissionToRole(String roleName, Permission permission) {
        Role role = this.roleRepository.findByName(roleName);
        if (role == null || permission == null) {
            return;
        }

        List<Permission> permissions = role.getPermissions();
        if (permissions == null) {
            permissions = new ArrayList<>();
            role.setPermissions(permissions);
        }

        boolean existed = permissions.stream().anyMatch(item -> item.getId() == permission.getId());
        if (!existed) {
            permissions.add(permission);
            this.roleRepository.save(role);
        }
    }

}
