package vn.project.jobhunter.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.project.jobhunter.domain.request.ReqUserCvDTO;
import vn.project.jobhunter.domain.response.ResultPaginationDTO;
import vn.project.jobhunter.domain.response.usercv.ResUserCvDTO;
import vn.project.jobhunter.service.UserCvService;
import vn.project.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1")
public class UserCvController {
    private final UserCvService userCvService;

    public UserCvController(UserCvService userCvService) {
        this.userCvService = userCvService;
    }

    @GetMapping("/user-cvs")
    @ApiMessage("Fetch current user CVs")
    public ResponseEntity<ResultPaginationDTO> fetchCurrentUserCvs(Pageable pageable) {
        return ResponseEntity.ok(this.userCvService.fetchCurrentUserCvs(pageable));
    }

    @GetMapping("/user-cvs/{id}")
    @ApiMessage("Fetch current user CV by id")
    public ResponseEntity<ResUserCvDTO> fetchById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(this.userCvService.fetchById(id));
    }

    @PostMapping("/user-cvs")
    @ApiMessage("Create current user CV")
    public ResponseEntity<ResUserCvDTO> create(@Valid @RequestBody ReqUserCvDTO req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userCvService.create(req));
    }

    @PutMapping("/user-cvs/{id}")
    @ApiMessage("Update current user CV")
    public ResponseEntity<ResUserCvDTO> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody ReqUserCvDTO req) {
        return ResponseEntity.ok(this.userCvService.update(id, req));
    }

    @PutMapping("/user-cvs/{id}/default")
    @ApiMessage("Set default current user CV")
    public ResponseEntity<ResUserCvDTO> setDefault(@PathVariable("id") Long id) {
        return ResponseEntity.ok(this.userCvService.setDefault(id));
    }

    @DeleteMapping("/user-cvs/{id}")
    @ApiMessage("Delete current user CV")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        this.userCvService.delete(id);
        return ResponseEntity.ok().body(null);
    }
}
