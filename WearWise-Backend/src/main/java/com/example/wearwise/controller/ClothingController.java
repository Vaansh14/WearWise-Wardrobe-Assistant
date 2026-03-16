package com.example.wearwise.controller;

import com.example.wearwise.model.Clothing;
import com.example.wearwise.service.ClothingService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothing")
@CrossOrigin
public class ClothingController {

    private final ClothingService clothingService;

    public ClothingController(ClothingService clothingService) {
        this.clothingService = clothingService;
    }

    @PostMapping
    public Clothing addClothing(@RequestBody Clothing clothing) {
        return clothingService.saveClothing(clothing);
    }

    @GetMapping
    public List<Clothing> getAllClothing() {
        return clothingService.getAllClothes();
    }

    @DeleteMapping("/{id}")
    public void deleteClothing(@PathVariable Long id) {
        clothingService.deleteClothing(id);
    }

    @PutMapping("/{id}")
    public Clothing updateClothing(@PathVariable Long id, @RequestBody Clothing clothing) {
        return clothingService.updateClothing(id, clothing);
    }
}