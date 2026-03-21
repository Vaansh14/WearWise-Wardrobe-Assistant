package com.example.wearwise.service;

import com.example.wearwise.model.Outfit;
import com.example.wearwise.repository.OutfitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OutfitService {

    private final OutfitRepository outfitRepository;

    public OutfitService(OutfitRepository outfitRepository) {
        this.outfitRepository = outfitRepository;
    }

    public Outfit saveOutfit(Outfit outfit) {
        return outfitRepository.save(outfit);
    }

    public List<Outfit> getAllOutfits() {
        return outfitRepository.findAll();
    }
    public void deleteOutfit(Long id) {
        outfitRepository.deleteById(id);
    }
}