package com.example.missingpersons.repository;

import com.example.missingpersons.model.MatchedPerson;
import com.example.missingpersons.model.MissingPerson;
import com.example.missingpersons.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchedPersonRepository extends JpaRepository<MatchedPerson, Long> {
    List<MatchedPerson> findAllByApprovedTrueOrderByMatchedAtDesc();
    List<MatchedPerson> findByReportedByAndApprovedFalseOrderByMatchedAtDesc(User reportedBy);
    List<MatchedPerson>  findByMissingPersonAndApprovedFalse(MissingPerson missingPerson);
    List<MatchedPerson> findByReportedByAndApprovedTrueOrderByMatchedAtDesc(User reportedBy);
    long countByReportedBy(User user);
    long countByFoundBy(User user);
}

