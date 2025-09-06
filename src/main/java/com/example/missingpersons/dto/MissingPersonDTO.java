package com.example.missingpersons.dto;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Base64;
import com.example.missingpersons.model.MissingPerson;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Data
@Setter
public class MissingPersonDTO {
    private Long id;
    private String name;
    private String imageData;
    private String reportedByName;
    private String reportedByEmail;
    private LocalDateTime lastSeen;
    private String description;
    private Integer age;
    private String location;
    private String city;
    private String state;
    private String country;
    private LocalDateTime reportedTime;
    private byte[] videoData;

    public byte[] getVideoData() {
        return videoData;
    }

    public void setVideoData(byte[] videoData) {
        this.videoData = videoData;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageData() {
        return imageData;
    }

    public void setImageData(String imageData) {
        this.imageData = imageData;
    }

    public String getReportedByName() {
        return reportedByName;
    }

    public void setReportedByName(String reportedByName) {
        this.reportedByName = reportedByName;
    }

    public String getReportedByEmail() {
        return reportedByEmail;
    }

    public void setReportedByEmail(String reportedByEmail) {
        this.reportedByEmail = reportedByEmail;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }


    public LocalDateTime getReportedTime() {
        return reportedTime;
    }

    public void setReportedTime(LocalDateTime reportedTime) {
        this.reportedTime = reportedTime;
    }

    public MissingPersonDTO(MissingPerson person) {
        this.id = person.getId();
        this.name = person.getName();
        this.imageData = Base64.getEncoder().encodeToString(person.getImageData());
        this.reportedByName = person.getReportedBy().getName();
        this.reportedByEmail = person.getReportedBy().getEmail();
        this.lastSeen = person.getLastSeen();
        this.description = person.getDescription();
        this.age = person.getAge();
        this.location = person.getLocation();
        this.city = person.getCity();
        this.state = person.getState();
        this.country = person.getCountry();
        this.reportedTime = person.getReportedTime();
        this.videoData = person.getVideoData();

    }


}



