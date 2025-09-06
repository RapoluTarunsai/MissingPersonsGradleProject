package com.example.missingpersons.model;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.Date;

@Setter
@Getter
@Entity
@Table(name = "USERS")
public class User {
    // Getters and setters
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "USER_SEQ")
    @SequenceGenerator(name = "USER_SEQ", sequenceName = "USER_SEQ", allocationSize = 1)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String password;

    @Column
    private String verificationCode;
    @Column(name = "is_logged_in")
    private Boolean isLoggedIn = false;

    @Column(name = "LAST_LOGIN_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLoginTimestamp;

    @Lob
    @Column(name = "profile_picture", columnDefinition = "BLOB")
    private byte[] profilePicture;
}

