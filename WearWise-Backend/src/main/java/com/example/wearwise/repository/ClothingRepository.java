package com.example.wearwise.repository;

import com.example.wearwise.model.Clothing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClothingRepository extends JpaRepository<Clothing, Long> {
    List<Clothing> findByUserId(Long userId);
}