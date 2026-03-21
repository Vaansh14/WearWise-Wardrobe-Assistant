package com.example.wearwise.controller;

import com.example.wearwise.model.Clothing;
import com.example.wearwise.service.ClothingService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clothing")
@CrossOrigin(origins = "http://localhost:5173")
public class ClothingController {

    private final ClothingService clothingService;

    public ClothingController(ClothingService clothingService) {
        this.clothingService = clothingService;
    }

    //  SAVE (NO AI HERE)
    @PostMapping("/upload")
    public Clothing uploadClothing(
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageUrl") String imageUrl,
            @RequestParam("category") String category,
            @RequestParam("color") String color,
            @RequestParam("season") String season
    ) throws IOException {

        Clothing clothing = new Clothing();
        clothing.setImageUrl(imageUrl);
        clothing.setCategory(category);
        clothing.setColor(color);
        clothing.setSeason(season);

        return clothingService.saveClothingDirect(clothing);
    }

    //  AI ONLY (NO SAVE)
    @PostMapping("/analyze")
    public Map<String, String> analyzeOnly(@RequestParam("file") MultipartFile file) throws IOException {
        return clothingService.analyzeImage(file.getBytes());
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

    @PostMapping("/outfit")
    public Map<String, Object> generateOutfit() {
        List<Clothing> clothes = clothingService.getAllClothes();
        return clothingService.generateOutfit(clothes);
    }
}