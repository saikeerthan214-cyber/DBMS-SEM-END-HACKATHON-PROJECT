package com.example.searchplatform.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ItemRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be 1–255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be 0 or greater")
    private BigDecimal price;

    @Positive(message = "categoryId must be a positive integer")
    private Long categoryId;

    public ItemRequest() {}

    public String getTitle()                { return title; }
    public void   setTitle(String t)        { this.title = t; }

    public String getDescription()          { return description; }
    public void   setDescription(String d)  { this.description = d; }

    public BigDecimal getPrice()            { return price; }
    public void       setPrice(BigDecimal p){ this.price = p; }

    public Long   getCategoryId()           { return categoryId; }
    public void   setCategoryId(Long id)    { this.categoryId = id; }
}
