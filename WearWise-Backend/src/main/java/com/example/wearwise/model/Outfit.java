package com.example.wearwise.model;


import jakarta.persistence.*;

@Entity
public class Outfit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long topId;
    private Long bottomId;
    private Long footwearId;

    private Long outerwearId;   // optional
    private Long accessoryId;   // optional

    private String name;

    private Long userId;

    public Outfit() {}

    //  GETTERS
    public Long getId() { return id; }

    public Long getTopId() { return topId; }
    public Long getBottomId() { return bottomId; }
    public Long getFootwearId() { return footwearId; }
    public Long getOuterwearId() { return outerwearId; }
    public Long getAccessoryId() { return accessoryId; }

    public String getName() { return name; }
    public Long getUserId() { return userId; }

    // SETTERS
    public void setId(Long id) { this.id = id; }

    public void setTopId(Long topId) { this.topId = topId; }
    public void setBottomId(Long bottomId) { this.bottomId = bottomId; }
    public void setFootwearId(Long footwearId) { this.footwearId = footwearId; }
    public void setOuterwearId(Long outerwearId) { this.outerwearId = outerwearId; }
    public void setAccessoryId(Long accessoryId) { this.accessoryId = accessoryId; }

    public void setName(String name) { this.name = name; }
    public void setUserId(Long userId) { this.userId = userId; }
}