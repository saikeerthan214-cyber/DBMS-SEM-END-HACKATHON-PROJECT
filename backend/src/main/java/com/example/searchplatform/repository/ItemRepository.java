package com.example.searchplatform.repository;

import com.example.searchplatform.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByTitleContainingIgnoreCase(String keyword);

    @Query("SELECT i FROM Item i WHERE " +
           "(:keyword IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR i.category.id = :categoryId)")
    List<Item> searchByKeywordAndCategory(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId);
}
