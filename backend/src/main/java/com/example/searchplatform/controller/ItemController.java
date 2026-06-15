package com.example.searchplatform.controller;

import com.example.searchplatform.dto.ItemRequest;
import com.example.searchplatform.entity.Item;
import com.example.searchplatform.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Items (Listings) CRUD controller.
 *
 * Access control:
 *   GET  /api/items/**        — public
 *   POST /api/items           — ADMIN only
 *   PUT  /api/items/{id}      — ADMIN only
 *   DELETE /api/items/{id}    — ADMIN only
 */
@RestController
@RequestMapping("/api/items")
@CrossOrigin(originPatterns = "http://localhost:*")
public class ItemController {

    @Autowired
    private ItemService itemService;

    // ── GET all ───────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        return ResponseEntity.ok(itemService.getAllItems());
    }

    // ── GET by id ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    // ── GET search with filters ───────────────────────────────
    /**
     * All parameters are optional.
     *
     * Examples:
     *   GET /api/items/search?keyword=laptop
     *   GET /api/items/search?categoryId=1
     *   GET /api/items/search?keyword=chair&minPrice=1000&maxPrice=9000
     */
    @GetMapping("/search")
    public ResponseEntity<List<Item>> searchItems(
            @RequestParam(required = false) String     keyword,
            @RequestParam(required = false) Long       categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        return ResponseEntity.ok(
                itemService.searchItems(keyword, categoryId, minPrice, maxPrice));
    }

    // ── POST create ───────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Item> createItem(
            @Valid @RequestBody ItemRequest request) {

        Item created = itemService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── PUT update ────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Item> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemRequest request) {

        Item updated = itemService.updateItem(id, request);
        return ResponseEntity.ok(updated);
    }

    // ── DELETE ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
