package com.rhconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
@EnableAsync
public class RhconnectApplication {
    public static void main(String[] args) {
        SpringApplication.run(RhconnectApplication.class, args);
    }
}
