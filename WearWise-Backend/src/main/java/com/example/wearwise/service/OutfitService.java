package com.example.wearwise.service;


import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import com.example.wearwise.model.Clothing;
import com.example.wearwise.model.Outfit;
import com.example.wearwise.repository.ClothingRepository;
import com.example.wearwise.repository.OutfitRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OutfitService {

    private final OutfitRepository outfitRepository;
    private final ClothingRepository clothingRepository;
    private final ObjectMapper objectMapper;

    public OutfitService(OutfitRepository outfitRepository,
                         ClothingRepository clothingRepository) {
        this.outfitRepository = outfitRepository;
        this.clothingRepository = clothingRepository;
        this.objectMapper = new ObjectMapper();
    }

    // ================= CRUD =================
    public Outfit saveOutfit(Outfit outfit) {
        return outfitRepository.save(outfit);
    }

    public List<Outfit> getAllOutfits(Long userId) {
        return outfitRepository.findByUserId(userId);
    }

    public void deleteOutfit(Long id) {
        outfitRepository.deleteById(id);
    }

    // ================= AI OUTFIT (no prompt) =================
    public Map<String, Object> generateOutfitAI(Long userId, double temperature, String occasion, List<String> events) {
        try {
            List<Clothing> clothes = clothingRepository.findByUserId(userId);

            System.out.println(" SERVICE HIT");
            System.out.println("USER: " + userId);
            System.out.println("TEMP: " + temperature);
            System.out.println("EVENTS: " + events);
            System.out.println("CLOTHES SIZE: " + clothes.size());

            String response = callFastAPI(clothes, temperature, occasion, events);

            System.out.println("️ FASTAPI RESPONSE: " + response);

            return parseJson(response);

        } catch (Exception e) {
            e.printStackTrace();
            return fallbackOutfit();
        }
    }

    // ================= AI OUTFIT (with prompt) =================
    public Map<String, Object> generateOutfitWithPromptAI(Long userId, String prompt) {
        try {
            List<Clothing> clothes = clothingRepository.findByUserId(userId);

            System.out.println("🔥 PROMPT SERVICE HIT");
            System.out.println("USER: " + userId);
            System.out.println("PROMPT: " + prompt);
            System.out.println("CLOTHES SIZE: " + clothes.size());

            String response = callFastAPIWithPrompt(clothes, prompt);

            System.out.println("⬅️ FASTAPI PROMPT RESPONSE: " + response);

            return parseJson(response);

        } catch (Exception e) {
            e.printStackTrace();
            return fallbackOutfit();
        }
    }

    // ================= FASTAPI CALL (no prompt) =================
    private String callFastAPI(List<Clothing> clothes, double temperature, String occasion, List<String> events) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "http://localhost:8000/outfit";

            Map<String, Object> request = new HashMap<>();
            request.put("items", clothes);
            request.put("temperature", temperature);
            request.put("occasion", occasion);
            request.put("events", events);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    // ================= FASTAPI CALL (with prompt) =================
    private String callFastAPIWithPrompt(List<Clothing> clothes, String prompt) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "http://localhost:8000/outfit/prompt";

            Map<String, Object> request = new HashMap<>();
            request.put("items", clothes);
            request.put("prompt", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    // ================= FALLBACK =================
    private Map<String, Object> fallbackOutfit() {
        Map<String, Object> fallback = new HashMap<>();
        fallback.put("top", 0);
        fallback.put("bottom", 1);
        fallback.put("footwear", 2);
        fallback.put("outerwear", null);
        fallback.put("accessory", null);
        fallback.put("reason", "Fallback outfit");
        return fallback;
    }

    // ================= JSON PARSER =================
    private Map<String, Object> parseJson(String text) throws Exception {
        try {
            return objectMapper.readValue(text, Map.class);
        } catch (Exception e) {
            int start = text.indexOf("{");
            int end = text.lastIndexOf("}") + 1;
            String clean = text.substring(start, end);
            return objectMapper.readValue(clean, Map.class);
        }
    }
}