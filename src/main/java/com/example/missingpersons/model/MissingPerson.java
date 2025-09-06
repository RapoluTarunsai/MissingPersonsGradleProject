package com.example.missingpersons.model;

import com.example.missingpersons.enumns.PersonStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@Entity
@Table(name = "MISSING_PERSONS")
public class MissingPerson {
    // Getters and setters
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MISSING_PERSON_SEQ")
    @SequenceGenerator(name = "MISSING_PERSON_SEQ", sequenceName = "MISSING_PERSON_SEQ", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Lob
    @Column(nullable = false)
    private byte[] imageData;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User reportedBy;

    @Column(name="last_seen", nullable = false)
    private LocalDateTime lastSeen;

    @Column(name="description",nullable = false)
    private String description;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private PersonStatus status = PersonStatus.MISSING;

    @JsonBackReference
    @OneToMany(mappedBy = "missingPerson", cascade = CascadeType.ALL)
    private List<Comment> comments;


    @Lob
    @Column(name = "video_data", columnDefinition = "BLOB")
    private byte[] videoData;

    @Column(name="age",nullable = false)
    private Integer age;
    @Column(name="location",nullable = false)
    private String location;
    @Column(name="city",nullable = false)
    private String city;
    @Column(name="state",nullable = false)
    private String state;
    @Column(name="country",nullable = false)
    private String country;
    @Column(name="reported_Time", nullable = false)
    private LocalDateTime reportedTime;


}

