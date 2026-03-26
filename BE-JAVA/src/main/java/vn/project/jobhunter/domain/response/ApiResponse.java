package vn.project.jobhunter.domain.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ApiResponse<T> {
    private int statusCode;
    private String message;
    private T data;
}