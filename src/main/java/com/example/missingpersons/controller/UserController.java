package com.example.missingpersons.controller;

import com.example.missingpersons.model.User;
import com.example.missingpersons.repository.UserRepository;
import io.swagger.annotations.*;
import org.imgscalr.Scalr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpSession;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Api(tags = "User Management API")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @ApiOperation(value = "Get Current User Details", notes = "Fetches details of the currently logged-in user")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Successfully retrieved user details"),
            @ApiResponse(code = 401, message = "User is not authenticated"),
            @ApiResponse(code = 404, message = "User not found")
    })
    @GetMapping("/view")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        log.info("Fetching current user details...");
        String email = (String) session.getAttribute("email"); // Get email from session
        log.info("Authenticated user: {}", email);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User is not authenticated");
        }
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("success", true);
        userResponse.put("message", "User details fetched successfully");
        userResponse.put("user", user);

        // Safely handle profile picture
        Optional.ofNullable(user.getProfilePicture())
                .map(pic -> Base64.getEncoder().encodeToString(pic))
                .ifPresent(base64Pic -> userResponse.put("profilePicture", base64Pic));

        return ResponseEntity.ok(userResponse);
    }

    @ApiOperation(value = "Update User Details", notes = "Updates the details of the currently logged-in user")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "User details updated successfully"),
            @ApiResponse(code = 404, message = "User not found")
    })
    @PutMapping("/update")
    public ResponseEntity<?> updateCurrentUser(@RequestBody User updatedUser,HttpSession session) {
        log.info("Updating user details...");


        String email = (String) session.getAttribute("email"); // Get email from session
        log.info("Authenticated user in update: {}", email);
        User currentUser = userRepository.findByEmail(email);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        // Update user details
        currentUser.setName(updatedUser.getName());
        currentUser.setEmail(updatedUser.getEmail());
        currentUser.setLocation(updatedUser.getLocation());
        User savedUser = userRepository.save(currentUser);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User details updated successfully",
                "user", savedUser
        ));
    }

    @PostMapping("/upload-profile-pic")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            HttpSession session
    ) {
        try {
            String email = (String) session.getAttribute("email");
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not authenticated");
            }

            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Please upload a file");
            }

//            // Check file size (e.g., max 5MB)
//            if (file.getSize() > 5 * 1024 * 1024) {
//                return ResponseEntity.badRequest().body("File size should be less than 5MB");
//            }

            // Compress and validate image
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                return ResponseEntity.badRequest().body("Invalid image file");
            }

            // Resize image if needed
            BufferedImage resizedImage = Scalr.resize(
                    image,
                    Scalr.Method.QUALITY,
                    Scalr.Mode.FIT_TO_WIDTH,
                    300,
                    300
            );

            // Convert to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(resizedImage, "png", baos);
            byte[] profilePicBytes = baos.toByteArray();

            // Save to database
            User user = userRepository.findByEmail(email);
            user.setProfilePicture(profilePicBytes);
            userRepository.save(user);

            return ResponseEntity.ok().body("Profile picture uploaded successfully");

        } catch (Exception e) {
            log.error("Profile picture upload error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Could not upload profile picture");
        }
    }
}
