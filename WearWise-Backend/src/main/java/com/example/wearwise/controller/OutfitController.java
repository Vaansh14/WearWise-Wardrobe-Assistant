package com.example.wearwise.controller;


import com.example.wearwise.model.Outfit;
import com.example.wearwise.service.OutfitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outfits")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    private Long getUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }

    //  CRUD
    @PostMapping
    public Outfit saveOutfit(HttpServletRequest request, @RequestBody Outfit outfit) {
        outfit.setUserId(getUserId(request));
        return outfitService.saveOutfit(outfit);
    }

    @GetMapping
    public List<Outfit> getAllOutfits(HttpServletRequest request) {
        return outfitService.getAllOutfits(getUserId(request));
    }

    @DeleteMapping("/{id}")
    public void deleteOutfit(@PathVariable Long id) {
        outfitService.deleteOutfit(id);
    }

    //  AI GENERATION (no prompt)
    @PostMapping("/generate")
    public Map<String, Object> generateOutfit(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        double temperature = Double.parseDouble(body.get("temperature").toString());
        String occasion = body.get("occasion").toString();
        List<String> events = body.containsKey("events")
                ? (List<String>) body.get("events")
                : List.of();
        return outfitService.generateOutfitAI(getUserId(request), temperature, occasion, events);
    }

    //  AI GENERATION (with prompt)
    @PostMapping("/generate/prompt")
    public Map<String, Object> generateOutfitWithPrompt(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        String prompt = body.get("prompt").toString();
        return outfitService.generateOutfitWithPromptAI(getUserId(request), prompt);
    }
}