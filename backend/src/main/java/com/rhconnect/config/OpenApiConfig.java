package com.rhconnect.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("RhConnect API")
                        .version("1.0.0")
                        .description("Plateforme RH complète - API REST. Modules: Authentification, Candidats, Entreprises, Offres, Candidatures, Vérifications, IA, Administration.")
                        .contact(new Contact().name("RhConnect").email("support@rhconnect.tn"))
                        .license(new License().name("Propriétaire").url("https://rhconnect.tn")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Serveur local développement")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT Access Token obtenu via /api/auth/login ou /api/auth/refresh-token")));
    }
}
