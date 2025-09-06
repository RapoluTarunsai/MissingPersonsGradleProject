package com.example.missingpersons.model;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "MATCHED_PERSONS")
public class MatchedPerson {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MATCHED_PERSON_SEQ")
    @SequenceGenerator(name = "MATCHED_PERSON_SEQ", sequenceName = "MATCHED_PERSON_SEQ", allocationSize = 1)
    private Long id;

    @OneToOne
    @JoinColumn(name = "missing_person_id", nullable = false)
    private MissingPerson missingPerson;

    @ManyToOne
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @ManyToOne
    @JoinColumn(name = "found_by_id", nullable = false)
    private User foundBy;

    @Column(nullable = false)
    private LocalDateTime matchedAt;

    @Column(nullable = false)
    private boolean approved = false;

    @Lob
    @Column(name = "MATCHED_IMAGE_DATA")
    private byte[] matchedImageData;



    public void setSuccessMessage(String successMessage) {
        this.successMessage = successMessage;
    }

    @Column(length = 1000,name="message")
    private String successMessage;

    // Getters and setters

    public void setId(Long id) {
        this.id = id;
    }

    public void setMissingPerson(MissingPerson missingPerson) {
        this.missingPerson = missingPerson;
    }

    public void setReportedBy(User reportedBy) {
        this.reportedBy = reportedBy;
    }

    public void setFoundBy(User foundBy) {
        this.foundBy = foundBy;
    }

    public void setMatchedAt(LocalDateTime matchedAt) {
        this.matchedAt = matchedAt;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public void setMatchedImageData(byte[] matchedImageData) {
        this.matchedImageData = matchedImageData;
    }
}
