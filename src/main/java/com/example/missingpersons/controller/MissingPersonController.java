package com.example.missingpersons.controller;

import com.example.missingpersons.dto.DiscussionUserProfileDTO;
import com.example.missingpersons.dto.GroupDiscussionDTO;
import com.example.missingpersons.dto.MissingPersonDTO;
import com.example.missingpersons.enumns.PersonStatus;
import com.example.missingpersons.model.*;
import com.example.missingpersons.repository.CommentRepository;
import com.example.missingpersons.repository.MatchedPersonRepository;
import com.example.missingpersons.repository.MissingPersonRepository;
import com.example.missingpersons.repository.UserRepository;
import com.example.missingpersons.service.EmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.itextpdf.text.pdf.draw.LineSeparator;
import io.swagger.annotations.*;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;


import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import javax.servlet.http.HttpSession;
import java.io.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
@Api(tags = "Missing Persons Management API")
@RestController
@RequestMapping("/api/missing-persons")
public class MissingPersonController {

    @Autowired
    private MissingPersonRepository missingPersonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;


    @Autowired
    private MatchedPersonRepository matchedPersonRepository;


    @Autowired
    private EmailService emailService;
    @Autowired
    private HttpSession httpSession;
    private static final Logger logger = LoggerFactory.getLogger(MissingPersonController.class);
    @Value("${recaptcha.secret.key}")
    private String secretKey;

    @Value("${spring.mail.username}")
    private String supportEmail;

    @ApiOperation(value = "Get All Missing Persons", notes = "Retrieves a paginated list of all missing persons")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMissingPersons(
            @ApiParam(value = "Pagination information") Pageable pageable) {
        Page<MissingPerson> missingPersons = missingPersonRepository.findByStatus(PersonStatus.MISSING, pageable);
        Page<MissingPersonDTO> missingPersonDTOs = missingPersons.map(MissingPersonDTO::new);

        Map<String, Object> response = new HashMap<>();
        response.put("content", missingPersonDTOs.getContent());
        response.put("totalElements", missingPersonDTOs.getTotalElements());

        return ResponseEntity.ok(response);
    }


    @ApiOperation(value = "Get Nearby Missing Persons",
            notes = "Retrieves missing persons from the same state as the logged-in user")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved nearby missing persons"),
            @ApiResponse(code = 401, message = "User is not authenticated"),
            @ApiResponse(code = 404, message = "User location not found")
    })
    @GetMapping("/nearby")
    public ResponseEntity<List<MissingPersonDTO>> getNearbyMissingPersons(
            @ApiParam(hidden = true) HttpSession session) {
        String email = (String) session.getAttribute("email");
        User currentUser = userRepository.findByEmail(email);
        String userLocation = currentUser.getLocation();

        List<MissingPerson> nearbyPersons = missingPersonRepository.findByState(userLocation);
        List<MissingPersonDTO> nearbyPersonDTOs = nearbyPersons.stream()
                .map(MissingPersonDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(nearbyPersonDTOs);
    }

    @ApiOperation(value = "Add Missing Person", notes = "Creates a new missing person report")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Missing person report created successfully"),
            @ApiResponse(code = 400, message = "Invalid input data"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @PostMapping("/add")
    public ResponseEntity<?> addMissingPerson(
            @ApiParam(value = "Person's name", required = true) @RequestParam("name") String name,
            @ApiParam(value = "Person's image", required = true) @RequestParam("image") MultipartFile image,
            @ApiParam(value = "Last seen date-time") @RequestParam(value = "lastSeen", required = false) String lastSeen,
            @ApiParam(value = "Person's age") @RequestParam(value = "age") Integer age,
            @ApiParam(value = "Location") @RequestParam(value = "location") String location,
            @ApiParam(value = "Country") @RequestParam(value = "country") String country,
            @ApiParam(value = "State") @RequestParam(value = "state") String state,
            @ApiParam(value = "City") @RequestParam(value = "city") String city,
            @ApiParam(value = "Description") @RequestParam(value = "description") String description)throws IOException {
        byte[] imageData = image.getBytes();
        try {
            File tempFile = File.createTempFile("upload-", ".jpg");
            FileUtils.writeByteArrayToFile(tempFile, imageData);

            try {
                containsHumanFace(tempFile);
            } catch (RuntimeException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        String email = (String) httpSession.getAttribute("email");
        User user = userRepository.findByEmail(email);
        LocalDateTime lastSeenLocalDateTime = LocalDateTime.parse(lastSeen);

        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        MissingPerson missingPerson = new MissingPerson();
        missingPerson.setName(name);
        missingPerson.setImageData(imageData);
        missingPerson.setReportedBy(user);
        missingPerson.setLastSeen(lastSeenLocalDateTime);
        missingPerson.setAge(age);
        missingPerson.setLocation(location);
        missingPerson.setCountry(country);
        missingPerson.setState(state);
        missingPerson.setCity(city);
        missingPerson.setDescription(description);
        missingPerson.setReportedTime(LocalDateTime.now());
        MissingPerson savedPerson = missingPersonRepository.save(missingPerson);
        System.out.println("savedPerson: " + savedPerson);
        emailService.sendNewMissingPersonNotification(savedPerson, user);
            return ResponseEntity.ok(new MissingPersonDTO(savedPerson));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating missing person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while creating the missing person report.");
        }
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<MissingPersonDTO>> quickSearch(@RequestParam String name) {
        List<MissingPerson> similarProfiles = missingPersonRepository
                .findByNameContainingIgnoreCase(name).stream()
                .filter(person -> person.getStatus() == PersonStatus.MISSING)
                .collect(Collectors.toList());

        return ResponseEntity.ok(similarProfiles.stream()
                .map(MissingPersonDTO::new)
                .collect(Collectors.toList()));
    }

    @GetMapping("/geocode")
    public ResponseEntity<String> getGeocode(
            @RequestParam String city,
            @RequestParam String state,
            @RequestParam String country
    ) {
        String url = String.format(
                "https://nominatim.openstreetmap.org/search?city=%s&state=%s&country=%s&format=json",
                city, state, country
        );

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "MissingPersonsRegistry/1.0");
        headers.set("Accept", "application/json");
        headers.set("Accept-Language", "en");

        ResponseEntity<String> response1 = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
        );
        System.out.println(response1.getStatusCode());
        System.out.println(response1.getBody());

        return response1;
    }

    private boolean containsHumanFace(File imageFile) throws IOException {
        try {
            String pythonPath = Optional.ofNullable(System.getenv("PYTHON_PATH"))
                    .orElse("python");

            String scriptPath = new ClassPathResource("scripts/face_detection.py").getFile().getAbsolutePath();

            ProcessBuilder processBuilder = new ProcessBuilder(
                    pythonPath,
                    scriptPath,
                    imageFile.getAbsolutePath()
            );
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();
            boolean completed = process.waitFor(60, TimeUnit.SECONDS);

            if (!completed) {
                process.destroyForcibly();
                throw new RuntimeException("Face detection script timed out");
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = reader.readLine();
            logger.info("Python script output is : {}", output);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode result = mapper.readTree(output);

            if (result.has("error")) {
                logger.error("Error in face detection: {}", result.get("error").asText());
                return false;
            }

            int facesDetected = result.get("faces_detected").asInt();

            if (facesDetected == 0) {
                throw new RuntimeException("No human face detected in the image. Please upload an image with a clear face.");
            }

            if (facesDetected > 1) {
                throw new RuntimeException("Multiple faces detected in the image. Please upload an image with only one person.");
            }

            return facesDetected == 1;
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } finally {
            imageFile.delete();
        }
    }
    @ApiOperation(value = "Get Missing Person Details", notes = "Retrieves details of a specific missing person")
    @GetMapping("/{id}")
    public ResponseEntity<?> getMissingPerson(
            @ApiParam(value = "Missing person ID", required = true)@PathVariable Long id) {
        return missingPersonRepository.findById(id)
                .map(person -> ResponseEntity.ok(new MissingPersonDTO(person)))
                .orElse(ResponseEntity.notFound().build());
    }


    @ApiOperation(value = "Delete Missing Person", notes = "Deletes a specific missing person report")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMissingPerson(
            @ApiParam(value = "Missing person ID", required = true)@PathVariable Long id) {
        try {
            if (!missingPersonRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            missingPersonRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting missing person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @ApiOperation(value = "Get Discussions", notes = "Retrieves all discussions for a specific missing person case")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved discussions"),
            @ApiResponse(code = 404, message = "Missing person not found")
    })
    @GetMapping("/{id}/discussions")
    public ResponseEntity<List<GroupDiscussionDTO>> getDiscussions(
            @ApiParam(value = "Missing person ID", required = true) @PathVariable Long id) {
        List<Comment> discussions = commentRepository.findByMissingPersonIdOrderByCreatedAtDesc(id);
        List<GroupDiscussionDTO> discussionDTOs = discussions.stream()
                .map(GroupDiscussionDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(discussionDTOs);
    }

    @ApiOperation(value = "Add Discussion", notes = "Adds a new discussion comment to a missing person case")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully added discussion"),
            @ApiResponse(code = 404, message = "Missing person not found"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @PostMapping("/{id}/discussions")
    public ResponseEntity<GroupDiscussionDTO> addDiscussion(
            @ApiParam(value = "Missing person ID", required = true) @PathVariable Long id,
            @ApiParam(value = "Discussion message", required = true) @RequestParam("message") String message) {
        try {
            MissingPerson missingPerson = missingPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Missing person not found with id: " + id));
            String email = (String) httpSession.getAttribute("email");
            User user = userRepository.findByEmail(email);
            Comment discussion = new Comment();
            discussion.setContent(message);
            discussion.setUser(user);
            discussion.setMissingPerson(missingPerson);
            discussion.setCreatedAt(LocalDateTime.now());

            Comment savedDiscussion = commentRepository.save(discussion);
            return ResponseEntity.ok(new GroupDiscussionDTO(savedDiscussion));
        } catch (Exception e) {
            logger.error("Error adding discussion", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }




    @ApiOperation(value = "Compare Images", notes = "Compares uploaded image with existing missing person's image")
    @PostMapping("/compare")
    public ResponseEntity<?> compareImage(
            @ApiParam(value = "Image to compare", required = true) @RequestParam("image") MultipartFile image,
            @ApiParam(value = "Missing person ID", required = true) @RequestParam("id") Long personId,
            @ApiParam(value = "Captcha response", required = true) @RequestParam("captcha") String captchaResponse
    ) throws IOException {

    if (image == null || image.isEmpty()) {
        return ResponseEntity.badRequest().body("No image provided");
    }

    MissingPerson personToCompare = missingPersonRepository.findById(personId)
            .orElseThrow(() -> new RuntimeException("Person not found with id: " + personId));

    String comparingUserEmail = (String) httpSession.getAttribute("email");
    User comparingUser = userRepository.findByEmail(comparingUserEmail);

    if (!verifyCaptcha(captchaResponse)) {
        return ResponseEntity.badRequest().body("CAPTCHA verification failed");
    }

    if (personToCompare.getImageData() == null || personToCompare.getImageData().length == 0) {
        return ResponseEntity.badRequest().body("No image data available for the specified person");
    }

    File tempFile = null;
    File missingPersonImageFile = null;
    try {
        tempFile = File.createTempFile("upload-", ".jpg");
        image.transferTo(tempFile);
        missingPersonImageFile = File.createTempFile("missing-person-", ".jpg");
        FileUtils.writeByteArrayToFile(missingPersonImageFile, personToCompare.getImageData());

        String pythonPath = Optional.ofNullable(System.getenv("PYTHON_PATH"))
                .orElse("python");
        String scriptPath = new ClassPathResource("scripts/face_comapre.py").getFile().getAbsolutePath();

        ProcessBuilder processBuilder = new ProcessBuilder(
                pythonPath,
                scriptPath,
                missingPersonImageFile.getAbsolutePath(),
                tempFile.getAbsolutePath()
        );
        processBuilder.redirectErrorStream(true);
       System.out.println("Executing Python script with command: " + processBuilder.command());
        long startTime = System.currentTimeMillis();
        Process process = processBuilder.start();
        boolean completed = process.waitFor(180, TimeUnit.SECONDS);
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        System.out.println("Face comparison script took " + executionTime + " milliseconds to execute");

        logger.info("Face comparison script took {} milliseconds to execute", executionTime);


        if (!completed) {
            process.destroy();
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body("Script execution timed out");
        }

        String output = new BufferedReader(new InputStreamReader(process.getInputStream()))
                .lines()
                .collect(Collectors.joining("\n"));

        ObjectMapper mapper = new ObjectMapper();
        JsonNode result = mapper.readTree(output);

        if (!result.has("success") || !result.get("success").asBoolean()) {
            String errorMessage = result.has("error") ? result.get("error").asText() : "Unknown error occurred";
            return ResponseEntity.badRequest().body(errorMessage);
        }

        double similarity = result.get("similarity_percentage").asDouble();
        boolean isMatch = result.get("is_match").asBoolean();

        if (isMatch) {
            byte[] matchedFullImage = FileUtils.readFileToByteArray(tempFile);
            byte[] matchedFaceImage = null;
            if (result.has("matched_full_path") && result.get("matched_full_path").asText() != null) {
                String matchedFullPath = result.get("matched_full_path").asText();
                matchedFaceImage = FileUtils.readFileToByteArray(new File(matchedFullPath));
            }

            MatchedPerson matchedPerson = new MatchedPerson();
            matchedPerson.setMissingPerson(personToCompare);
            matchedPerson.setReportedBy(personToCompare.getReportedBy());
            matchedPerson.setFoundBy(comparingUser);
            matchedPerson.setMatchedAt(LocalDateTime.now());
            matchedPerson.setMatchedImageData(matchedFullImage);

            // Handle self-matching scenario
            if (comparingUser.equals(personToCompare.getReportedBy())) {
                matchedPerson.setApproved(true);
                personToCompare.setStatus(PersonStatus.FOUND);
                missingPersonRepository.save(personToCompare);
                matchedPersonRepository.save(matchedPerson);

                Map<String, Object> response = new HashMap<>();
                response.put("similarity", similarity);
                response.put("isMatch", isMatch);
                response.put("message", "You have successfully found your reported person. The case is now marked as resolved.");
                return ResponseEntity.ok(response);
            }

            // Regular match scenario
            matchedPersonRepository.save(matchedPerson);
            emailService.sendMatchNotificationEmail(
                    personToCompare,
                    comparingUser,
                    similarity,
                    matchedFullImage,
                    matchedFaceImage
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("similarity", similarity);
        response.put("isMatch", isMatch);
        if (isMatch) {
            response.put("message", "Match Found - Email Notification Sent");
        } else {
            response.put("message", "No Match Found");
        }
        System.out.println("response" +response);
        return ResponseEntity.ok(response);

    } catch (Exception e) {
        logger.error("Error during face comparison", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred during processing");
    } finally {
        if (tempFile != null && tempFile.exists()) {
            if (!tempFile.delete()) {
                logger.error("Failed to delete temporary file: {}", tempFile.getAbsolutePath());
            }
        }
        if (missingPersonImageFile != null && missingPersonImageFile.exists()) {
            if (!missingPersonImageFile.delete()) {
                logger.error("Failed to delete missing person file: {}", missingPersonImageFile.getAbsolutePath());
            }
        }
    }
}


    private boolean verifyCaptcha(String captchaResponse) {
        String verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

        WebClient webClient = WebClient.create();

        try {
            Map<String, Object> response = webClient.post()
                    .uri(verifyUrl + "?secret=" + secretKey + "&response=" + captchaResponse)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return response != null && (Boolean) response.get("success");
        } catch (Exception e) {
            logger.error("Error verifying CAPTCHA", e);
            return false;
        }
    }
    @ApiOperation(value = "Search Missing Persons", notes = "Search for missing persons by name or description")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved search results")
    })
    @GetMapping("/search")
    public ResponseEntity<List<MissingPersonDTO>> searchMissingPersons(
            @ApiParam(value = "Search query string", required = true) @RequestParam("query") String query) {
        List<MissingPerson> searchResults = missingPersonRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseAndStatus(query, query,PersonStatus.MISSING);
        List<MissingPersonDTO> searchResultDTOs = searchResults.stream()
                .map(MissingPersonDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(searchResultDTOs);
    }

    @ApiOperation(value = "Get All Countries", notes = "Retrieves list of all countries with missing person cases")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved countries list")
    })
    @GetMapping("/locations/countries")
    public ResponseEntity<List<String>> getCountries() {
        return ResponseEntity.ok(missingPersonRepository.findDistinctCountries());
    }

    @ApiOperation(value = "Get States by Country", notes = "Retrieves list of states for a specific country")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved states list")
    })
    @GetMapping("/locations/states")
    public ResponseEntity<List<String>> getStates(
            @ApiParam(value = "Country name", required = true) @RequestParam String country) {
        return ResponseEntity.ok(missingPersonRepository.findDistinctStatesByCountry(country));
    }

    @ApiOperation(value = "Get Cities by Country and State", notes = "Retrieves list of cities for a specific country and state")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved cities list")
    })
    @GetMapping("/locations/cities")
    public ResponseEntity<List<String>> getCities(
            @ApiParam(value = "Country name", required = true) @RequestParam String country,
            @ApiParam(value = "State name", required = true) @RequestParam String state) {
        return ResponseEntity.ok(missingPersonRepository.findDistinctCitiesByCountryAndState(country, state));
    }
    @ApiOperation(value = "Filter Missing Persons",
            notes = "Retrieves a filtered and paginated list of missing persons based on location and sorting criteria")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved filtered list"),
            @ApiResponse(code = 400, message = "Invalid filter parameters")
    })
    @GetMapping("/filter")
    public ResponseEntity<Page<MissingPersonDTO>> getFilteredMissingPersons(
            @ApiParam(value = "Sort criteria (e.g., 'lastSeen', 'reportedTime')", required = false)
            @RequestParam(required = false) String sortBy,
            @ApiParam(value = "Filter by country name", required = false)
            @RequestParam(required = false) String country,
            @ApiParam(value = "Filter by state name", required = false)
            @RequestParam(required = false) String state,
            @ApiParam(value = "Filter by city name", required = false)
            @RequestParam(required = false) String city,
            @ApiParam(value = "Pagination information")
            Pageable pageable) {

        Page<MissingPerson> filteredPersons = missingPersonRepository.findByLocationFiltersAndSort(
                country, state, city, sortBy, pageable
        );
        return ResponseEntity.ok(filteredPersons.map(MissingPersonDTO::new));
    }

    @ApiOperation(value = "Get Reported Missing Persons",
            notes = "Retrieves all missing persons reported by the current user")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved reported persons list"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @GetMapping("/reported-persons")
    public ResponseEntity<List<MissingPersonDTO>> getReportedMissingPersons() {
        try {
            String email = (String) httpSession.getAttribute("email");
            User currentUser = userRepository.findByEmail(email);

            List<MissingPerson> reportedPersons = missingPersonRepository.findByReportedByAndStatus(currentUser, PersonStatus.MISSING);
            List<MissingPersonDTO> reportedPersonDTOs = reportedPersons.stream()
                    .map(MissingPersonDTO::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(reportedPersonDTOs);
        } catch (Exception e) {
            logger.error("Error fetching reported missing persons", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @ApiOperation(value = "Update Missing Person Report",
            notes = "Updates details of an existing missing person report including name, image, last seen date, and description")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Missing person report updated successfully"),
            @ApiResponse(code = 400, message = "Invalid input data or image validation failed"),
            @ApiResponse(code = 404, message = "Missing person not found"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @PutMapping("/reported-persons/{id}")
    public ResponseEntity<?> updateMissingPerson(
            @ApiParam(value = "ID of missing person to update", required = true) @PathVariable Long id,
            @ApiParam(value = "New name of missing person") @RequestParam(value = "name", required = false) String name,
            @ApiParam(value = "New image of missing person") @RequestParam(value = "image", required = false) MultipartFile image,
            @ApiParam(value = "New last seen date-time (ISO format)") @RequestParam(value = "lastSeen", required = false) String lastSeen,
            @ApiParam(value = "New description") @RequestParam(value = "description", required = false) String description) throws IOException {

        try {
            Optional<MissingPerson> optionalMissingPerson = missingPersonRepository.findById(id);
            if (!optionalMissingPerson.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            MissingPerson missingPerson = optionalMissingPerson.get();
            if (image != null) {
                File tempFile = File.createTempFile("upload-", ".jpg");
                FileUtils.writeByteArrayToFile(tempFile, image.getBytes());

                if (!containsHumanFace(tempFile)) {
                    return ResponseEntity.badRequest().body("The uploaded image does not contain a clear human face. Please upload a correct person image.");
                }
                missingPerson.setImageData(image.getBytes());
                tempFile.delete();
            }
            if (name != null) {
                missingPerson.setName(name);
            }
            if (lastSeen != null) {
                missingPerson.setLastSeen(LocalDateTime.parse(lastSeen));
            }
            if (description != null) {
                missingPerson.setDescription(description);
            }

            MissingPerson updatedPerson = missingPersonRepository.save(missingPerson);
            return ResponseEntity.ok(new MissingPersonDTO(updatedPerson));
        }
        catch (Exception e) {
            logger.error("Error updating missing person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating missing person");
        }
    }


    @ApiOperation(value = "Get Matched Person Details", notes = "Retrieves details of a specific matched person case")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved matched person details"),
            @ApiResponse(code = 404, message = "Matched person not found"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @GetMapping("/reported-persons/matched/{id}")
    public ResponseEntity<?> getMatchedPerson(
            @ApiParam(value = "Matched person ID", required = true) @PathVariable Long id) {
        try {

            MatchedPerson matchedPerson = matchedPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Matched person not found with id: " + id));
            return ResponseEntity.ok(matchedPerson);
        } catch (Exception e) {
            logger.error("Error fetching matched person", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching matched person details");
        }
    }
    @ApiOperation(value = "Get All Matched Persons", notes = "Retrieves a list of all matched persons with optional limit")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved matched persons list")
    })
    @GetMapping("/matched")
    public ResponseEntity<List<MatchedPerson>> getMatchedPersons(
            @ApiParam(value = "Maximum number of records to return", required = false) @RequestParam(required = false) Integer limit) {
        List<MatchedPerson> matchedPersons = matchedPersonRepository.findAllByApprovedTrueOrderByMatchedAtDesc();
        if (limit != null && limit > 0) {
            matchedPersons = matchedPersons.stream().limit(limit).collect(Collectors.toList());
        }
        return ResponseEntity.ok(matchedPersons);
    }

    @ApiOperation(value = "Get Pending Matches", notes = "Retrieves all pending matches for the current user's reported persons")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved pending matches list")
    })
    @GetMapping("/reported-persons/matched/pending")
    public ResponseEntity<List<MatchedPerson>> getPendingMatches() {
        String email = (String) httpSession.getAttribute("email");
        User currentUser = userRepository.findByEmail(email);

        List<MatchedPerson> pendingMatches = matchedPersonRepository
                .findByReportedByAndApprovedFalseOrderByMatchedAtDesc(currentUser)
                .stream()
                .filter(match -> !match.getFoundBy().equals(match.getReportedBy()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendingMatches);
    }

    @ApiOperation(value = "Get Approved Matches", notes = "Retrieves all approved matches for the current user's reported persons")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved approved matches list")
    })
    @GetMapping("/reported-persons/approved-matches")
    public ResponseEntity<List<MatchedPerson>> getApprovedMatches() {
        String email = (String) httpSession.getAttribute("email");
        User currentUser = userRepository.findByEmail(email);

        List<MatchedPerson> approvedMatches = matchedPersonRepository.findByReportedByAndApprovedTrueOrderByMatchedAtDesc(currentUser);
        return ResponseEntity.ok(approvedMatches);
    }

    @ApiOperation(value = "Approve Match", notes = "Approves a potential match and marks the missing person as found")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully approved the match"),
            @ApiResponse(code = 403, message = "User doesn't have permission to approve this match"),
            @ApiResponse(code = 404, message = "Matched person not found"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @PostMapping("/reported-persons/matched/{id}/approve")
    public ResponseEntity<?> approveMatch(@PathVariable Long id ,@RequestParam String successMessage) {
        try {
            MatchedPerson matchedPerson = matchedPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Matched person not found with id: " + id));

            matchedPerson.setApproved(true);
            matchedPerson.setSuccessMessage(successMessage);
            matchedPersonRepository.save(matchedPerson);

            // Update missing person status
            MissingPerson missingPerson = matchedPerson.getMissingPerson();
            missingPerson.setStatus(PersonStatus.FOUND);
           MissingPerson approved = missingPersonRepository.save(missingPerson);
            List<MatchedPerson> otherPendingMatches = matchedPersonRepository
                    .findByMissingPersonAndApprovedFalse(missingPerson);
            matchedPersonRepository.deleteAll(otherPendingMatches);

            emailService.sendFoundPersonNotification(
                    matchedPerson.getFoundBy().getEmail(),
                    approved,
                    matchedPerson,
                    "Thank you for helping find this missing person. Your contribution makes a real difference and filled joys in a family!"
            );

            emailService.sendFoundPersonNotification(
                    matchedPerson.getReportedBy().getEmail(),
                    approved,
                    matchedPerson,
                    "We're delighted to confirm that your reported missing person has been found and is safe after your approval."
            );

            List<String> commenterEmails = commentRepository
                    .findByMissingPersonIdOrderByCreatedAtDesc(missingPerson.getId())
                    .stream()
                    .map(comment -> comment.getUser().getEmail())
                    .distinct()
                    .collect(Collectors.toList());

            for (String commenterEmail : commenterEmails) {
                emailService.sendFoundPersonNotification(
                        commenterEmail,
                       approved,
                        matchedPerson,
                        "Great news! The missing person you commented about has been found and is safe."
                );
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error approving match", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while approving the match.");
        }
    }


    @ApiOperation(value = "Reject Match", notes = "Rejects a potential match for a reported missing person")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully rejected the match"),
            @ApiResponse(code = 403, message = "User doesn't have permission to reject this match"),
            @ApiResponse(code = 404, message = "Matched person not found"),
            @ApiResponse(code = 500, message = "Internal server error")
    })
    @DeleteMapping("/reported-persons/matched/{id}/reject")
    public ResponseEntity<?> rejectMatch(
            @ApiParam(value = "Match ID to reject", required = true) @PathVariable Long id) {
        try {
            MatchedPerson matchedPerson = matchedPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Matched person not found with id: " + id));

            String email = (String) httpSession.getAttribute("email");
            User currentUser = userRepository.findByEmail(email);

            if (!matchedPerson.getReportedBy().equals(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have permission to reject this match.");
            }

            matchedPersonRepository.delete(matchedPerson);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error rejecting match", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while rejecting the match.");
        }
    }


    @ApiOperation(value = "Get Related News", notes = "Fetches news articles related to a missing person by their name")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved related news"),
            @ApiResponse(code = 500, message = "Error fetching news from external API")
    })
    @GetMapping("/news/{name}")
    public ResponseEntity<?> getRelatedNews(
            @ApiParam(value = "Name of the missing person", required = true) @PathVariable String name) {
        // Get API key from the "https://newsapi.org/"
        String apiKey = "";
        String url = String.format("https://newsapi.org/v2/everything?q=%s&apiKey=%s", name, apiKey);

        logger.info("Fetching news for: {}", name);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        logger.info("News API response: {}", response.getBody());

        return ResponseEntity.ok(response.getBody());
    }

    @ApiOperation(value = "Chat Bot Query Handler",
            notes = "Handles user queries and provides relevant information about the missing persons system")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully processed bot query"),
            @ApiResponse(code = 400, message = "Invalid request format")
    })
    @PostMapping("/bot")
    public ResponseEntity<Map<String, String>> handleBotQuery(
            @ApiParam(value = "Query message in request body", required = true, example = "{\"message\": \"how to report?\"}")
            @RequestBody Map<String, String> request) {
        String message = request.get("message").toLowerCase();
        String response;

        if (message.contains("report")) {
            response = "To report a missing person, click the 'Report Missing Person' button at the top of the page. You'll need to provide:\n" +
                    "- A clear, recent photo\n" +
                    "- Full name\n" +
                    "- Age\n" +
                    "- Last known location\n" +
                    "- Date last seen\n" +
                    "- Description of the person";
        } else if (message.contains("search")) {
            response = "You can search for missing persons in several ways:\n" +
                    "1. Use the search bar for name/description\n" +
                    "2. Browse the photo in home page\n" +
                    "3. Use location filters\n" +
                    "4. Sort by recent cases";
        } else if (message.contains("filter")) {
            response = "Our filtering system lets you:\n" +
                    "- Select specific countries, states, and cities\n" +
                    "- Sort by recently missing persons\n" +
                    "- Sort by recently reported cases\n" +
                    "- View oldest cases first\n" +
                    "Click the filter options above the gallery to begin.";
        } else if (message.contains("contact")) {
            response = "You can reach our support team at: " + supportEmail + "\n" +
                    "For urgent matters:\n" +
                    "1. Contact local law enforcement\n" +
                    "2. File an official missing person report\n" +
                    "3. Keep all relevant documentation handy";
        }
        else if (message.contains("share")) {
            response = "You can share the missing person profile to the social media" + "\n" +
                    "1. Open any missing person profile\n" +
                    "2. Come to bottom of the page and you will find the share profile option\n" +
                    "3. You can share the profile via X, Whatsapp, Fb";
        }
        else if (message.contains("approve") || message.contains("reject")) {
            response = "You can approve or reject the match after the reporting person has found" + "\n" +
                    "1. Open the Reported person tab in top of page \n" +
                    "2. You can find the pending approvals section\n" +
                    "3. You can click on Review Match and either Approve or Reject the match";
        }
        else if (message.contains("match") || message.contains("found")) {
            response = "If you think you've found a match:\n" +
                    "1. Click 'View Details' on the person's profile\n" +
                    "2. Use the 'Compare' feature to upload a photo\n" +
                    "3. Our application will analyze the similarity\n" +
                    "4. The original reporter will be notified if there's a match";
        }
        else if (message.contains("comment") || message.contains("community")) {
            response = "To comment on a missing person:\n" +
                    "1. Click 'View Details' on the person's profile\n" +
                    "2. Use the 'Comment' feature\n" +
                    "3. If the respective person has been found and approved \n" +
                    "4. You will get the confirmation in mail";
        }
        else if (message.contains("update") || message.contains("edit")) {
            response = "To update a missing person report:\n" +
                    "1. Go to 'My Reported Persons'\n" +
                    "2. Select the report you want to update\n" +
                    "3. Click 'Edit Details'\n" +
                    "4. You can update photos, description, and last seen information";
        }
        else if (message.contains("delete") || message.contains("remove")) {
            response = "To Delete a missing person report:\n" +
                    "1. Go to 'My Reported Persons'\n" +
                    "2. Select the report you want to delete\n" +
                    "3. Click 'Delete Report '\n" +
                    "4. It will ask for confirmation and you can delete the report";
        }
        else if (message.contains("notification") || message.contains("alert")) {
            response = "Our notification system:\n" +
                    "- Alerts you when someone finds a potential match\n" +
                    "- Sends updates on your reported cases\n" +
                    "- Notifies about important case developments\n" +
                    "Check your email settings in your profile to manage alerts.";
        } else if (message.contains("photo") || message.contains("image")) {
            response = "Photo guidelines:\n" +
                    "- Upload clear, recent photos\n" +
                    "- Face should be clearly visible\n" +
                    "- One person per photo\n" +
                    "- Multiple angles are helpful\n" +
                    "Our AI system will verify the photo quality automatically.";
        } else if (message.contains("privacy") || message.contains("security")) {
            response = "Your privacy matters:\n" +
                    "- All data is encrypted\n" +
                    "- Location sharing is optional\n" +
                    "- Reports can be updated or removed\n" ;
        }
        else if (message.contains("thanks") || message.contains("thank you")) {
            response = "Feel free to use this bot for any queries" + "\n";
        }
        else if (message.contains("help") || message.contains("assistance")) {
            response = "I can help you with:\n" +
                    "- Reporting missing persons\n" +
                    "- Using filters and matching\n" +
                    "- Updates and notifications\n" +
                    "- Privacy and security\n" +
                    "What would you like to know more about?";
        }

        else {
            response = "Welcome to TraceBack! I can help you with:\n" +
                    "1. Reporting missing persons\n" +
                    "2. Searching the database\n" +
                    "3. Using filters\n" +
                    "4. Matching and notifications\n" +
                    "5. Privacy and security\n" +
                    "Just ask about any of these topics!";
        }

        Map<String, String> responseMap = new HashMap<>();
        responseMap.put("message", response);
        return ResponseEntity.ok(responseMap);
    }

    @ApiOperation(value = "Get Success Stories", notes = "Retrieves all successfully matched and approved cases")
    @GetMapping("/success-stories")
    public ResponseEntity<List<Map<String, Object>>> getSuccessStories() {
        logger.info("Fetching success stories");
        List<MatchedPerson> successStories = matchedPersonRepository
                .findAllByApprovedTrueOrderByMatchedAtDesc()
                .stream()
                .filter(match -> match.getMissingPerson().getStatus() == PersonStatus.FOUND)
                .collect(Collectors.toList());

        logger.info("Found {} success stories", successStories.size());

        return ResponseEntity.ok(successStories.stream().map(story -> {
            Map<String, Object> storyWithMetrics = new HashMap<>();
            storyWithMetrics.put("story", story);
            storyWithMetrics.put("communitySupport", commentRepository.countByMissingPersonId(story.getMissingPerson().getId()));
            return storyWithMetrics;
        }).collect(Collectors.toList()));
    }

    @ApiOperation(value = "Generate Comprehensive Missing Person PDF", notes = "Generates a detailed PDF report for a missing person")
    @GetMapping("/{id}/download-pdf")
    public ResponseEntity<byte[]> generateMissingPersonPDF(@PathVariable Long id) {
        try {
            // Fetch the missing person with all details
            MissingPerson person = missingPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Missing person not found"));

            // Create PDF document
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            // Add header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("MISSING PERSON REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            // Add person image
            if (person.getImageData() != null) {
                Image personImage = Image.getInstance(person.getImageData());
                personImage.scaleToFit(300, 300);
                personImage.setAlignment(Element.ALIGN_CENTER);
                document.add(personImage);
                document.add(Chunk.NEWLINE);
            }

            // Create a table for person details

            Paragraph sectionHeader = new Paragraph("Missing Person Details",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY));
            sectionHeader.setAlignment(Element.ALIGN_CENTER);
            sectionHeader.setSpacingAfter(10f);
            document.add(sectionHeader);

// Add a decorative line
            document.add(new LineSeparator(1f, 100f, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, 0));
            PdfPTable detailsTable = new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingBefore(15f);
            detailsTable.setSpacingAfter(15f);
// Optional: Set specific column widths
            float[] columnWidths = {1f, 2f}; // First column narrower than second
            detailsTable.setWidths(columnWidths);


            // Add person details to the table
            addTableRow(detailsTable, "Name", person.getName());
            addTableRow(detailsTable, "Age", String.valueOf(person.getAge()));
            addTableRow(detailsTable, "Last Seen",
                    person.getLastSeen() != null ? person.getLastSeen().toString() : "Not Specified");
            addTableRow(detailsTable, "Location", person.getLocation());
            addTableRow(detailsTable, "City", person.getCity());
            addTableRow(detailsTable, "State", person.getState());
            addTableRow(detailsTable, "Country", person.getCountry());

           // Add the details table to the document
            document.add(detailsTable);

            // Reported By Details
            User reportedBy = person.getReportedBy();
            if (reportedBy != null) {
                // Create a styled section header for Reported By Information
                Paragraph reporterSectionHeader = new Paragraph("Reported By Information",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY));
                reporterSectionHeader.setAlignment(Element.ALIGN_CENTER);
                reporterSectionHeader.setSpacingAfter(10f);
                document.add(reporterSectionHeader);

                // Add a decorative line
                document.add(new LineSeparator(1f, 100f, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, 0));

                // Create the reporter details table
                PdfPTable reporterTable = new PdfPTable(2);
                reporterTable.setWidthPercentage(100);
                reporterTable.setSpacingBefore(15f);
                reporterTable.setSpacingAfter(15f);

                // Optional: Set specific column widths
                float[] columnWidths1 = {1f, 2f}; // First column narrower than second
                reporterTable.setWidths(columnWidths1);

                // Add reporter details with styled table rows
                addTableRow(reporterTable, "Reporter Name", reportedBy.getName());
                addTableRow(reporterTable, "Contact Email", reportedBy.getEmail());

                // Add phone number if available
                // Add the reporter table to the document
                document.add(reporterTable);
            }


            // Description
//            document.add(new Paragraph("Description:", titleFont));
            document.add(new Paragraph("Description: " +
                    (person.getDescription() != null ?
                    person.getDescription() : "No description available")));

            // Reported Time
            document.add(new Paragraph("Reported Time: " +
                    (person.getReportedTime() != null ? person.getReportedTime().toString() : "Not Available")));

            // Footer
            document.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph("Generated by TraceBack Missing Persons Registry",
                    FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            byte[] pdfBytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.builder("attachment")
                    .filename("missing_person_report_" + person.getName() + ".pdf")
                    .build());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            logger.error("Error generating PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Helper method to add rows to PDF table
    private void addTableRow(PdfPTable table, String label, String value) {
        // Create more sophisticated fonts
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.DARK_GRAY);

        // Label Cell with a more distinctive background
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBackgroundColor(new BaseColor(52, 152, 219)); // Vibrant blue
        labelCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        labelCell.setPadding(8f);
        labelCell.setBorder(Rectangle.BOX);
        labelCell.setBorderColor(BaseColor.LIGHT_GRAY);

        // Value Cell with some padding and styling
        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "Not Specified", valueFont));
        valueCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        valueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        valueCell.setPadding(8f);
        valueCell.setBorder(Rectangle.BOX);
        valueCell.setBorderColor(BaseColor.LIGHT_GRAY);

        // Add some spacing between rows
        labelCell.setPaddingBottom(10f);
        valueCell.setPaddingBottom(10f);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    @ApiOperation(value = "Upload Video for Missing Person")
    @PostMapping("/{id}/upload-video")
    public ResponseEntity<?> uploadVideo(
            @PathVariable Long id,
            @RequestParam("video") MultipartFile videoFile,
            HttpSession session
    ) {
        try {
            // Get current user's email from session
            String email = (String) session.getAttribute("email");
            User currentUser = userRepository.findByEmail(email);

            // Find the missing person
            MissingPerson missingPerson = missingPersonRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Missing person not found"));

            // Verify the current user is the reported person
            if (!missingPerson.getReportedBy().equals(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Only the reported person can upload a video");
            }

            try (InputStream inputStream = videoFile.getInputStream()) {
                if (videoFile.getSize() > 20 * 1024 * 1024) { // 20MB max
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Video too large. Maximum 20MB allowed."));
                }
            }

            missingPerson.setVideoData(videoFile.getBytes());
            missingPersonRepository.save(missingPerson);


            return ResponseEntity.ok(
                    Map.of("message", "Video uploaded successfully")
            );
        } catch (Exception e) {
            logger.error("Error uploading video", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to upload video"));
        }
    }
    @GetMapping("/user-profile/{userId}")
    @ApiOperation("Get User Profile Details")
    public ResponseEntity<DiscussionUserProfileDTO> getUserProfile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NullPointerException("User not found"));
        // Count reported missing persons
        long reportedPersonsCount = matchedPersonRepository.countByReportedBy(user);

        // Count found persons
        long foundPersonsCount = matchedPersonRepository.countByFoundBy(user);

        DiscussionUserProfileDTO profileDTO = new DiscussionUserProfileDTO();
        profileDTO.setId(user.getId());
        profileDTO.setName(user.getName());
        profileDTO.setEmail(user.getEmail());
        profileDTO.setLocation(user.getLocation());
        profileDTO.setProfilePicture(user.getProfilePicture());
        profileDTO.setReportedPersonsCount(reportedPersonsCount);
        profileDTO.setFoundPersonsCount(foundPersonsCount);

        return ResponseEntity.ok(profileDTO);
    }

    @ApiOperation(value = "Get Weather Information", notes = "Retrieves current weather data for a specific location")
    @GetMapping("/weather")
    public ResponseEntity<Map<String, Object>> getWeatherInfo(
            @RequestParam String city
    ) {
        try {
            // Using OpenWeatherMap API (free tier available) get the API KEY from "https://openweathermap.org/api"
            String apiKey = "";
            String weatherUrl = String.format(
                    "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s&units=metric",
                    city, apiKey
            );

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> weatherResponse = restTemplate.exchange(
                    weatherUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            if (weatherResponse.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode weatherData = mapper.readTree(weatherResponse.getBody());

                Map<String, Object> weatherInfo = new HashMap<>();
                weatherInfo.put("temperature", weatherData.get("main").get("temp").asDouble());
                weatherInfo.put("feelsLike", weatherData.get("main").get("feels_like").asDouble());
                weatherInfo.put("humidity", weatherData.get("main").get("humidity").asInt());
                weatherInfo.put("description", weatherData.get("weather").get(0).get("description").asText());
                weatherInfo.put("icon", weatherData.get("weather").get(0).get("icon").asText());
                weatherInfo.put("windSpeed", weatherData.get("wind").get("speed").asDouble());
                weatherInfo.put("pressure", weatherData.get("main").get("pressure").asInt());
                weatherInfo.put("visibility", weatherData.has("visibility") ? weatherData.get("visibility").asInt() / 1000.0 : null);

                return ResponseEntity.ok(weatherInfo);
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "Weather service unavailable"));
            }
        } catch (Exception e) {
            logger.error("Error fetching weather data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch weather information"));
        }
    }



    @ApiOperation(value = "Get Timezone Information", notes = "Retrieves timezone and local time for specific coordinates")
    @GetMapping("/timezone")
    public ResponseEntity<Map<String, Object>> getTimezoneInfo(
            @RequestParam double lat,
            @RequestParam double lon
    ) {
        try {
            // Use TimeZoneDB API
            String timezoneUrl = String.format(
                    "https://api.timezonedb.com/v2.1/get-time-zone?key=GQI3R1E16DJQ&format=json&by=position&lat=%f&lng=%f",
                     lat, lon
            );

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");

            ResponseEntity<String> timezoneResponse = restTemplate.exchange(
                    timezoneUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            if (timezoneResponse.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode timezoneData = mapper.readTree(timezoneResponse.getBody());

                if (timezoneData.get("status").asText().equals("OK")) {
                    Map<String, Object> timeInfo = new HashMap<>();
                    timeInfo.put("timezone", timezoneData.get("zoneName").asText());
                    timeInfo.put("localTime", timezoneData.get("formatted").asText());
                    timeInfo.put("utcOffset", timezoneData.get("gmtOffset").asInt());
                    timeInfo.put("abbreviation", timezoneData.get("abbreviation").asText());
                    timeInfo.put("dst", timezoneData.get("dst").asInt() == 1);

                    return ResponseEntity.ok(timeInfo);
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Invalid coordinates or API limit reached"));
                }
            }

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "Timezone service unavailable"));

        } catch (Exception e) {
            logger.error("Error fetching timezone data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch timezone information"));
        }
    }






}

