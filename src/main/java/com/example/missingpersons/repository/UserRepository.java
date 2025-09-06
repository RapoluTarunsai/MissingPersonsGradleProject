package com.example.missingpersons.repository;

import com.example.missingpersons.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    User findByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.profilePicture = ?2 WHERE u.email = ?1")
    int updateProfilePicture(String email, byte[] profilePicture);
}

