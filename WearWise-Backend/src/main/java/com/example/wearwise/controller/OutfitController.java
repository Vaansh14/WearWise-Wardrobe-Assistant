package com.example.wearwise.controller;

import com.example.wearwise.model.Outfit;
import com.example.wearwise.service.OutfitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outfits")
@CrossOrigin(origins = "http://localhost:5173")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    // ================= CRUD =================
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

    // ================= AI GENERATION (no prompt) =================
    @PostMapping("/generate")
    public Map<String, Object> generateOutfit(@RequestBody Map<String, Object> request) {
        double temperature = Double.parseDouble(request.get("temperature").toString());
        String occasion = request.get("occasion").toString();
        return outfitService.generateOutfitAI(temperature, occasion);
    }

    // ================= AI GENERATION (with prompt) =================
    @PostMapping("/generate/prompt")
    public Map<String, Object> generateOutfitWithPrompt(@RequestBody Map<String, Object> request) {
        String prompt = request.get("prompt").toString();
        return outfitService.generateOutfitWithPromptAI(prompt);
    }
}