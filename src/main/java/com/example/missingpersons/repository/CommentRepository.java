package com.example.missingpersons.repository;

import com.example.missingpersons.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("SELECT gd FROM Comment gd WHERE gd.missingPerson.id = :missingPersonId ORDER BY gd.createdAt DESC")
    List<Comment> findByMissingPersonIdOrderByCreatedAtDesc(Long missingPersonId);

    Long countByMissingPersonId(Long missingPersonId);

}

