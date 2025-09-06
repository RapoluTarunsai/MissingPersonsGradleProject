package com.example.missingpersons;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.example.missingpersons",
        "com.example.missingpersons.config",
        "com.example.missingpersons.controller",
        "com.example.missingpersons.service",
        "com.example.missingpersons.repository"
})
public class MissingPersonsApplication implements WebMvcConfigurer {
    public static void main(String[] args) {
        SpringApplication.run(MissingPersonsApplication.class, args);
    }

}
