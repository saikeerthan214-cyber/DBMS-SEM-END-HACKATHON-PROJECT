package com.example.searchplatform.service;

import com.example.searchplatform.dto.CategoryRequest;
import com.example.searchplatform.entity.Category;
import com.example.searchplatform.exception.DuplicateResourceException;
import com.example.searchplatform.exception.ResourceNotFoundException;
import com.example.searchplatform.repository.CategoryRepository;
import com.example.searchplatform.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ItemRepository     itemRepository;

    // ── READ ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    // ── WRITE ──────────────────────────────────────────────────

    /**
     * Create a new category — enforces unique name constraint.
     */
    @Transactional
    public Category createCategory(CategoryRequest request) {
        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException(
                    "Category '" + name + "' already exists");
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(request.getDescription());
        return categoryRepository.save(category);
    }

    /**
     * Update an existing category — partial updates supported.
     */
    @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            // Allow same name (no change); reject if another category has that name
            if (!newName.equalsIgnoreCase(category.getName())
                    && categoryRepository.existsByNameIgnoreCase(newName)) {
                throw new DuplicateResourceException(
                        "Category '" + newName + "' already exists");
            }
            category.setName(newName);
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        return categoryRepository.save(category);
    }

    /**
     * Delete a category.
     * Items referencing this category will have category_id set to NULL
     * by the DB FK constraint (ON DELETE SET NULL).
     */
    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        categoryRepository.deleteById(id);
    }

    /** Returns the number of items that belong to a category. */
    @Transactional(readOnly = true)
    public long countItems(Long categoryId) {
        return itemRepository.countByCategoryId(categoryId);
    }
}
