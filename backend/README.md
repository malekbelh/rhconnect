# Backend RhConnect

## Prérequis

- Java 17+
- Maven 3.9+
- MongoDB 6+ en local ou via Docker

## Démarrage

```bash
cd backend
mvn spring-boot:run
```

## Variables d’environnement utiles

- `spring.data.mongodb.uri=mongodb://localhost:27017/rhconnect`
- `rhconnect.jwt.secret=...`
- `rhconnect.ollama.base-url=http://localhost:11434`

## Endpoints principaux

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `GET /api/public/health`
- `GET /api/offers`
- `POST /api/offers`
- `GET /api/admin/stats/dashboard`

## Swagger

La documentation OpenAPI est disponible sur :

- `http://localhost:8080/swagger-ui/index.html`

## Seed

Le seed démarre automatiquement au lancement si la base est vide, ou si `rhconnect.seed.force=true`.
