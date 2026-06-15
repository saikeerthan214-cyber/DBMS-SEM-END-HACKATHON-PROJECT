package com.example.searchplatform.service;

import com.example.searchplatform.dto.AuthResponse;
import com.example.searchplatform.dto.LoginRequest;
import com.example.searchplatform.dto.RegisterRequest;
import com.example.searchplatform.entity.User;
import com.example.searchplatform.exception.DuplicateResourceException;
import com.example.searchplatform.repository.UserRepository;
import com.example.searchplatform.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired private UserRepository  userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil         jwtUtil;

    /**
     * Register a new user account.
     * Validates uniqueness of username and email before persisting.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // ── Uniqueness checks ──────────────────────────────────
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException(
                    "Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email '" + request.getEmail() + "' is already registered");
        }

        // ── Build and persist user ─────────────────────────────
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        String role = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase()
                : "USER";
        if (!role.equals("USER") && !role.equals("ADMIN")) {
            throw new IllegalArgumentException("Role must be USER or ADMIN");
        }
        user.setRole(role);

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getRole(), user.getUsername());
    }

    /**
     * Authenticate a user and return a JWT token.
     * Uses a generic error message for both "user not found" and "wrong password"
     * to prevent user enumeration attacks.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, user.getRole(), user.getUsername());
    }
}
