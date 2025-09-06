package com.example.missingpersons.repository;

import com.example.missingpersons.enumns.PersonStatus;
import com.example.missingpersons.model.MissingPerson;
import com.example.missingpersons.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MissingPersonRepository extends JpaRepository<MissingPerson, Long> {
    Page<MissingPerson> findByStatus(PersonStatus status, Pageable pageable);
    List<MissingPerson> findByReportedByAndStatus(User reportedBy, PersonStatus status);
    @Query("SELECT mp FROM MissingPerson mp WHERE mp.state = :state AND mp.status = 'MISSING'")
    List<MissingPerson> findByState(@Param("state") String state);

    List<MissingPerson> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseAndStatus(String name, String description,PersonStatus status);


    @Query("SELECT DISTINCT mp.country FROM MissingPerson mp WHERE mp.status = 'MISSING'")
    List<String> findDistinctCountries();

    @Query("SELECT DISTINCT mp.state FROM MissingPerson mp WHERE mp.country = :country AND mp.status = 'MISSING'")
    List<String> findDistinctStatesByCountry(@Param("country") String country);

    @Query("SELECT DISTINCT mp.city FROM MissingPerson mp WHERE mp.country = :country AND mp.state = :state AND mp.status = 'MISSING'")
    List<String> findDistinctCitiesByCountryAndState(@Param("country") String country, @Param("state") String state);

    @Query("SELECT mp FROM MissingPerson mp WHERE " +
            "(:country IS NULL OR mp.country = :country) AND " +
            "(:state IS NULL OR mp.state = :state) AND " +
            "(:city IS NULL OR mp.city = :city) AND " +
            "mp.status = 'MISSING' " +
            "ORDER BY " +
            "CASE WHEN :sortBy = 'recentlyMissed' THEN mp.lastSeen END DESC, " +
            "CASE WHEN :sortBy = 'recentlyReported' THEN mp.reportedTime END DESC, " +
            "CASE WHEN :sortBy = 'oldest' THEN mp.lastSeen END ASC")
    Page<MissingPerson> findByLocationFiltersAndSort(
            @Param("country") String country,
            @Param("state") String state,
            @Param("city") String city,
            @Param("sortBy") String sortBy,
            Pageable pageable
    );
    @Query("SELECT mp FROM MissingPerson mp WHERE LOWER(mp.name) LIKE LOWER(concat('%', :name, '%')) AND mp.status = 'MISSING'")
    List<MissingPerson> findByNameContainingIgnoreCase(@Param("name") String name);




}

