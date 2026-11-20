#!/usr/bin/env node

/**
 * E2E Test: Candidate ↔ Company Synchronization
 * 
 * Vérifie que le flux de bout en bout fonctionne correctement avec:
 * - Dépôt de candidature (candidat → entreprise)
 * - Synchronisation des données en temps réel
 * - Changements de statut (entreprise → candidat)
 * - Notifications et timeline
 * - Cas limites et edge cases
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config
const API_BASE = 'http://localhost:8080/api';
const TEST_RESULTS = [];
const VERBOSE = process.argv.includes('--verbose');

// Couleurs ANSI
const c = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
  error: (msg) => console.error(`${c.red}❌ ${msg}${c.reset}`),
  warn: (msg) => console.warn(`${c.yellow}⚠️  ${msg}${c.reset}`),
  section: (msg) => console.log(`\n${c.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}\n${c.reset}`),
  step: (num, msg) => console.log(`\n${c.bold}[ÉTAPE ${num}]${c.reset} ${msg}\n`),
  debug: (msg) => VERBOSE && console.log(`${c.gray}🔍 ${msg}${c.reset}`),
};

class APIClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      validateStatus: () => true // Ne pas thrower sur les erreurs HTTP
    });
  }

  setToken(token) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.Authorization;
  }

  async post(endpoint, data) {
    const response = await this.client.post(endpoint, data);
    return response;
  }

  async get(endpoint) {
    const response = await this.client.get(endpoint);
    return response;
  }

  async patch(endpoint, data) {
    const response = await this.client.patch(endpoint, data);
    return response;
  }

  async delete(endpoint) {
    const response = await this.client.delete(endpoint);
    return response;
  }
}

// Test result tracker
function recordTest(step, testName, passed, details = {}) {
  TEST_RESULTS.push({
    step,
    testName,
    passed,
    timestamp: new Date().toISOString(),
    details
  });

  const icon = passed ? `${c.green}✅${c.reset}` : `${c.red}❌${c.reset}`;
  console.log(`  ${icon} ${testName}`);
  if (!passed && details.reason) {
    console.log(`     Raison: ${details.reason}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log.section('🚀 TEST E2E: SYNCHRONISATION CANDIDAT ↔ ENTREPRISE');

  const candidateAPI = new APIClient(API_BASE);
  const companyAPI = new APIClient(API_BASE);

  let candidateToken = null;
  let companyToken = null;
  let candidateId = null;
  let companyId = null;
  let offerId = null;
  let applicationId = null;

  try {
    // ========================================================================
    // PRÉPARATION: Créer/Récupérer les comptes de test
    // ========================================================================

    log.step('PREP', 'Préparation des comptes de test');

    // Créer compte candidat
    log.info('Création compte candidat...');
    let candResponse = await candidateAPI.post('/auth/register', {
      email: `candidate-${Date.now()}@test.fr`,
      password: 'Test123!@#',
      userType: 'CANDIDATE',
      firstName: 'Jean',
      lastName: 'Dupont'
    });

    if (candResponse.status === 201 || candResponse.status === 200) {
      candidateToken = candResponse.data.accessToken;
      candidateAPI.setToken(candidateToken);
      log.success('Compte candidat créé avec token');
    } else {
      log.warn(`Création candidat: ${candResponse.status}. Tentative login...`);
    }

    // Créer compte entreprise
    log.info('Création compte entreprise...');
    let compResponse = await companyAPI.post('/auth/register', {
      email: `company-${Date.now()}@test.tn`,
      password: 'Test123!@#',
      userType: 'COMPANY',
      companyName: 'TestCorp Tunisia'
    });

    if (compResponse.status === 201 || compResponse.status === 200) {
      companyToken = compResponse.data.accessToken;
      companyAPI.setToken(companyToken);
      log.success('Compte entreprise créé avec token');
    } else {
      log.warn(`Création entreprise: ${compResponse.status}. Tentative login...`);
    }

    // ========================================================================
    // ÉTAPE 1: Dépôt de candidature (candidat → entreprise)
    // ========================================================================

    log.step(1, 'Dépôt de candidature (candidat → entreprise)');

    // Candidat: Complète son profil
    log.info('Candidat: Complète profil...');
    const profileUpdate = await candidateAPI.patch('/candidates/me', {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: candResponse.data.email || 'candidate@test.fr',
      phone: '+216 25 123 456',
      bio: 'Développeur passionné par React et Node.js',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      experience: 5,
      location: 'Tunis'
    });

    recordTest(1, 'Profil candidat complété', profileUpdate.status < 400);

    // Entreprise: Crée une offre
    log.info('Entreprise: Crée une offre...');
    const offerResponse = await companyAPI.post('/offers', {
      title: 'Développeur React Senior',
      description: 'Nous cherchons un développeur React expérimenté',
      requirements: 'Min 5 ans d\'expérience',
      salary: '3000-4500',
      location: 'Tunis',
      jobType: 'CDI',
      status: 'PUBLISHED'
    });

    if (offerResponse.status < 400 && offerResponse.data?.id) {
      offerId = offerResponse.data.id;
      recordTest(1, 'Offre créée et publiée', true, { offerId });
      log.success(`Offre créée: ${offerId}`);
    } else {
      recordTest(1, 'Offre créée et publiée', false, { reason: `Status ${offerResponse.status}` });
    }

    // Candidat: Postule à l'offre
    log.info('Candidat: Postule à l\'offre...');
    const applicationResponse = await candidateAPI.post(`/offers/${offerId}/apply`, {
      motivation: 'Très intéressé par ce poste et votre entreprise',
      coverLetter: 'Je maîtrise React depuis 6 ans...'
    });

    if (applicationResponse.status < 400 && applicationResponse.data?.id) {
      applicationId = applicationResponse.data.id;
      recordTest(1, 'Candidature POST envoyée (API réelle)', true, { 
        applicationId,
        httpStatus: applicationResponse.status 
      });
      log.success(`Candidature créée: ${applicationId}`);
    } else {
      recordTest(1, 'Candidature POST envoyée (API réelle)', false, { 
        reason: `HTTP ${applicationResponse.status}` 
      });
    }

    // Attendre sync
    await sleep(500);

    // Entreprise: Rafraîchit liste candidatures
    log.info('Entreprise: Récupère candidatures reçues...');
    const appListResponse = await companyAPI.get(`/offers/${offerId}/applications`);

    if (appListResponse.status < 400 && Array.isArray(appListResponse.data)) {
      const foundApp = appListResponse.data.find(a => a.id === applicationId);
      recordTest(1, 'Candidature visible côté entreprise (sync)', !!foundApp, {
        totalApplications: appListResponse.data.length,
        found: !!foundApp
      });
      
      if (foundApp) {
        log.success(`Candidature sync: candidat="${foundApp.candidateName}", statut="${foundApp.status}"`);
      }
    } else {
      recordTest(1, 'Candidature visible côté entreprise (sync)', false, { 
        reason: `HTTP ${appListResponse.status}` 
      });
    }

    // ========================================================================
    // ÉTAPE 2: Accès au dossier complet (règle métier)
    // ========================================================================

    log.step(2, 'Accès au dossier complet (règle métier)');

    if (applicationId) {
      const dossierResponse = await companyAPI.get(`/applications/${applicationId}`);
      
      if (dossierResponse.status < 400) {
        const dossier = dossierResponse.data;
        const hasCV = !!dossier.cvUrl;
        const hasSkills = Array.isArray(dossier.candidateSkills) && dossier.candidateSkills.length > 0;
        
        recordTest(2, 'Dossier complet accessible (CV visible)', hasCV, {
          cvPresent: hasCV
        });
        
        recordTest(2, 'Compétences visibles côté entreprise', hasSkills, {
          skillsCount: dossier.candidateSkills?.length || 0
        });
        
        if (hasCV && hasSkills) {
          log.success(`Dossier complet: ${dossier.candidateSkills.length} compétences, CV disponible`);
        }
      } else {
        recordTest(2, 'Dossier complet accessible', false, { 
          reason: `HTTP ${dossierResponse.status}` 
        });
      }
    }

    // ========================================================================
    // ÉTAPE 3: Changement de statut (entreprise → candidat)
    // ========================================================================

    log.step(3, 'Changement de statut (entreprise → candidat)');

    if (applicationId) {
      // Entreprise: Change le statut
      log.info('Entreprise: Change statut → EN_ENTRETIEN...');
      const statusChangeResponse = await companyAPI.patch(`/applications/${applicationId}/status`, {
        status: 'EN_ENTRETIEN',
        note: 'Candidate très intéressante, à convoquer'
      });

      recordTest(3, 'Changement statut PATCH envoyé', statusChangeResponse.status < 400, {
        httpStatus: statusChangeResponse.status,
        newStatus: 'EN_ENTRETIEN'
      });

      await sleep(500);

      // Candidat: Vérifie le changement
      log.info('Candidat: Vérifie le changement de statut...');
      const candidateViewResponse = await candidateAPI.get(`/applications/${applicationId}`);

      if (candidateViewResponse.status < 400) {
        const appData = candidateViewResponse.data;
        const statusMatches = appData.status === 'EN_ENTRETIEN';
        
        recordTest(3, 'Statut synchronisé côté candidat', statusMatches, {
          expectedStatus: 'EN_ENTRETIEN',
          actualStatus: appData.status
        });

        if (statusMatches) {
          log.success(`Statut sync: candidat voit "${appData.status}"`);
        }
      } else {
        recordTest(3, 'Statut synchronisé côté candidat', false, { 
          reason: `HTTP ${candidateViewResponse.status}` 
        });
      }
    }

    // ========================================================================
    // ÉTAPE 4: Rejet avec motif (entreprise → candidat)
    // ========================================================================

    log.step(4, 'Rejet avec motif (entreprise → candidat)');

    if (applicationId) {
      // Crée une 2e candidature pour tester le rejet
      const app2Response = await candidateAPI.post(`/offers/${offerId}/apply`, {
        motivation: 'Deuxième tentative'
      });

      let appToRejectId = app2Response.data?.id;
      if (!appToRejectId) appToRejectId = applicationId; // Fallback

      log.info('Entreprise: Rejette candidature avec motif...');
      const rejectResponse = await companyAPI.patch(`/applications/${appToRejectId}/status`, {
        status: 'REFUSE',
        rejectReason: 'Pas assez d\'expérience TypeScript'
      });

      recordTest(4, 'Rejet PATCH envoyé avec motif', rejectResponse.status < 400);

      await sleep(500);

      // Candidat: Vérifie le rejet et le motif
      const rejectedViewResponse = await candidateAPI.get(`/applications/${appToRejectId}`);

      if (rejectedViewResponse.status < 400) {
        const rejected = rejectedViewResponse.data;
        const hasRejectReason = !!rejected.rejectReason;
        
        recordTest(4, 'Motif de rejet visible côté candidat', hasRejectReason, {
          reason: rejected.rejectReason || 'N/A'
        });

        if (hasRejectReason) {
          log.success(`Rejet sync: motif="${rejected.rejectReason}"`);
        }
      }
    }

    // ========================================================================
    // ÉTAPE 5: Notifications (déclenchées par flux)
    // ========================================================================

    log.step(5, 'Notifications déclenchées par le flux');

    log.info('Candidat: Récupère notifications...');
    const notifResponse = await candidateAPI.get('/user-notifications/me');

    if (notifResponse.status < 400) {
      const notifs = Array.isArray(notifResponse.data) ? notifResponse.data : [];
      
      recordTest(5, 'Notifications créées pour changements', notifs.length > 0, {
        notificationCount: notifs.length
      });

      if (notifs.length > 0) {
        log.success(`Notifications trouvées: ${notifs.length}`);
        notifs.slice(0, 3).forEach((n, i) => {
          console.log(`  ${i + 1}. ${n.type}: ${n.message?.substring(0, 50)}...`);
        });
      }
    }

    // ========================================================================
    // ÉTAPE 6: Retrait de candidature (candidat → entreprise)
    // ========================================================================

    log.step(6, 'Retrait de candidature (candidat → entreprise)');

    if (applicationId) {
      log.info('Candidat: Retire candidature...');
      const withdrawResponse = await candidateAPI.delete(`/applications/${applicationId}`);

      recordTest(6, 'Retrait DELETE envoyé', withdrawResponse.status < 400);

      await sleep(500);

      // Entreprise: Vérifie disparition
      log.info('Entreprise: Vérifie disparition...');
      const appCheckResponse = await companyAPI.get(`/applications/${applicationId}`);

      if (appCheckResponse.status === 404 || appCheckResponse.data?.status === 'WITHDRAWN') {
        recordTest(6, 'Candidature disparue/marquée retirée côté entreprise', true);
      } else {
        recordTest(6, 'Candidature disparue/marquée retirée côté entreprise', false, {
          status: appCheckResponse.status
        });
      }
    }

    // ========================================================================
    // ÉTAPE 7: Cas limites
    // ========================================================================

    log.step(7, 'Cas limites & edge cases');

    // Test 7.1: Candidature dupliquée
    if (offerId) {
      log.info('Test: Candidature dupliquée (même candidat)...');
      
      // Première candidature
      const dup1 = await candidateAPI.post(`/offers/${offerId}/apply`, {
        motivation: 'Test doublon'
      });

      await sleep(200);

      // Deuxième candidature (même candidat, même offre)
      const dup2 = await candidateAPI.post(`/offers/${offerId}/apply`, {
        motivation: 'Test doublon 2'
      });

      if (dup1.status < 400 && dup2.status === 400) {
        recordTest(7, 'Candidature dupliquée bloquée (400 error)', true);
        log.success('Doublon: système bloque correctement');
      } else if (dup1.status < 400 && dup2.status < 400) {
        recordTest(7, 'Candidature dupliquée bloquée (400 error)', false, {
          reason: 'Doublon créé silencieusement'
        });
        log.warn('Doublon: créé sans warning');
      } else {
        recordTest(7, 'Candidature dupliquée bloquée (400 error)', false, {
          reason: `HTTP ${dup1.status}, ${dup2.status}`
        });
      }
    }

    // ========================================================================
    // RAPPORT FINAL
    // ========================================================================

    log.section('📊 RAPPORT FINAL DES TESTS');

    const totalTests = TEST_RESULTS.length;
    const passedTests = TEST_RESULTS.filter(t => t.passed).length;
    const failedTests = TEST_RESULTS.filter(t => !t.passed).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`\nTotal tests:    ${totalTests}`);
    console.log(`${c.green}✅ Réussis:      ${passedTests}${c.reset}`);
    console.log(`${c.red}❌ Échoués:      ${failedTests}${c.reset}`);
    console.log(`\nTaux de succès: ${successRate}%\n`);

    // Grouper par étape
    const byStep = {};
    TEST_RESULTS.forEach(r => {
      if (!byStep[r.step]) byStep[r.step] = [];
      byStep[r.step].push(r);
    });

    Object.keys(byStep).sort().forEach(step => {
      const stepTests = byStep[step];
      const stepPassed = stepTests.filter(t => t.passed).length;
      const stepTotal = stepTests.length;
      console.log(`Étape ${step}: ${stepPassed}/${stepTotal} ✅`);
    });

    // Sauvegarde rapport
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate
      },
      results: TEST_RESULTS,
      conclusion: successRate >= 80 ? '✅ Synchronisation fiable' : '⚠️  À investiguer'
    };

    const reportPath = path.join(__dirname, 'e2e-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Rapport JSON: e2e-sync-report.json`);
    console.log(`\n${c.green}${c.bold}✨ Tests E2E terminés${c.reset}`);

    return successRate >= 80;

  } catch (error) {
    log.error(`Erreur globale: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Exécution
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log.error(`Erreur fatale: ${error.message}`);
  process.exit(1);
});
