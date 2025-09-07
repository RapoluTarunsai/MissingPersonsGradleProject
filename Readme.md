# Missing Persons Gradle Project

A full-stack web application for managing missing persons cases, built with Spring Boot, React, Gradle, Oracle Database, 
and open API integrations.
## Table of Contents

- [Technologies Used](#technologies-used)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [OpenAPI Integrations](#openapi-integrations)
- [Database Schema](#database-schema)
- [UI Overview](#ui-overview)
- [Configuration](#configuration)
- [Setup Instructions](#setup-instructions)


## Technologies Used

- Java 17+, Spring Boot, Gradle
- React, JavaScript, npm
- Oracle Database XE
- Python (auxiliary scripts)
- Gmail SMTP (email notifications)
- Google reCAPTCHA (security)
- Open APIs (e.g., location, image recognition)

## Features

- Register, update, and search missing persons
- Image upload (max 12MB)
- Email notifications for case updates

## API Endpoints

- GET /api/missing-persons — GET all missing persons (paginated)
- GET /api/missing-persons/nearby — GET nearby missing persons by user location
- POST /api/missing-persons/add — Add a new missing person report
- GET /api/missing-persons/quick-search — Quick search missing persons by name
- GET /api/missing-persons/geocode — GET geocode for a location
- GET /api/missing-persons/{id} — GET details of a missing person
-DELETE /api/missing-persons/{id} — Delete a missing person report
- GET /api/missing-persons/{id}/discussions — GET discussions for a missing person
- POST /api/missing-persons/{id}/discussions — Add a discussion comment
- POST /api/missing-persons/compare — Compare uploaded image with missing person
- GET /api/missing-persons/search — Search missing persons by name or description
- GET /api/missing-persons/locations/countries — GET all countries with missing cases
- GET /api/missing-persons/locations/states — GET states by country
- GET /api/missing-persons/locations/cities — GET cities by country and state
- GET /api/missing-persons/filter — Filter missing persons by location and sort
- GET /api/missing-persons/reported-persons — GET missing persons reported by current user
- PUT /api/missing-persons/reported-persons/{id} — Update missing person report
- GET /api/missing-persons/reported-persons/matched/{id} — GET matched person details
- GET /api/missing-persons/matched — GET all matched persons
- GET /api/missing-persons/reported-persons/matched/pending — GET pending matches for user
- GET /api/missing-persons/reported-persons/approved-matches — GET approved matches for user
- POST /api/missing-persons/reported-persons/matched/{id}/approve — Approve a match
- DELETE /api/missing-persons/reported-persons/matched/{id}/reject — Reject a match
- GET /api/missing-persons/news/{name} — GET related news for a missing person
- POST /api/missing-persons/bot — Chat bot query handler
- GET /api/missing-persons/success-stories — GET all success stories
- GET /api/missing-persons/{id}/download-pdf — Download missing person report as PDF
- POST /api/missing-persons/{id}/upload-video — Upload video for missing person
- GET /api/missing-persons/user-profile/{userId} — GET user profile details
- GET /api/missing-persons/weather — GET weather information for a city
- GET /api/missing-persons/timezone — GET timezone info for coordinates
- POST /api/auth/signup — User registration
- POST /api/auth/login — User login
- POST /api/auth/forgot-password — Send verification code for password reset
- POST /api/auth/reset-password — Reset password using verification code
- GET /api/auth/user-details — GET current user details
- POST /api/auth/logout — Logout user
- GET /api/users/view — GET current user details
- PUT /api/users/update — Update current user details
- POST /api/users/upload-profile-pic — Upload user profile picture

## OpenAPI Integrations
- Geocoding API (location services)
    - Geocode API — Used for reverse geocoding and state/city search in signup and location features
      Site: https://geocode.maps.co/docs/
      API Key Required: Yes
    - example request: 
      - https://geocode.maps.co/reverse?lat={latitude}&lon={longitude}&api_key={YOUR_API_KEY}
        https://geocode.maps.co/search?q={searchTerm}&api_key={YOUR_API_KEY}
- Time Zone API (timezone info)
    -  Gets timezone and local time info for missing person locations
      Site: https://timezonedb.com/api
      API Key Required: Yes
    - example request: 
      - https://api.timezonedb.com/v2.1/get-time-zone?key={YOUR_API_KEY}&format=json&by=position&lat={latitude}&lng={longitude}
- OpenWeatherMap API (weather data)
    - Fetches current weather conditions for missing person locations
      Site: https://openweathermap.org/api
      API Key Required: Yes
    - example request: 
      - https://api.openweathermap.org/data/2.5/weather?q={city}&appid={YOUR_API_KEY}
- NewsAPI (news articles)
    - Retrieves recent news articles related to missing persons
      Site: https://newsapi.org/docs/get-started
      API Key Required: Yes
    - example request: 
      - https://newsapi.org/v2/everything?q={query}&apiKey={YOUR_API_KEY}
- Google reCAPTCHA (form security)
    -  Used for bot protection in image comparison and sensitive forms
      Site: https://www.google.com/recaptcha/about/
      API Key Required: Yes


## Database Schema
- USERS
- MISSING_PERSONS
- MATCHED_PERSONS
- COMMENTS
-- Check the `src/main/java/missingpersons/queries/queries.sql` file for the complete schema.

## UI Overview
- Dashboard listing missing persons
- Registration and login forms
- Case submission with image upload
- Search and filter functionality
- reCAPTCHA on sensitive forms
- Responsive design for desktop

## Configuration
- All configuration is managed in src/main/resources/application.properties:
- Oracle DB connection (spring.datasource.*)
- Email SMTP settings (spring.mail.*)
- reCAPTCHA keys (recaptcha.*)
- File upload limits
- Logging levels

## Setup Instructions
1. Install Java 17+, Gradle, Node.js, and Oracle Database XE.
2. Clone the repository: `git clone
3. Set up Oracle DB and run the schema script in `src/main/java/missingpersons/queries/queries.sql`.
4. Configure `application.properties` with your DB, email, and API keys.
5. Navigate to `src/main/frontend`, install dependencies
   ```cd src/main/frontend
   npm install
6. Install suitable python packages for the image comparison feature:
   ```pip install flask numpy opencv-python   
7. For more details check the Missing Person Controller where these python scripts were calling.
8. Start the backend: `./gradlew bootRun`
9. Access the application at `http://localhost:8080`.
10. This application is developed to run the frontend and backend together using the Gradle bootRun command. 

