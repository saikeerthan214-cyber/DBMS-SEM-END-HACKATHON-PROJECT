package com.example.searchplatform.controller;

import com.example.searchplatform.entity.Item;
import com.example.searchplatform.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(originPatterns = "http://localhost:*")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public List<Item> getAllItems() {
        return itemService.getAllItems();
    }

    @PostMapping
    public Item addItem(@RequestBody Item item) {
        return itemService.saveItem(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search by keyword only:  GET /api/items/search?keyword=laptop
     * Search with category:    GET /api/items/search?keyword=laptop&categoryId=2
     */
    @GetMapping("/search")
    public List<Item> searchItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId) {

        if (categoryId != null) {
            return itemService.searchItemsByKeywordAndCategory(keyword, categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            return itemService.searchItems(keyword);
        }
        return itemService.getAllItems();
    }
}
