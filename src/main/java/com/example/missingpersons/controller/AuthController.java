package com.example.missingpersons.controller;

import com.example.missingpersons.model.User;
import com.example.missingpersons.repository.UserRepository;
import com.example.missingpersons.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import io.swagger.annotations.*;
import javax.servlet.http.HttpSession;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
@Api(tags = "Authentication API")
@RestController
@RequestMapping("/api/auth")
public class AuthController {


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;
    @ApiOperation(value = "User Registration", notes = "Register a new user with email and password")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "User registered successfully"),
            @ApiResponse(code = 409, message = "Email already exists")
    })
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(
            @ApiParam(value = "User registration details", required = true)
            @RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Email already exists. Please create an account with a different email address.");
            response.put("errorCode", "EMAIL_EXISTS");
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(response);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "User registered successfully"));
    }
    @ApiOperation(value = "User Login", notes = "Authenticate user and create session")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Login successful"),
            @ApiResponse(code = 400, message = "Invalid credentials")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @ApiParam(value = "Login credentials", required = true)
            @RequestBody User loginUser, HttpSession session) {
        User user = userRepository.findByEmail(loginUser.getEmail());

        if (user != null && passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            // Check if user is already logged in
            if (Boolean.TRUE.equals(user.getIsLoggedIn())) {
                // Check session staleness
                if (isSessionStale(user)) {
                    // If session is stale, allow new login
                    user.setIsLoggedIn(false);
                    user.setLastLoginTimestamp(null);
                } else {
                    // Prevent login if session is active
                    return ResponseEntity
                            .status(HttpStatus.CONFLICT)
                            .body(Map.of(
                                    "success", false,
                                    "message", "User is already logged in on another device. Please logout first."
                            ));
                }
            }

            // Mark user as logged in
            user.setIsLoggedIn(true);
            user.setLastLoginTimestamp(new Date());
            userRepository.save(user);

            session.setAttribute("email", user.getEmail());
            return ResponseEntity.ok(Map.of("success", true, "message", "Login successful"));
        }

        return ResponseEntity.badRequest().body("Invalid credentials");
    }
    @ApiOperation(value = "Forgot Password", notes = "Send verification code to user's email")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Verification code sent successfully"),
            @ApiResponse(code = 400, message = "Email not found")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @ApiParam(value = "User's email", required = true)
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email not found"));
        }

        // Generate 6-digit verification code
        String verificationCode = String.format("%06d", new Random().nextInt(999999));

        // Store verification code in user object or separate table
        user.setVerificationCode(verificationCode);
        userRepository.save(user);

        // Send verification code via email
        emailService.sendVerificationCode(email, verificationCode);

        return ResponseEntity.ok(Map.of("success", true, "message", "Verification code sent"));
    }
    @ApiOperation(value = "Reset Password", notes = "Reset user's password using verification code")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "Password reset successful"),
            @ApiResponse(code = 400, message = "Invalid verification code or email")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @ApiParam(value = "Reset password details", required = true)
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String verificationCode = request.get("verificationCode");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email not found"));
        }

        // Verify the code
        if (!verificationCode.equals(user.getVerificationCode())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid verification code"));
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null); // Clear the verification code
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successful"));
    }
    @ApiOperation(value = "Get User Details", notes = "Retrieve current user's information")
    @ApiResponses(value = {
            @ApiResponse(code = 200, message = "User details retrieved successfully"),
            @ApiResponse(code = 401, message = "User not authenticated")
    })
    @GetMapping("/user-details")
    public ResponseEntity<?> getUserDetails(HttpSession session) {
        String email = (String) session.getAttribute("email");
        if (email != null) {
            User user = userRepository.findByEmail(email);
            if (user != null) {
                return ResponseEntity.ok(Map.of(
                        "email", user.getEmail(),
                        "name", user.getName()
                ));
            }
        }
        return ResponseEntity.status(401).body("User not authenticated");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        String email = (String) session.getAttribute("email");
        if (email != null) {
            User user = userRepository.findByEmail(email);
            if (user != null) {
                // Mark user as logged out
                user.setIsLoggedIn(false);
                user.setLastLoginTimestamp(null);
                userRepository.save(user);
            }

            // Invalidate session
            session.invalidate();
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }

    private boolean isSessionStale(User user) {
        if (user.getLastLoginTimestamp() == null) {
            return true;
        }

        // Define staleness (e.g., session is stale after 30 minutes of inactivity)
        long currentTime = System.currentTimeMillis();
        long lastLoginTime = user.getLastLoginTimestamp().getTime();

        // Allow login if more than 30 minutes have passed
        long stalenessThreshold = 2 * 60 * 1000; // 30 minutes in milliseconds
        return (currentTime - lastLoginTime) > stalenessThreshold;
    }
}

