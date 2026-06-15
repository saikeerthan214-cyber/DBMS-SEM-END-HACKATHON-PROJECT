package com.example.searchplatform.dto;

import com.example.searchplatform.entity.User;
import java.time.LocalDateTime;

/**
 * Safe DTO for returning user data — password field is intentionally excluded.
 */
public class UserResponse {

    private Long          id;
    private String        username;
    private String        email;
    private String        role;
    private LocalDateTime createdAt;

    public UserResponse() {}

    public static UserResponse from(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }

    public Long          getId()                       { return id; }
    public void          setId(Long id)                { this.id = id; }

    public String        getUsername()                 { return username; }
    public void          setUsername(String username)  { this.username = username; }

    public String        getEmail()                    { return email; }
    public void          setEmail(String email)        { this.email = email; }

    public String        getRole()                     { return role; }
    public void          setRole(String role)          { this.role = role; }

    public LocalDateTime getCreatedAt()                { return createdAt; }
    public void          setCreatedAt(LocalDateTime t) { this.createdAt = t; }
}
