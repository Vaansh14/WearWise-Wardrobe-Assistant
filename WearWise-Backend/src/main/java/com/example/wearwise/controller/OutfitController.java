package com.example.wearwise.controller;

import com.example.wearwise.model.Outfit;
import com.example.wearwise.service.OutfitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/outfits")
@CrossOrigin(origins = "http://localhost:5173")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @PostMapping
    public Outfit saveOutfit(@RequestBody Outfit outfit) {
        return outfitService.saveOutfit(outfit);
    }

    @GetMapping
    public List<Outfit> getAllOutfits() {
        return outfitService.getAllOutfits();
    }

    @DeleteMapping("/{id}")
    public void deleteOutfit(@PathVariable Long id) {
        outfitService.deleteOutfit(id);
    }
}