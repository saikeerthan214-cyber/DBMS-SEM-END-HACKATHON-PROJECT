package com.example.searchplatform.controller;

import com.example.searchplatform.dto.CategoryRequest;
import com.example.searchplatform.entity.Category;
import com.example.searchplatform.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Categories CRUD controller.
 *
 * Access control:
 *   GET  /api/categories/**      — public
 *   POST /api/categories         — ADMIN only
 *   PUT  /api/categories/{id}    — ADMIN only
 *   DELETE /api/categories/{id}  — ADMIN only
 */
@RestController
@RequestMapping("/api/categories")
@CrossOrigin(originPatterns = "http://localhost:*")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // ── GET all ───────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // ── GET by id ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    // ── GET item count in category ────────────────────────────
    @GetMapping("/{id}/item-count")
    public ResponseEntity<Map<String, Object>> getItemCount(@PathVariable Long id) {
        // Validates the category exists first
        categoryService.getCategoryById(id);
        long count = categoryService.countItems(id);
        return ResponseEntity.ok(Map.of("categoryId", id, "itemCount", count));
    }

    // ── POST create ───────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> createCategory(
            @Valid @RequestBody CategoryRequest request) {

        Category created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── PUT update ────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {

        Category updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(updated);
    }

    // ── DELETE ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
