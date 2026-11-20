# ⚡ Quick Start - Tests E2E Automatisés

Démarrer les tests en 3 minutes.

## 🏃 Démarrage Rapide

### 1. Installation (2 min)

```bash
# Linux/macOS
cd test-automation
chmod +x setup.sh
./setup.sh

# Windows (PowerShell)
cd test-automation
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\setup.ps1

# Ou manuel
cd test-automation
npm install
cp config.example.json config.json
```

### 2. Configuration (30 sec)

Éditer `config.json` avec vos credentials:

```json
{
  "apiBaseUrl": "http://localhost:8080/api",
  "testAccounts": {
    "candidatComplet": {
      "email": "votre-email-candidat@test.fr",
      "password": "VotreMotDePasse123!"
    },
    "entreprise": {
      "email": "votre-email-recruteur@test.fr",
      "password": "VotreMotDePasse123!"
    }
  }
}
```

### 3. Lancer les tests (30 sec)

```bash
npm test
```

Ça c'est tout ! 🎉

---

## 📊 Consulter les Résultats

### Option 1: Rapport HTML (👍 Recommandé)

```bash
npm run test:report
open test-report.html          # macOS
start test-report.html         # Windows
xdg-open test-report.html      # Linux
```

### Option 2: Console

Le rapport s'affiche directement dans la console après l'exécution.

### Option 3: JSON brut

```bash
cat test-report.json | jq '.'
```

---

## 🔍 Modes d'Exécution

```bash
# Standard
npm test

# Verbose (logs détaillés)
npm run test:verbose

# Watch (re-exécute à chaque changement)
npm run test:watch
```

---

## ⚙️ Configuration Avancée

### Variables d'Environnement

```bash
API_URL=http://localhost:8080/api \
FRONTEND_URL=http://localhost:5173 \
npm test
```

### Personnaliser la Config

Éditer `config.json`:

```json
{
  "timeouts": {
    "apiCall": 30000,      // Augmenter pour API lente
    "maxPolls": 60         // Plus d'attente
  },
  "verbose": true          // Debug mode
}
```

---

## 🛠️ Troubleshooting

| Problème | Solution |
|----------|----------|
| `ECONNREFUSED 127.0.0.1:8080` | Backend pas démarré - `docker ps` |
| `401 Invalid credentials` | Comptes de test n'existent pas |
| `Timeout` | Augmenter `timeouts.apiCall` dans config.json |
| Tests trop lents | Vérifier la charge du serveur |

---

## 📈 Interprétation

```
Taux de succès:
  ✅ 90-100%  → Excellente synchronisation
  ⚠️  70-89%  → Bonne, points mineurs à corriger
  🟠 50-69%  → Problèmes importants
  🔴 <50%    → Critique - données incohérentes
```

---

## 📚 Documentation Complète

Pour tous les détails: **`README.md`** et **`../TEST-FLUX-CANDIDAT-ENTREPRISE.md`**

---

## 🎯 Ce qui est Testé

✅ Dépôt de candidature  
✅ Validation admin  
✅ Synchronisation candidat ↔ entreprise  
✅ Changement de statut en temps réel  
✅ Notifications  
✅ Rejet avec motif  
✅ Retrait de candidature  
✅ Cas limites (doublons, offres fermées, etc.)  

---

**Durée moyenne des tests**: 30-60 secondes

**Prochaine étape**: Intégrer dans la CI/CD (GitHub Actions, etc.)

Besoin d'aide ? Voir `README.md` 📖
