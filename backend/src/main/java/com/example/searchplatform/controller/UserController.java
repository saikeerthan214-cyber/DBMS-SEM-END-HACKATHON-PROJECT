package com.example.searchplatform.controller;

import com.example.searchplatform.dto.UserResponse;
import com.example.searchplatform.exception.ResourceNotFoundException;
import com.example.searchplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * User management endpoints — ADMIN only.
 *
 * Passwords are never returned (UserResponse DTO excludes the password field).
 *
 * GET  /api/users        — list all users
 * GET  /api/users/{id}   — get one user
 * DELETE /api/users/{id} — delete a user account
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(originPatterns = "http://localhost:*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /** List all registered users. Returns a safe DTO without passwords. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /** Get a single user by ID. */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    /** Delete a user account permanently. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
