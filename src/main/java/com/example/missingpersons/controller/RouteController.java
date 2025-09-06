package com.example.missingpersons.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class RouteController {

    @RequestMapping(value = {
            "/",
            "/login",
            "/signup",
            "/missing-persons",
            "/missing-persons/**",
            "/reported-persons/**",
            "/profile",
            "/matched",
            "/dashboard",
            "/success-stories"
    })
    public String redirect() {
        return "forward:/index.html";

    }
}