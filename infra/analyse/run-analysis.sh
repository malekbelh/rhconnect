#!/usr/bin/env bash
# Exécute toutes les mesures de qualité sur une révision Git donnée (REF)
# et exporte les rapports dans OUT_DIR. Exécuté dans le conteneur "analyse".
set -uo pipefail

REF="${REF:-v0-baseline}"
OUT="/repo/${OUT_DIR:-docs/mesures/v0}"
SRC=/work/src
SONAR_URL="${SONAR_HOST_URL:-http://sonarqube:9000}"
PROJECT=rhconnect
FAILED=()

log()  { echo -e "\n\033[1;34m==> $*\033[0m"; }
step() { local name="$1"; shift; log "$name"; if ! "$@"; then echo "!! Échec : $name"; FAILED+=("$name"); return 1; fi; }

# ---------------------------------------------------------------------------
prepare() {
  rm -rf "$SRC" && mkdir -p "$SRC" "$OUT"
  git -C /repo archive "$REF" | tar -x -C "$SRC"
  jq -n --arg ref "$REF" \
        --arg commit "$(git -C /repo rev-parse "$REF^{commit}")" \
        --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg sonarqube "10.7.0-community" \
        --arg scanner "$(sonar-scanner --version 2>/dev/null | grep -o 'SonarScanner CLI [0-9.]*' | head -1)" \
        --arg ck "0.7.0" --arg gitleaks "$(gitleaks version)" \
        --arg trivy "$(trivy --version | head -1)" --arg lighthouse "$(lighthouse --version)" \
        --arg java "$(java -version 2>&1 | head -1)" --arg node "$(node -v)" \
        '{ref:$ref, commit:$commit, date:$date, outils:{sonarqube:$sonarqube, scanner:$scanner, ck:$ck, gitleaks:$gitleaks, trivy:$trivy, lighthouse:$lighthouse, java:$java, node:$node}}' \
        > "$OUT/meta.json"
  cat "$OUT/meta.json"
}

# --- 1. Build backend + tests + couverture JaCoCo ---------------------------
# Commande identique pour v0 et v1 : si les tests sont désactivés dans le pom,
# ils ne s'exécutent pas et la couverture reste nulle (c'est une mesure).
build_backend() {
  ( cd "$SRC/backend" && mvn -B -ntp \
      org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent \
      verify \
      org.jacoco:jacoco-maven-plugin:0.8.12:report \
      dependency:copy-dependencies -DincludeScope=compile -DoutputDirectory=target/dependency \
    ) > "$OUT/maven-build.log" 2>&1
  local rc=$?
  grep -E "Tests run:|BUILD|Tests are skipped" "$OUT/maven-build.log" | tail -5
  mkdir -p "$OUT/jacoco"
  if [ -f "$SRC/backend/target/site/jacoco/jacoco.xml" ]; then
    cp "$SRC/backend/target/site/jacoco/jacoco.xml" "$SRC/backend/target/site/jacoco/jacoco.csv" "$OUT/jacoco/"
  else
    echo "Aucun rapport JaCoCo (aucun test exécuté)" | tee "$OUT/jacoco/ABSENT.txt"
  fi
  return $rc
}

# --- 2. SonarQube : métriques ISO 5055 ---------------------------------------
sonar_api() { curl -fsS -u "$SONAR_TOKEN:" "$SONAR_URL/api/$1"; }

sonar() {
  # Instance éphémère : mot de passe admin aléatoire, jamais stocké.
  local pass; pass="A1!$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)"
  curl -fsS -u admin:admin -X POST "$SONAR_URL/api/users/change_password" \
       -d "login=admin&previousPassword=admin&password=$pass" || true
  SONAR_TOKEN=$(curl -fsS -u "admin:$pass" -X POST "$SONAR_URL/api/user_tokens/generate" \
       -d "name=analyse-$(date +%s)" | jq -r .token) || return 1
  export SONAR_TOKEN

  ( cd "$SRC" && sonar-scanner \
      -Dsonar.host.url="$SONAR_URL" -Dsonar.token="$SONAR_TOKEN" \
      -Dsonar.projectKey=$PROJECT -Dsonar.projectName=RHConnect -Dsonar.projectVersion="$REF" \
      -Dsonar.sources=backend/src/main/java,frontend-public/src,backoffice-admin/src \
      -Dsonar.tests=backend/src/test/java \
      -Dsonar.java.source=17 \
      -Dsonar.java.binaries=backend/target/classes \
      -Dsonar.java.test.binaries=backend/target/test-classes \
      -Dsonar.java.libraries="backend/target/dependency/*.jar" \
      -Dsonar.coverage.jacoco.xmlReportPaths=backend/target/site/jacoco/jacoco.xml \
      -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/*.spec.ts" \
      -Dsonar.qualitygate.wait=true -Dsonar.qualitygate.timeout=600 \
    ) > "$OUT/sonar-scanner.log" 2>&1
  # Le Quality Gate par défaut peut échouer à v0 : ce n'est pas une erreur de mesure.
  grep -E "ANALYSIS SUCCESSFUL|QUALITY GATE|EXECUTION" "$OUT/sonar-scanner.log" | tail -3

  local d="$OUT/sonarqube"; mkdir -p "$d"
  local metrics="ncloc,lines,files,classes,functions,statements,complexity,cognitive_complexity,\
bugs,reliability_rating,reliability_remediation_effort,vulnerabilities,security_rating,security_hotspots,\
security_review_rating,code_smells,sqale_index,sqale_debt_ratio,sqale_rating,duplicated_lines_density,\
duplicated_lines,duplicated_blocks,coverage,line_coverage,tests,violations,blocker_violations,\
critical_violations,major_violations,minor_violations,info_violations,comment_lines_density"
  sonar_api "measures/component?component=$PROJECT&metricKeys=$metrics" > "$d/mesures.json"
  sonar_api "qualitygates/project_status?projectKey=$PROJECT" > "$d/quality-gate-defaut.json"
  sonar_api "issues/search?componentKeys=$PROJECT&ps=1&facets=rules,severities,types,languages,directories" > "$d/issues-facettes.json"
  sonar_api "hotspots/search?projectKey=$PROJECT&ps=500" > "$d/hotspots.json"

  # Toutes les issues (pagination, limite API 10 000)
  local p=1 total; echo '[]' > "$d/issues.json"
  while :; do
    sonar_api "issues/search?componentKeys=$PROJECT&ps=500&p=$p" > /tmp/page.json || break
    jq -s '.[0] + .[1].issues' "$d/issues.json" /tmp/page.json > /tmp/acc.json && mv /tmp/acc.json "$d/issues.json"
    total=$(jq .total /tmp/page.json)
    [ $((p * 500)) -ge "$total" ] || [ $p -ge 20 ] && break
    p=$((p + 1))
  done

  # Mesures par fichier (points chauds de dette technique)
  p=1; echo '[]' > "$d/fichiers.json"
  while :; do
    sonar_api "measures/component_tree?component=$PROJECT&qualifiers=FIL&ps=500&p=$p&metricKeys=ncloc,complexity,cognitive_complexity,code_smells,bugs,vulnerabilities,sqale_index,duplicated_lines_density,coverage" > /tmp/page.json || break
    jq -s '.[0] + .[1].components' "$d/fichiers.json" /tmp/page.json > /tmp/acc.json && mv /tmp/acc.json "$d/fichiers.json"
    total=$(jq .paging.total /tmp/page.json)
    [ $((p * 500)) -ge "$total" ] && break
    p=$((p + 1))
  done
  jq length "$d/issues.json" "$d/fichiers.json"
}

# --- 3. CK : métriques orientées objet ---------------------------------------
ck_metrics() {
  mkdir -p "$OUT/ck"
  # Arguments : <source> <useJars=false> <maxFiles=0> <variablesAndFields=false> <sortie>
  ( cd "$OUT/ck" && java -jar /opt/ck.jar "$SRC/backend/src/main/java" false 0 false "$OUT/ck/" ) > /tmp/ck.log 2>&1
  ls "$OUT/ck"
  [ -s "$OUT/ck/class.csv" ]
}

# --- 4. Sécurité : Gitleaks, Trivy, npm audit --------------------------------
security() {
  mkdir -p "$OUT/securite"
  # Historique Git jusqu'à REF
  gitleaks detect --source /repo --log-opts="$REF" --redact \
      --report-format json --report-path "$OUT/securite/gitleaks-historique.json" --exit-code 0
  # Contenu de l'arborescence à REF
  gitleaks detect --no-git --source "$SRC" --redact \
      --report-format json --report-path "$OUT/securite/gitleaks-arborescence.json" --exit-code 0
  trivy fs --quiet --scanners vuln,secret,misconfig --format json \
      --output "$OUT/securite/trivy-fs.json" "$SRC"
  trivy convert --format table --output "$OUT/securite/trivy-fs.txt" "$OUT/securite/trivy-fs.json"
  for p in backend frontend-public backoffice-admin test-automation; do
    [ -f "$SRC/$p/package-lock.json" ] || continue
    ( cd "$SRC/$p" && npm audit --package-lock-only --json > "$OUT/securite/npm-audit-$p.json" ) || true
  done
}

# --- 5. Lighthouse : métriques web (application démarrée) --------------------
start_apps() {
  export JWT_SECRET; JWT_SECRET=$(head -c 48 /dev/urandom | base64 -w0)
  ( cd "$SRC/backend" && nohup java -jar target/rhconnect-backend-*.jar \
        --spring.data.mongodb.uri="$MONGO_URI" > "$OUT/backend-run.log" 2>&1 & )
  # Le résultat de "npm run build" (tsc + vite) est lui-même une mesure. S'il échoue,
  # on construit sans vérification de types (vite build) pour pouvoir mesurer Lighthouse.
  ( cd "$SRC/frontend-public" && npm ci --no-audit --no-fund \
      && { if npm run build; then echo OK > "$OUT/frontend-public-build.status"; \
           else echo ECHEC > "$OUT/frontend-public-build.status"; npx vite build; fi; } \
      && (nohup npx vite preview --port 5173 --strictPort --host 127.0.0.1 > /tmp/front.log 2>&1 &) ) > "$OUT/frontend-public-build.log" 2>&1
  ( cd "$SRC/backoffice-admin" && npm ci --no-audit --no-fund && npx ng build \
        && (nohup serve -s dist/backoffice-admin/browser -l 4200 > /tmp/bo.log 2>&1 &) ) > "$OUT/backoffice-build.log" 2>&1
  for i in $(seq 1 90); do
    curl -fs -o /dev/null http://localhost:8080/v3/api-docs \
      && curl -fs -o /dev/null http://localhost:5173/ \
      && curl -fs -o /dev/null http://localhost:4200/ && return 0
    sleep 2
  done
  echo "Applications non démarrées"; tail -20 "$OUT/backend-run.log"; return 1
}

lighthouse_runs() {
  mkdir -p "$OUT/lighthouse"
  # Pages publiques (sans authentification), 3 passages chacune, preset desktop.
  local pages="public-accueil=http://localhost:5173/ public-connexion=http://localhost:5173/auth/login public-inscription=http://localhost:5173/auth/register admin-connexion=http://localhost:4200/login"
  for entry in $pages; do
    local name="${entry%%=*}" url="${entry#*=}"
    for run in 1 2 3; do
      lighthouse "$url" --quiet --preset=desktop \
        --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
        --output=json --output=html --output-path="$OUT/lighthouse/${name}-run${run}" || return 1
    done
  done
}

# ---------------------------------------------------------------------------
step "Préparation de $REF"            prepare
step "Build backend + tests + JaCoCo" build_backend
step "SonarQube (ISO 5055)"           sonar
step "CK (métriques OO)"              ck_metrics
step "Sécurité (Gitleaks, Trivy, npm audit)" security
step "Démarrage des applications"     start_apps && step "Lighthouse" lighthouse_runs
step "Synthèse"                       node /opt/analyse/summarize.js "$OUT"

log "Rapports dans ${OUT#/repo/}"
if [ ${#FAILED[@]} -gt 0 ]; then printf 'Étapes en échec : %s\n' "${FAILED[@]}"; exit 1; fi
