package com.rhconnect.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final String code;
    private final int httpStatus;

    public BusinessException(String message, String code, int httpStatus) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
    }

    public BusinessException(String message, String code) {
        super(message);
        this.code = code;
        this.httpStatus = 422;
    }

    public BusinessException(String message) {
        super(message);
        this.code = "BUSINESS_ERROR";
        this.httpStatus = 422;
    }
}
