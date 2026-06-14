package com.example.searchplatform.service;

import com.example.searchplatform.entity.Item;
import com.example.searchplatform.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Item saveItem(Item item) {
        return itemRepository.save(item);
    }

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }

    public List<Item> searchItems(String keyword) {
        return itemRepository.findByTitleContainingIgnoreCase(keyword);
    }

    public List<Item> searchItemsByKeywordAndCategory(String keyword, Long categoryId) {
        return itemRepository.searchByKeywordAndCategory(keyword, categoryId);
    }
}
