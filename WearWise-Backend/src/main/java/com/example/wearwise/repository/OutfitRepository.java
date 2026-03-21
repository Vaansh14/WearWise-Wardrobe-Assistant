package com.example.wearwise.repository;

import com.example.wearwise.model.Outfit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutfitRepository extends JpaRepository<Outfit, Long> {}