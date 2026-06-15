package com.example.searchplatform.controller;

import com.example.searchplatform.dto.AuthResponse;
import com.example.searchplatform.dto.LoginRequest;
import com.example.searchplatform.dto.RegisterRequest;
import com.example.searchplatform.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller — register and login.
 *
 * All business-logic exceptions are handled by GlobalExceptionHandler;
 * no try/catch needed here.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "http://localhost:*")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /api/auth/register
     * Body is validated by @Valid before reaching the service.
     * Returns 201 Created with the JWT token on success.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/auth/login
     * Returns 200 OK with the JWT token on success.
     * GlobalExceptionHandler converts BadCredentialsException → 401.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
