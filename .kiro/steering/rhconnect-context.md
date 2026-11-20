---
inclusion: auto
name: RhConnect Context
description: Context et guidelines pour RhConnect - plateforme HR
---

# RhConnect - Context pour Développement IA

## Vue d'ensemble du Projet

**RhConnect** est une plateforme de gestion des ressources humaines (HR platform) avec:
- Plateforme web pour candidats et entreprises
- Backend Spring Boot 3.2.5
- MongoDB pour persistance
- Redis pour caching
- JWT pour authentification

### Stack Technique

```
Backend: Spring Boot 3.2.5 (Java 17)
Database: MongoDB 5+
Cache: Redis 6+
Security: JWT + Spring Security
Build: Maven 3.8+
Testing: JUnit 5 + Mockito + REST-Assured
```

## Architecture Générale

### Structure du Projet

```
rhconnect/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/rhconnect/
│   │   ├── config/                   # Configuration beans
│   │   │   ├── SecurityConfig.java
│   │   │   ├── RedisConfig.java
│   │   │   ├── MongoIndexConfig.java
│   │   │   └── WebConfig.java
│   │   ├── controller/               # REST controllers
│   │   ├── service/                  # Business logic
│   │   ├── repository/               # Data access
│   │   ├── model/                    # Entities
│   │   ├── security/                 # Auth & filters
│   │   ├── util/                     # Utilities
│   │   └── annotation/               # Custom annotations
│   ├── src/test/java/com/rhconnect/
│   │   ├── service/                  # Unit tests
│   │   ├── util/                     # Util tests
│   │   └── e2e/                      # E2E tests
│   └── src/main/resources/
│       ├── application.properties
│       ├── application-dev.properties
│       └── application-prod.properties
├── docs/                             # Documentation
├── RhConnect-E2E-Tests.postman_collection.json
└── pom.xml
```

## Modules et Responsabilités

### 1. Authentication & Security
**Fichiers clés:** `AuthService`, `SecurityConfig`, `JwtTokenProvider`

**Responsabilités:**
- Enregistrement utilisateurs (CANDIDATE, COMPANY, ADMIN)
- Login avec JWT tokens
- Authentification requêtes protégées
- Password policy validation (10-128 chars, majuscule, minuscule, digit, special)
- Token cleanup scheduler (daily 2am)

**Validations:**
- Email unique et format valide
- Password policy: min 10, max 128 chars + uppercase + lowercase + digit + special char
- Pas d'espaces dans password
- Pas de mots courants (password, admin, login, qwerty, 123456)

### 2. Offer Management
**Fichiers clés:** `OfferService`, `OfferModerationService`, `OfferController`

**Workflow:**
1. Company crée offre en DRAFT
2. Submite pour modération → PENDING_MODERATION
3. Admin approuve → ACTIVE (visible aux candidats)
4. Ou rejection → REJECTED

**Statuts:** DRAFT, PENDING_MODERATION, ACTIVE, REJECTED, EXPIRED, UNPUBLISHED

**Caching:**
- `@Cacheable` sur searchOffers, getOfferById, getMyOffers, getAllOffersForAdmin
- `@CacheEvict` sur create/update/delete pour invalider cache

### 3. Applications (Candidatures)
**Fichiers clés:** `ApplicationService`, `ApplicationController`

**Workflows:**
- Candidat soumet candidature à offre
- Éviter doublons: un candidat = une candidature par offre
- Entreprise reçoit et met à jour statut
- Timeline tracking pour chaque étape

**Statuts:** ENVOYEE, VERIFIE, ACCEPTEE, REJETEE, EN_COURS, TERMINEE

**N+1 Query Fix:**
- ApplicationRepositoryImpl avec aggregation MongoDB $lookup
- findByCompanyIdWithDetails(): 1 query au lieu de N+1

### 4. Audit & Compliance
**Fichiers clés:** `AuditService`, `AuditQueryService`, `AuditController`

**Logging:**
- Tous les actions utilisateur tracées
- TTL: 365 jours (auto-delete après)
- 10 endpoints d'interrogation pour admin
- Détection activités suspectes

### 5. Security Features
**Validations:**
- File upload: magic bytes validation (pas extension)
- XSS sanitization: AOP + Filter + Sanitizer
- Rate limiting: 5 login/15min, 3 register/hour
- HTTPS/HSTS headers activés

### 6. Performance
**Optimisations:**
- Database indexes: 50+ indexes sur 9 collections
- Redis caching: TTL 1h par défaut
- N+1 query fixes via aggregation MongoDB
- Async email notifications (@Async)
- Connection pooling MongoDB/Redis

### 7. Testing
**Couverture:**
- Unit tests: 70+ tests (PasswordPolicyValidator, FileValidationUtil, AuthService, OfferService)
- E2E tests: 20+ scenarios (Postman collection + REST-Assured)
- Mockito pour mocking dépendances
- JUnit 5 + @Nested + @DisplayName

## Conventions de Code

### Naming
- Classes service: `*Service.java`
- Classes controller: `*Controller.java`
- Classes repository: `*Repository.java`
- Interfaces custom: `*Custom.java` (e.g., ApplicationRepositoryCustom)
- Implémentations: `*Impl.java` (e.g., ApplicationRepositoryImpl)

### Architecture Patterns
- Repository pattern pour data access
- Service pattern pour business logic
- DTO pattern pour API contracts
- Custom annotations pour cross-cutting concerns (@Sanitize, @Audit)

### Package Structure
```
com.rhconnect
├── config        # Configuration beans
├── controller    # REST endpoints
├── service       # Business logic
├── repository    # Data access
├── model         # JPA/MongoDB entities
├── dto           # Data transfer objects
│   ├── request   # Request payloads
│   └── response  # Response payloads
├── security      # Auth filters & providers
├── util          # Utility classes
├── annotation    # Custom annotations
└── exception     # Custom exceptions
```

## Base de Données

### Collections MongoDB
1. **users**: Comptes utilisateurs (candidats, entreprises, admins)
2. **candidate_profiles**: Profils candidats détaillés
3. **company_profiles**: Profils entreprises + SIRET
4. **offers**: Offres d'emploi avec modération history
5. **applications**: Candidatures avec timeline
6. **verifications**: Vérifications de profils
7. **audit_logs**: Logs d'actions utilisateurs (TTL 365j)
8. **refresh_tokens**: Tokens refresh (auto-delete)
9. **user_notifications**: Notifications utilisateurs

### Indexes
- **Users**: email (unique), createdAt, lastLogin, (roles+enabled)
- **Offers**: companyId, statut, datePublication, (statut+datePublication)
- **Applications**: (candidateId+offerId), candidateId, offerId, companyId, statut, (companyId+statut)
- **AuditLog**: actorId, action, entityType, entityId, timestamp (TTL), (actorId+action+timestamp)
- **RefreshToken**: token (unique), userId, expiresAt (TTL)

## Features Clés

### 1. Password Policy
**Validateur:** `PasswordPolicyValidator`

Requirements:
- Min length: 10 chars
- Max length: 128 chars
- Min 1 uppercase letter (A-Z)
- Min 1 lowercase letter (a-z)
- Min 1 digit (0-9)
- Min 1 special character (!@#$%^&*)
- No spaces
- No common words (password, admin, login, qwerty, 123456)

### 2. File Upload Validation
**Utilitaire:** `FileValidationUtil`

- Magic bytes validation (not extension)
- Supported: PDF, JPEG, PNG, DOCX
- Max size: 50MB
- Rejection: .exe, .sh, double extensions

### 3. Rate Limiting
**Service:** `RateLimitingService` (Bucket4j)

Limits:
- Login: 5 attempts per 15 minutes
- Register: 3 attempts per hour
- Global: 1000 requests per hour

### 4. XSS Protection
- **XssFilter**: Filters HTML input
- **XssSanitizationAspect**: AOP sanitization
- **XssSanitizer**: HTML escaping utilities

### 5. Email Notifications
**Services:** `EmailService`, `EmailNotificationService`

Async notifications pour:
- Welcome email post-registration
- Application status updates
- Offer moderation decisions

## Commandes Utiles

### Development
```bash
# Start local dev
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# Run unit tests
mvn test

# Run E2E tests
mvn test -Dtest=*E2ETest

# Build production JAR
mvn clean package -DskipTests -Pprod
```

### Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- Setup guide: SETUP_GUIDE.md
- API reference: API_SUMMARY.md
- Database indexes: DATABASE_INDEXES.md
- Unit tests: UNIT_TESTS_GUIDE.md
- E2E tests: E2E_TESTS_GUIDE.md
- Redis caching: REDIS_CACHING_SETUP.md
- N+1 query fixes: N_PLUS_ONE_QUERY_FIXES.md

## Erreurs Courants & Solutions

### Port déjà utilisé
```
Erreur: Address already in use
Solution: Chercher process sur port 8080
lsof -i :8080
kill -9 <PID>
```

### MongoDB connection refused
```
Erreur: Cannot connect to MongoDB
Solution: Vérifier MongoDB est lancé
docker ps | grep mongo
```

### Weak password validation échoue
```
Erreur: Password validation failed
Solution: 10-128 chars avec uppercase, lowercase, digit, special char
```

### Token invalide
```
Erreur: Unauthorized (401)
Solution: Re-login pour obtenir nouveau token JWT
```

## Next Steps & Backlog

### Done (80% complete)
- ✅ Phase 1-3: Security (upload validation, XSS, rate limiting, HTTPS)
- ✅ Phase 1-3: Features (email, offer moderation, audit, password policy)
- ✅ Phase 4: Performance (indexes, Redis, N+1 fixes)
- ✅ Phase 5: Testing (unit + E2E)
- ✅ Phase 6: Documentation (cette fichier + guides)

### TODO (20% remaining)
- [ ] Load testing (Apache JMeter)
- [ ] Security testing (OWASP Top 10)
- [ ] Performance monitoring (DataDog/NewRelic)
- [ ] Kubernetes deployment
- [ ] GraphQL API (optionnel)

## Support & Resources

**Documentation interne:**
- All .md files dans root directory

**External Resources:**
- Spring Boot: https://docs.spring.io/spring-boot/
- MongoDB: https://docs.mongodb.com/
- Redis: https://redis.io/documentation
- JWT: https://tools.ietf.org/html/rfc7519
- OWASP: https://owasp.org/

**Contacts projet:**
- Architecture decisions documented in code comments
- Test cases serve as living documentation
- Code follows Spring Boot best practices
