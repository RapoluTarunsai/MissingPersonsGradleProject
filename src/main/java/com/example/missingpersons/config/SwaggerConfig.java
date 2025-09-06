package com.example.missingpersons.config; // Make sure this package matches your project structure

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
@EnableSwagger2
public class SwaggerConfig {

    // Assuming you have this value in your application.properties
    // If not, you can hardcode the email string.
    @Value("${spring.mail.username}")
    private String supportEmail;

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
                .select()
                // Make sure this base package is correct for your controllers
                .apis(RequestHandlerSelectors.basePackage("com.example.missingpersons.controller"))
                .paths(PathSelectors.any())
                .build()
                .apiInfo(apiInfo());
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("TraceBack API Documentation")
                .description("REST API documentation for TraceBack Missing Persons System")
                .version("1.0")
                .contact(new Contact("TraceBack Team", "https://traceback.com", supportEmail))
                .build();
    }

    /**
     * This component generates a static swagger.json file in the project root
     * by calling the /v2/api-docs endpoint after the application starts.
     * This approach is compatible with Springfox 3.0.0.
     */
    @Bean
    public ApplicationListener<ApplicationReadyEvent> swaggerJsonGenerator() {
        return event -> {
            try {
                // Get the server port from the application environment
                String serverPort = event.getApplicationContext().getEnvironment().getProperty("server.port", "8080");
                String apiUrl = "http://localhost:" + serverPort + "/v2/api-docs";

                // Use RestTemplate to make an HTTP GET request to the api-docs endpoint
                RestTemplate restTemplate = new RestTemplate();
                String swaggerJson = restTemplate.getForObject(apiUrl, String.class);

                if (swaggerJson == null) {
                    System.err.println("Failed to fetch swagger documentation from " + apiUrl);
                    return;
                }

                // Write the fetched JSON to the swagger.json file in the project root
                Files.write(Paths.get("swagger.json"), swaggerJson.getBytes());

                System.out.println("***************************************************");
                System.out.println("SUCCESS: Generated swagger.json in project root.");
                System.out.println("***************************************************");

            } catch (Exception e) {
                System.err.println("Failed to generate swagger.json");
                e.printStackTrace();
            }
        };
    }
}
