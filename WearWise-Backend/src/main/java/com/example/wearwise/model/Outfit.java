package com.example.wearwise.model;

import jakarta.persistence.*;

@Entity
public class Outfit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long shirtId;
    private Long pantsId;
    private Long shoesId;

    public Outfit() {}

    public Long getId() {
        return id;
    }

    public Long getShirtId() {
        return shirtId;
    }

    public Long getPantsId() {
        return pantsId;
    }

    public Long getShoesId() {
        return shoesId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setShirtId(Long shirtId) {
        this.shirtId = shirtId;
    }

    public void setPantsId(Long pantsId) {
        this.pantsId = pantsId;
    }

    public void setShoesId(Long shoesId) {
        this.shoesId = shoesId;
    }
}