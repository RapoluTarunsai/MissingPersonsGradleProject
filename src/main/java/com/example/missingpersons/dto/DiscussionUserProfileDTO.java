package com.example.missingpersons.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class DiscussionUserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private String location;

    private byte[] profilePicture;
    private long reportedPersonsCount;
    private long foundPersonsCount;

}
