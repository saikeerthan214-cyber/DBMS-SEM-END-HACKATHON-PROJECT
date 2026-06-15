package com.example.searchplatform.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
    @Pattern(regexp = "^[A-Za-z0-9_]+$",
             message = "Username may only contain letters, numbers, and underscores")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 128, message = "Password must be 6–128 characters")
    private String password;

    @Pattern(regexp = "^(USER|ADMIN)?$", message = "Role must be USER or ADMIN")
    private String role;

    public RegisterRequest() {}

    public String getUsername()               { return username; }
    public void   setUsername(String u)       { this.username = u; }

    public String getEmail()                  { return email; }
    public void   setEmail(String e)          { this.email = e; }

    public String getPassword()               { return password; }
    public void   setPassword(String p)       { this.password = p; }

    public String getRole()                   { return role; }
    public void   setRole(String r)           { this.role = r; }
}
