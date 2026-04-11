package com.example.wearwise.service;


import com.example.wearwise.model.Clothing;
import com.example.wearwise.repository.ClothingRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
public class ClothingService {

    private final ClothingRepository clothingRepository;

    public ClothingService(ClothingRepository clothingRepository) {
        this.clothingRepository = clothingRepository;
    }

    //  Save directly (NO AI)
    public Clothing saveClothingDirect(Clothing clothing) {
        return clothingRepository.save(clothing);
    }

    public List<Clothing> getAllClothes(Long userId) {
        return clothingRepository.findByUserId(userId);
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

    //  AI ONLY (no saving)
    public Map<String, Object> analyzeImage(byte[] fileBytes) {

        RestTemplate restTemplate = new RestTemplate();

        String url = "http://localhost:8000/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        body.add("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return "image.jpg";
            }
        });

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getBody() == null) {
                throw new RuntimeException("AI returned null response");
            }

            return response.getBody();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error calling AI service");
        }
    }

    public Map<String, Object> generateOutfit(List<Clothing> clothes) {

        RestTemplate restTemplate = new RestTemplate();

        String url = "http://localhost:8000/outfit";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("items", clothes);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        return response.getBody();
    }
}