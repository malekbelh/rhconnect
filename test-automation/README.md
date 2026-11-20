# 🧪 Automatisation des Tests End-to-End: Flux Candidat ↔ Entreprise

Automatisation complète du test de synchronisation des candidatures entre l'espace candidat et l'espace entreprise de RHConnect.

## 📋 Contenu

- **`e2e-candidature-flux.js`** - Script principal de test automatisé
- **`generate-report.js`** - Générateur de rapport HTML
- **`package.json`** - Dépendances du projet
- **`config.example.json`** - Configuration d'exemple

## 🚀 Installation

### 1. Installation des dépendances

```bash
cd test-automation
npm install
```

### 2. Configuration

Copier le fichier de configuration exemple:

```bash
cp config.example.json config.json
```

Éditer `config.json` avec vos paramètres:

```json
{
  "apiBaseUrl": "http://localhost:8080/api",
  "frontendUrl": "http://localhost:5173",
  "testAccounts": {
    "candidatComplet": {
      "email": "your-test-candidate@test.fr",
      "password": "YourPassword123!"
    },
    ...
  }
}
```

## 📖 Utilisation

### Exécuter les tests

```bash
# Exécution standard
npm test

# Mode verbose (logs détaillés)
npm run test:verbose

# Mode watch (re-exécute à chaque changement)
npm run test:watch
```

### Variables d'environnement

Vous pouvez également configurer via des variables d'environnement:

```bash
API_URL=http://localhost:8080/api \
FRONTEND_URL=http://localhost:5173 \
npm test
```

## 📊 Résultats

Après l'exécution, deux fichiers sont générés:

1. **`test-report.json`** - Rapport brut en JSON
   ```bash
   cat test-report.json | jq '.summary'
   ```

2. **`test-report.html`** - Rapport visuel (ouvrir dans un navigateur)
   ```bash
   # Linux/macOS
   open test-report.html
   
   # Windows
   start test-report.html
   
   # Générer manuellement
   npm run test:report
   ```

## 🧩 Structure des Tests

Le script teste **7 étapes principales** + **cas limites**:

### Étape 1: Dépôt de Candidature
- ✅ Candidat soumet une candidature
- ✅ Validation admin (débloque accès entreprise)
- ✅ Vérification apparition côté entreprise

### Étape 2: Accès au Dossier Complet
- ✅ Entreprise voit le profil complet du candidat
- ✅ Téléchargement du CV
- ✅ Règles métier (profils incomplets cachés)

### Étape 3: Changement de Statut
- ✅ Entreprise change le statut (TRANSMIS → ENTRETIEN)
- ✅ Synchronisation candidat
- ✅ Notification créée

### Étape 4: Rejet avec Motif
- ✅ Entreprise rejette avec motif spécifique
- ✅ Motif visible dans la notification du candidat
- ✅ Pas de message générique

### Étape 5: Système de Notifications
- ✅ Notifications créées pour chaque changement
- ✅ Compteur de notifications mis à jour
- ✅ Pas de doublons

### Étape 6: Retrait de Candidature
- ✅ Candidat retire sa candidature
- ✅ Disparition côté entreprise

### Étape 7: Cas Limites
- ✅ Candidature dupliquée bloquée
- ✅ Révocation vérification post-candidature
- ✅ Accès denied pour candidatures en EN_VERIFICATION

## 🔍 Débugage

### Mode Verbose

Affiche tous les détails des appels API:

```bash
npm run test:verbose
```

### Consulter les logs du backend

```bash
# Docker
docker logs rhconnect-backend | grep -i candidature

# Direct (si en local)
tail -f logs/application.log
```

### Inspecter les réponses API

Le rapport JSON contient les réponses complètes:

```bash
cat test-report.json | jq '.details[0]'
```

## ⚙️ Configuration Avancée

### Augmenter les timeouts

Pour les environnements lents, éditer `config.json`:

```json
{
  "timeouts": {
    "apiCall": 30000,      // 30s au lieu de 10s
    "polling": 2000,       // 2s entre les polls
    "maxPolls": 60         // Max 60 tentatives
  }
}
```

### Comptes de Test Prédéfinis

Assurer que ces comptes existent dans votre base de données:

| Compte | Email | Rôle | Statut |
|--------|-------|------|--------|
| Candidat Complet | `candidat-complet@test.fr` | CANDIDATE | VALIDE |
| Candidat Incomplet | `candidat-incomplet@test.fr` | CANDIDATE | EN_ATTENTE |
| Entreprise | `recruteur@entreprise-test.fr` | COMPANY | ACTIVE |
| Admin | `admin@rhconnect.local` | ADMIN | ACTIVE |

Ou les créer via l'API avant les tests.

## 📈 Interprétation des Résultats

### Rapport HTML

- **Vert** (✅) = Test réussi
- **Rouge** (❌) = Test échoué
- **Progress bar** = Pourcentage de réussite global

### Taux de Succès

- **90-100%** ✅ **Excellent** - Synchronisation fiable
- **70-89%** ⚠️ **Bon** - Points mineurs à améliorer
- **50-69%** 🟠 **Problématique** - Issues métier
- **<50%** 🔴 **Critique** - Risque de données incohérentes

## 🛠️ Troubleshooting

### Erreur: "API unreachable"

```
❌ Erreur critique: connect ECONNREFUSED 127.0.0.1:8080
```

**Solution:**
- Vérifier que le backend est démarré: `docker ps`
- Vérifier l'URL API dans `config.json`
- Vérifier que le port `8080` est accessible

### Erreur: "Authentication failed"

```
❌ Erreur setup: 401 Invalid credentials
```

**Solution:**
- Vérifier que les comptes de test existent dans la BD
- Vérifier le mot de passe dans `config.json`
- Réinitialiser les comptes via l'admin

### Erreur: "Application not found"

```
❌ Erreur: 1.5 - Candidature doit apparaître côté entreprise
```

**Solution:**
- Vérifier que la vérification admin s'est déclenchée
- Vérifier les logs du backend: `POST /api/verifications/... PATCH 200`
- Augmenter `timeouts.maxPolls` pour plus de temps d'attente

### Erreur: "Token expired"

```
❌ Erreur: 401 Token expired
```

**Solution:**
- Augmenter les timeouts (les tests prennent trop longtemps)
- Simplifier la config pour des tests plus rapides
- Vérifier la durée de vie des tokens JWT

## 📝 Extending the Tests

### Ajouter un nouveau test

1. Créer une fonction `testStepX_...()`:

```javascript
async function testStep8_CustomFeature() {
  logger.section('ÉTAPE 8: Nouvelle Fonctionnalité');

  await recordTest('8.1 - Test description', async () => {
    const api = new APIClient(CONFIG.apiBaseUrl, TEST_STATE.candidateToken);
    const response = await api.get('/custom-endpoint');
    
    TestAssert.hasProperty(response, 'expectedField', 'Should have field');
  });
}
```

2. L'appeler dans `runAllTests()`:

```javascript
await testStep8_CustomFeature();
```

3. Exécuter: `npm test`

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd test-automation && npm install && npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: test-automation/test-report.*
```

### Docker

```dockerfile
FROM node:18

WORKDIR /app
COPY test-automation .

RUN npm install

CMD ["npm", "test"]
```

## 📚 Références

- **Documentation Complète**: `TEST-FLUX-CANDIDAT-ENTREPRISE.md`
- **API Docs**: `http://localhost:8080/swagger-ui.html`
- **Source Code**: `/backend/src/main/java/com/rhconnect/controller/ApplicationController.java`

## 💡 Tips & Best Practices

1. **Exécuter les tests régulièrement** (après chaque PR)
2. **Garder les logs** pour audit et debugging
3. **Documenter les cas d'échec** - ne pas ignorer les ⚠️
4. **Tester en environnement similaire à la production**
5. **Monitorer les durées** - identifie les ralentissements

## 📞 Support

Pour problèmes ou améliorations:

1. Consulter `TEST-FLUX-CANDIDAT-ENTREPRISE.md`
2. Exécuter avec `--verbose` pour plus de détails
3. Vérifier les logs du backend
4. Ouvrir une issue avec `test-report.json` en pièce jointe

---

**Dernière mise à jour**: 2024-12-15
**Version du test**: 1.0.0
