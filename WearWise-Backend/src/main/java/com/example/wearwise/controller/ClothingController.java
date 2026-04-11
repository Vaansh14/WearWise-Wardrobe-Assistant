package com.example.wearwise.controller;



import com.example.wearwise.model.Clothing;
import com.example.wearwise.service.ClothingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clothing")
public class ClothingController {

    private final ClothingService clothingService;

    public ClothingController(ClothingService clothingService) {
        this.clothingService = clothingService;
    }

    private Long getUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }

    //  SAVE (NO AI HERE)
    @PostMapping("/upload")
    public Clothing uploadClothing(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageUrl") String imageUrl,
            @RequestParam("category") String category,
            @RequestParam("type") String type,
            @RequestParam("color") String color,
            @RequestParam("season") String season
    ) throws IOException {

        Clothing clothing = new Clothing();
        clothing.setImageUrl(imageUrl);
        clothing.setCategory(category);
        clothing.setColor(color);
        clothing.setType(type);
        clothing.setSeason(season);
        clothing.setUserId(getUserId(request));

        return clothingService.saveClothingDirect(clothing);
    }

    //  AI ONLY (NO SAVE)
    @PostMapping("/analyze")
    public Map<String, Object> analyzeOnly(@RequestParam("file") MultipartFile file) throws IOException {
        return clothingService.analyzeImage(file.getBytes());
    }

    @GetMapping
    public List<Clothing> getAllClothing(HttpServletRequest request) {
        return clothingService.getAllClothes(getUserId(request));
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
    public Map<String, Object> generateOutfit(HttpServletRequest request) {
        List<Clothing> clothes = clothingService.getAllClothes(getUserId(request));
        return clothingService.generateOutfit(clothes);
    }
}