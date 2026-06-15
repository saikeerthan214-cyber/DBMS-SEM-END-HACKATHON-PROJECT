package com.example.searchplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Username is required")
    @Size(max = 50, message = "Username must not exceed 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 128, message = "Password must not exceed 128 characters")
    private String password;

    public LoginRequest() {}

    public String getUsername()               { return username; }
    public void   setUsername(String u)       { this.username = u; }

    public String getPassword()               { return password; }
    public void   setPassword(String p)       { this.password = p; }
}
