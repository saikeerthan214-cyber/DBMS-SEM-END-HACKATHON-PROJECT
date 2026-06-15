package com.example.searchplatform.service;

import com.example.searchplatform.dto.ItemRequest;
import com.example.searchplatform.entity.Category;
import com.example.searchplatform.entity.Item;
import com.example.searchplatform.exception.ResourceNotFoundException;
import com.example.searchplatform.repository.CategoryRepository;
import com.example.searchplatform.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ItemService {

    @Autowired private ItemRepository     itemRepository;
    @Autowired private CategoryRepository categoryRepository;

    // ── READ ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
    }

    /**
     * Flexible search — all parameters are optional.
     * Uses simple targeted queries to avoid Hibernate null-binding type issues.
     */
    @Transactional(readOnly = true)
    public List<Item> searchItems(String keyword, Long categoryId,
                                  BigDecimal minPrice, BigDecimal maxPrice) {

        String kw = (keyword != null && keyword.isBlank()) ? null : keyword;
        boolean hasPriceFilter = (minPrice != null || maxPrice != null);

        if (!hasPriceFilter) {
            // Simple JPQL path — no price params, no type confusion
            return itemRepository.searchByKeywordAndCategory(kw, categoryId);
        }

        // Price filter: fetch broader set then filter in memory to avoid JPQL type issues
        List<Item> results = itemRepository.searchByKeywordAndCategory(kw, categoryId);
        final BigDecimal lo = (minPrice != null) ? minPrice : BigDecimal.ZERO;
        final BigDecimal hi = (maxPrice != null) ? maxPrice : new BigDecimal("999999999");

        return results.stream()
                .filter(i -> i.getPrice() != null
                        && i.getPrice().compareTo(lo) >= 0
                        && i.getPrice().compareTo(hi) <= 0)
                .collect(java.util.stream.Collectors.toList());
    }

    // ── WRITE ──────────────────────────────────────────────────

    /**
     * Create a new item from a validated DTO.
     * Resolves categoryId → Category entity and validates it exists.
     */
    @Transactional
    public Item createItem(ItemRequest request) {

        Item item = new Item();
        item.setTitle(request.getTitle().trim());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Category", request.getCategoryId()));
            item.setCategory(category);
        }

        return itemRepository.save(item);
    }

    /**
     * Update an existing item — supports partial updates (null fields are skipped).
     */
    @Transactional
    public Item updateItem(Long id, ItemRequest request) {

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            item.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Category", request.getCategoryId()));
            item.setCategory(category);
        }

        return itemRepository.save(item);
    }

    /**
     * Delete an item.  Throws 404 if it does not exist.
     */
    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Item", id);
        }
        itemRepository.deleteById(id);
    }

    /** @deprecated use {@link #createItem(ItemRequest)} instead */
    @Transactional
    public Item saveItem(Item item) {
        return itemRepository.save(item);
    }
}
