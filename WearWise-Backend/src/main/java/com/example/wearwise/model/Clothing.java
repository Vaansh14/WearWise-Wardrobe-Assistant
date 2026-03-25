package com.example.wearwise.model;

import jakarta.persistence.*;
//import org.springframework.data.annotation.Id;

@Entity
public class Clothing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    private String category;  // Top, Bottom, Footwear, Outerwear, Accessory
    private String type;      // T-shirt, Hoodie, Jeans, Skirt, Heels
    private String gender;    // Male, Female, Unisex
    private String occasion;  // Casual, Formal, Gym, Party

    private String color;

    private String season;

    public Clothing() {}

    public Long getId() {
        return id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getCategory() {
        return category;
    }

    public String getColor() {
        return color;
    }

    public String getSeason() {
        return season;
    }

    public String getType() {
        return type;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public void setType(String type) {
        this.type = type;
    }
}