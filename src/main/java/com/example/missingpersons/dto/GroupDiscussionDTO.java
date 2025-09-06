
package com.example.missingpersons.dto;

import com.example.missingpersons.model.Comment;
import java.time.LocalDateTime;

public class GroupDiscussionDTO {
    private Long id;
    private Long missingPersonId;
    private String userName;
    private String message;
    private LocalDateTime timestamp;
    private Long userId;
    public GroupDiscussionDTO(Comment groupDiscussion) {
        this.id = groupDiscussion.getId();
        this.missingPersonId = groupDiscussion.getMissingPerson().getId();
        this.userName = groupDiscussion.getUser().getName();
        this.userId = groupDiscussion.getUser().getId();  // Add this mapping
        this.message = groupDiscussion.getContent();
        this.timestamp = groupDiscussion.getCreatedAt();
    }

    // Getters and setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMissingPersonId() {
        return missingPersonId;
    }

    public void setMissingPersonId(Long missingPersonId) {
        this.missingPersonId = missingPersonId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

