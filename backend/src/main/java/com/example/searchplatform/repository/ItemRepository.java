package com.example.searchplatform.repository;

import com.example.searchplatform.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    /** Simple keyword search on title. */
    List<Item> findByTitleContainingIgnoreCase(String keyword);

    /** All items in a category. */
    List<Item> findByCategoryId(Long categoryId);

    /**
     * Combined keyword + optional category filter — JPQL.
     * Null keyword or null categoryId disables that filter.
     * Price-range filtering is done in the service layer to avoid
     * Hibernate null-binding type-inference issues with numeric params.
     */
    @Query("SELECT i FROM Item i WHERE " +
           "(:keyword IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR i.category.id = :categoryId)")
    List<Item> searchByKeywordAndCategory(
            @Param("keyword")    String keyword,
            @Param("categoryId") Long   categoryId);

    /** Count items belonging to a category — used before deletion. */
    long countByCategoryId(Long categoryId);
}
