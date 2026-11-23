# Image d'analyse RHConnect : tous les outils de mesure, versions figées.
# Les mêmes versions doivent servir pour v0-baseline et v1-final (comparabilité).
FROM node:22.14.0-bookworm

ARG GITLEAKS_VERSION=8.21.2
ARG TRIVY_VERSION=0.75.0
ARG SONAR_SCANNER_VERSION=6.2.1.4610
ARG CK_VERSION=0.7.0
ARG LIGHTHOUSE_VERSION=12.2.1
ARG SERVE_VERSION=14.2.4

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openjdk-17-jdk-headless maven chromium git jq curl unzip ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Gitleaks (détection de secrets)
RUN curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    | tar -xz -C /usr/local/bin gitleaks

# Trivy (vulnérabilités des dépendances, secrets, mauvaises configurations)
RUN curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" \
    | tar -xz -C /usr/local/bin trivy

# SonarScanner CLI (métriques ISO 5055 via SonarQube)
RUN curl -fsSL -o /tmp/ss.zip "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}.zip" \
 && unzip -q /tmp/ss.zip -d /opt && mv /opt/sonar-scanner-* /opt/sonar-scanner && rm /tmp/ss.zip
ENV PATH="/opt/sonar-scanner/bin:${PATH}"

# CK (métriques orientées objet Chidamber & Kemerer : CBO, DIT, NOC, WMC, RFC, LCOM)
# Source : https://github.com/mauricioaniche/ck
RUN curl -fsSL -o /opt/ck.jar "https://repo1.maven.org/maven2/com/github/mauricioaniche/ck/${CK_VERSION}/ck-${CK_VERSION}-jar-with-dependencies.jar"

# Lighthouse (métriques web) + serveur statique pour le backoffice
RUN npm install -g "lighthouse@${LIGHTHOUSE_VERSION}" "serve@${SERVE_VERSION}"
ENV CHROME_PATH=/usr/bin/chromium \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

RUN git config --system --add safe.directory '*'

COPY run-analysis.sh summarize.js /opt/analyse/
WORKDIR /work
ENTRYPOINT ["bash", "/opt/analyse/run-analysis.sh"]
