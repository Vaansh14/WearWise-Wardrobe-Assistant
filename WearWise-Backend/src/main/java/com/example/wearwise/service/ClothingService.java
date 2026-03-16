package com.example.wearwise.service;

import com.example.wearwise.model.Clothing;
import com.example.wearwise.repository.ClothingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClothingService {

    private final ClothingRepository clothingRepository;

    public ClothingService(ClothingRepository clothingRepository) {
        this.clothingRepository = clothingRepository;
    }

    public Clothing saveClothing(Clothing clothing) {
        return clothingRepository.save(clothing);
    }

    public List<Clothing> getAllClothes() {
        return clothingRepository.findAll();
    }

    public void deleteClothing(Long id) {
        clothingRepository.deleteById(id);
    }

    public Clothing updateClothing(Long id, Clothing clothing) {
        Clothing existing = clothingRepository.findById(id).orElseThrow();

        existing.setCategory(clothing.getCategory());
        existing.setColor(clothing.getColor());
        existing.setSeason(clothing.getSeason());

        return clothingRepository.save(existing);
    }
}