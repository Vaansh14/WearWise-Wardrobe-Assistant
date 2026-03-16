package com.example.wearwise.repository;

import com.example.wearwise.model.Clothing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClothingRepository extends JpaRepository<Clothing, Long> {

}