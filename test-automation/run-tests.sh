#!/bin/bash

# Script pratique pour exécuter les tests avec options
# Usage: ./run-tests.sh [options]

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
VERBOSE=""
WATCH=""
REPORT=""
CONFIG="config.json"

while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE="--verbose"
      shift
      ;;
    -w|--watch)
      WATCH="true"
      shift
      ;;
    -r|--report)
      REPORT="true"
      shift
      ;;
    -c|--config)
      CONFIG="$2"
      shift 2
      ;;
    -h|--help)
      echo "Exécuteur de Tests E2E - RHConnect"
      echo ""
      echo "Usage: ./run-tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose      Mode debug (logs détaillés)"
      echo "  -w, --watch        Re-exécute à chaque changement"
      echo "  -r, --report       Génère et ouvre le rapport HTML"
      echo "  -c, --config FILE  Config à utiliser (défaut: config.json)"
      echo "  -h, --help         Affiche cette aide"
      echo ""
      echo "Exemples:"
      echo "  ./run-tests.sh                    # Exécution standard"
      echo "  ./run-tests.sh -v                 # Mode verbose"
      echo "  ./run-tests.sh -r                 # Avec rapport HTML"
      echo "  ./run-tests.sh -v -r              # Verbose + Rapport"
      exit 0
      ;;
    *)
      echo "Option inconnue: $1"
      ./run-tests.sh --help
      exit 1
      ;;
  esac
done

# Vérifier la config
if [ ! -f "$CONFIG" ]; then
  echo -e "${RED}❌ Fichier config non trouvé: $CONFIG${NC}"
  echo ""
  echo "Créer une config:"
  echo "  cp config.example.json $CONFIG"
  echo "  nano $CONFIG"
  exit 1
fi

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation${NC}"
    exit 1
  fi
fi

# Afficher la configuration
echo -e "${BLUE}🧪 Tests End-to-End - RHConnect${NC}"
echo ""
echo "Configuration:"
echo "  Config file: $CONFIG"
if [ ! -z "$VERBOSE" ]; then
  echo "  Mode: VERBOSE (logs détaillés)"
fi
if [ ! -z "$WATCH" ]; then
  echo "  Mode: WATCH (re-exécution automatique)"
fi
echo ""

# Exécuter les tests
if [ ! -z "$WATCH" ]; then
  echo -e "${YELLOW}▶️  Exécution en mode WATCH...${NC}"
  npm run test:watch -- $VERBOSE
else
  echo -e "${YELLOW}▶️  Exécution des tests...${NC}"
  
  if [ ! -z "$VERBOSE" ]; then
    npm run test:verbose
  else
    npm test
  fi
fi

TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}✅ Tests terminés avec succès${NC}"
else
  echo -e "${RED}❌ Tests échoués (code: $TEST_RESULT)${NC}"
fi

# Générer le rapport si demandé
if [ ! -z "$REPORT" ]; then
  echo ""
  echo -e "${YELLOW}📊 Génération du rapport HTML...${NC}"
  npm run test:report
  
  # Ouvrir le rapport
  if command -v open &> /dev/null; then
    open test-report.html
  elif command -v xdg-open &> /dev/null; then
    xdg-open test-report.html
  else
    echo -e "${YELLOW}📄 Rapport généré: test-report.html${NC}"
  fi
fi

exit $TEST_RESULT
