package com.example.searchplatform.dto;

import jakarta.validation.constraints.*;

public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 100, message = "Name must be 1–100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    public CategoryRequest() {}

    public String getName()               { return name; }
    public void   setName(String n)       { this.name = n; }

    public String getDescription()        { return description; }
    public void   setDescription(String d){ this.description = d; }
}
