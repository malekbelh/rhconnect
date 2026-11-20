#!/bin/bash

# Script de Setup pour les Tests E2E
# Usage: ./setup.sh

echo "🚀 Setup des Tests End-to-End RHConnect"
echo "========================================"
echo ""

# 1. Installer les dépendances
echo "📦 Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'installation des dépendances"
  exit 1
fi
echo "✅ Dépendances installées"
echo ""

# 2. Créer la configuration
if [ ! -f config.json ]; then
  echo "📝 Création de config.json..."
  cp config.example.json config.json
  echo "✅ config.json créé (éditer les credentials si nécessaire)"
  echo ""
fi

# 3. Vérifier les variables d'environnement
echo "🔍 Configuration détectée:"
if [ -z "$API_URL" ]; then
  API_URL="http://localhost:8080/api"
fi
if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL="http://localhost:5173"
fi
echo "  API URL: $API_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# 4. Tester la connectivité API
echo "🔌 Test de connectivité API..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "0")

if [ "$API_HEALTH" == "200" ] || [ "$API_HEALTH" == "404" ]; then
  echo "✅ API joignable"
else
  echo "⚠️  API non joignable (HTTP $API_HEALTH)"
  echo "   Assurez-vous que le backend est démarré sur $API_URL"
fi
echo ""

# 5. Afficher les instructions
echo "📋 Prochaines étapes:"
echo ""
echo "1️⃣  Éditer la configuration (si nécessaire):"
echo "   nano config.json"
echo ""
echo "2️⃣  Exécuter les tests:"
echo "   npm test                  # Exécution standard"
echo "   npm run test:verbose      # Mode debug"
echo "   npm run test:watch        # Mode watch"
echo ""
echo "3️⃣  Consulter le rapport:"
echo "   npm run test:report       # Générer le rapport HTML"
echo "   open test-report.html     # Ouvrir dans le navigateur"
echo ""
echo "✨ Configuration complète!"
echo ""
