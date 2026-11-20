# Script de Setup pour les Tests E2E (PowerShell)
# Usage: .\setup.ps1

Write-Host "🚀 Setup des Tests End-to-End RHConnect" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Installer les dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Dépendances installées" -ForegroundColor Green
Write-Host ""

# 2. Créer la configuration
if (-not (Test-Path "config.json")) {
  Write-Host "📝 Création de config.json..." -ForegroundColor Yellow
  Copy-Item config.example.json config.json
  Write-Host "✅ config.json créé (éditer les credentials si nécessaire)" -ForegroundColor Green
  Write-Host ""
}

# 3. Vérifier les variables d'environnement
Write-Host "🔍 Configuration détectée:" -ForegroundColor Yellow
$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:8080/api" }
$FRONTEND_URL = if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { "http://localhost:5173" }
Write-Host "  API URL: $API_URL"
Write-Host "  Frontend URL: $FRONTEND_URL"
Write-Host ""

# 4. Tester la connectivité API
Write-Host "🔌 Test de connectivité API..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$API_URL/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
  Write-Host "✅ API joignable" -ForegroundColor Green
} catch {
  Write-Host "⚠️  API non joignable" -ForegroundColor Yellow
  Write-Host "   Assurez-vous que le backend est démarré sur $API_URL"
}
Write-Host ""

# 5. Afficher les instructions
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Éditer la configuration (si nécessaire):" -ForegroundColor White
Write-Host "   notepad config.json" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Exécuter les tests:" -ForegroundColor White
Write-Host "   npm test                  # Exécution standard" -ForegroundColor Gray
Write-Host "   npm run test:verbose      # Mode debug" -ForegroundColor Gray
Write-Host "   npm run test:watch        # Mode watch" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Consulter le rapport:" -ForegroundColor White
Write-Host "   npm run test:report       # Générer le rapport HTML" -ForegroundColor Gray
Write-Host "   start test-report.html    # Ouvrir dans le navigateur" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ Configuration complète!" -ForegroundColor Green
Write-Host ""
