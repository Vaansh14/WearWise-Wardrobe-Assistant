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

    public List<Outfit> getAllOutfits() {
        return outfitRepository.findAll();
    }

    public void deleteOutfit(Long id) {
        outfitRepository.deleteById(id);
    }

    // ================= AI OUTFIT =================
    public Map<String, Object> generateOutfitAI(double temperature, String occasion) {

        try {
            List<Clothing> clothes = clothingRepository.findAll();

            System.out.println("🔥 SERVICE HIT");
            System.out.println("TEMP: " + temperature);
            System.out.println("CLOTHES SIZE: " + clothes.size());

            // 🔥 Call FastAPI instead of building prompt
            String response = callFastAPI(clothes, temperature, occasion);

            System.out.println("⬅️ FASTAPI RESPONSE: " + response);

            return parseJson(response);

        } catch (Exception e) {
            e.printStackTrace();

            Map<String, Object> fallback = new HashMap<>();
            fallback.put("top", 0);
            fallback.put("bottom", 1);
            fallback.put("footwear", 2);
            fallback.put("outerwear", null);
            fallback.put("accessory", null);
            fallback.put("reason", "Fallback outfit");

            return fallback;
        }
    }

    // ================= AI CALL =================
    private String callFastAPI(List<Clothing> clothes, double temperature, String occasion) {

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "http://localhost:8000/outfit"; // 🔥 YOUR FASTAPI ENDPOINT

            Map<String, Object> request = new HashMap<>();
            request.put("items", clothes);         // 🔥 MUST MATCH FASTAPI
            request.put("temperature", temperature);
            request.put("occasion", occasion);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(request, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    entity,
                    String.class
            );

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
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