#!/usr/bin/env node

/**
 * E2E Test: Create & Edit Offers
 * Vérifie que la création et modification d'offres fonctionnent correctement
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:8080/api';
const VERBOSE = process.argv.includes('--verbose');

const c = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
  error: (msg) => console.error(`${c.red}❌ ${msg}${c.reset}`),
  section: (msg) => console.log(`\n${c.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}\n${c.reset}`),
};

class APIClient {
  constructor(baseURL) {
    this.client = axios.create({ baseURL, timeout: 10000, validateStatus: () => true });
  }

  setToken(token) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  async post(endpoint, data) {
    return this.client.post(endpoint, data);
  }

  async get(endpoint) {
    return this.client.get(endpoint);
  }

  async patch(endpoint, data) {
    return this.client.patch(endpoint, data);
  }
}

async function testCRUD() {
  log.section('🧪 TEST E2E: CRÉATION & MODIFICATION D\'OFFRES');

  const api = new APIClient(API_BASE);
  const tests = { passed: 0, failed: 0 };
  let companyToken = null;
  let offerId = null;

  try {
    // ========================================================================
    // PRÉPARATION: Login ou Register
    // ========================================================================

    log.info('Étape 1: Connexion/Création compte entreprise...');

    const loginResp = await api.post('/auth/login', {
      email: 'test-company@test.tn',
      password: 'Test123!@#',
    });

    if (loginResp.status === 200 && loginResp.data?.accessToken) {
      companyToken = loginResp.data.accessToken;
      api.setToken(companyToken);
      log.success('Login réussi - Token obtenu');
      tests.passed++;
    } else {
      log.error(`Login échoué: ${loginResp.status}`);
      // Essayer register
      const regResp = await api.post('/auth/register', {
        email: `company-${Date.now()}@test.tn`,
        password: 'Test123!@#',
        userType: 'COMPANY',
        companyName: 'Test Company',
      });

      if (regResp.status < 400 && regResp.data?.accessToken) {
        companyToken = regResp.data.accessToken;
        api.setToken(companyToken);
        log.success('Register réussi - Token obtenu');
        tests.passed++;
      } else {
        log.error(`Register échoué: ${regResp.status}`);
        tests.failed++;
      }
    }

    if (!companyToken) {
      log.error('Pas de token - arrêt des tests');
      return;
    }

    // ========================================================================
    // TEST 1: CRÉER UNE OFFRE
    // ========================================================================

    log.info('\nTest 1: Création d\'offre (POST /api/offers)');

    const createResp = await api.post('/offers', {
      title: 'Développeur React Test',
      description: 'Nous cherchons un développeur React expérimenté pour rejoindre notre équipe',
      requirements: 'React, TypeScript, Node.js, 5+ ans d\'expérience',
      salary: '3000-4500',
      location: 'Tunis',
      jobType: 'CDI',
      seniority: 'Senior',
      status: 'PUBLISHED',
    });

    if (createResp.status === 201 || createResp.status === 200) {
      offerId = createResp.data?.id;
      log.success(`✅ Offre créée (ID: ${offerId})`);
      log.info(`   Status HTTP: ${createResp.status}`);
      log.info(`   Title: ${createResp.data?.title}`);
      log.info(`   Status: ${createResp.data?.status}`);
      tests.passed++;
    } else {
      log.error(`❌ Création échouée: ${createResp.status}`);
      log.info(`Response:`, JSON.stringify(createResp.data, null, 2));
      tests.failed++;
    }

    if (!offerId) {
      log.error('Pas d\'ID d\'offre - impossible de continuer');
      return;
    }

    // ========================================================================
    // TEST 2: RÉCUPÉRER L'OFFRE CRÉÉE
    // ========================================================================

    log.info('\nTest 2: Récupération de l\'offre (GET /api/offers/:id)');

    const getResp = await api.get(`/offers/${offerId}`);

    if (getResp.status === 200) {
      const offer = getResp.data;
      log.success(`✅ Offre récupérée`);
      log.info(`   Title: ${offer.title}`);
      log.info(`   Status: ${offer.status}`);
      log.info(`   Location: ${offer.location}`);
      
      // Vérifier que les données correspondent
      if (offer.title === 'Développeur React Test' && offer.status === 'PUBLISHED') {
        log.success('   ✅ Données cohérentes');
        tests.passed++;
      } else {
        log.error('   ❌ Données incohérentes');
        tests.failed++;
      }
    } else {
      log.error(`❌ Récupération échouée: ${getResp.status}`);
      tests.failed++;
    }

    // ========================================================================
    // TEST 3: MODIFIER L'OFFRE
    // ========================================================================

    log.info('\nTest 3: Modification d\'offre (PATCH /api/offers/:id)');

    const updateResp = await api.patch(`/offers/${offerId}`, {
      title: 'Développeur React Senior - MODIFIÉ',
      description: 'Offre modifiée - Description mise à jour',
      salary: '4000-5500',
      status: 'PUBLISHED',
    });

    if (updateResp.status === 200 || updateResp.status === 204) {
      log.success(`✅ Offre modifiée`);
      log.info(`   Status HTTP: ${updateResp.status}`);
      tests.passed++;
    } else {
      log.error(`❌ Modification échouée: ${updateResp.status}`);
      log.info(`Response:`, JSON.stringify(updateResp.data, null, 2));
      tests.failed++;
    }

    // ========================================================================
    // TEST 4: VÉRIFIER LES MODIFICATIONS
    // ========================================================================

    log.info('\nTest 4: Vérification des modifications (GET /api/offers/:id)');

    const checkResp = await api.get(`/offers/${offerId}`);

    if (checkResp.status === 200) {
      const offer = checkResp.data;
      log.success(`✅ Offre récupérée après modification`);
      log.info(`   Title: ${offer.title}`);
      log.info(`   Salary: ${offer.salary}`);
      
      // Vérifier que les modifications ont été appliquées
      if (offer.title.includes('MODIFIÉ') && offer.salary === '4000-5500') {
        log.success('   ✅ Modifications appliquées correctement');
        tests.passed++;
      } else {
        log.error('   ❌ Modifications non appliquées');
        log.error(`      Title: "${offer.title}" (attendu: contenant "MODIFIÉ")`);
        log.error(`      Salary: "${offer.salary}" (attendu: "4000-5500")`);
        tests.failed++;
      }
    } else {
      log.error(`❌ Vérification échouée: ${checkResp.status}`);
      tests.failed++;
    }

    // ========================================================================
    // TEST 5: LISTER LES OFFRES
    // ========================================================================

    log.info('\nTest 5: Liste des offres (GET /api/offers)');

    const listResp = await api.get('/offers');

    if (listResp.status === 200 && Array.isArray(listResp.data)) {
      const offers = listResp.data;
      log.success(`✅ Liste des offres récupérée`);
      log.info(`   Total offres: ${offers.length}`);
      
      // Vérifier que notre offre est dans la liste
      const found = offers.find(o => o.id === offerId);
      if (found) {
        log.success(`   ✅ Notre offre trouvée dans la liste`);
        tests.passed++;
      } else {
        log.error(`   ❌ Notre offre NOT trouvée dans la liste`);
        tests.failed++;
      }
    } else {
      log.error(`❌ Récupération liste échouée: ${listResp.status}`);
      tests.failed++;
    }

    // ========================================================================
    // TEST 6: CLÔTURER L'OFFRE
    // ========================================================================

    log.info('\nTest 6: Clôture d\'offre (PATCH /api/offers/:id - status CLOSED)');

    const closeResp = await api.patch(`/offers/${offerId}`, {
      status: 'CLOSED',
    });

    if (closeResp.status === 200 || closeResp.status === 204) {
      log.success(`✅ Offre clôturée`);
      
      // Vérifier que le statut a changé
      const verifyResp = await api.get(`/offers/${offerId}`);
      if (verifyResp.status === 200 && verifyResp.data?.status === 'CLOSED') {
        log.success('   ✅ Status = CLOSED confirmé');
        tests.passed++;
      } else {
        log.error('   ❌ Status n\'a pas changé à CLOSED');
        tests.failed++;
      }
    } else {
      log.error(`❌ Clôture échouée: ${closeResp.status}`);
      tests.failed++;
    }

    // ========================================================================
    // RAPPORT FINAL
    // ========================================================================

    log.section('📊 RÉSUMÉ DES TESTS');

    const totalTests = tests.passed + tests.failed;
    const successRate = Math.round((tests.passed / totalTests) * 100);

    console.log(`Total:    ${totalTests} tests`);
    console.log(`${c.green}✅ Réussis:   ${tests.passed}${c.reset}`);
    console.log(`${c.red}❌ Échoués:    ${tests.failed}${c.reset}`);
    console.log(`\nTaux de succès: ${successRate}%\n`);

    if (successRate >= 80) {
      log.success(`✨ CRÉATION & MODIFICATION: OPÉRATIONNELLES`);
    } else if (successRate >= 50) {
      log.error(`⚠️  CRÉATION & MODIFICATION: À INVESTIGUER`);
    } else {
      log.error(`🔴 CRÉATION & MODIFICATION: CASSÉES`);
    }

    // Sauvegarde rapport
    const report = {
      timestamp: new Date().toISOString(),
      summary: { totalTests, passed: tests.passed, failed: tests.failed, successRate },
      offerId,
    };
    fs.writeFileSync('e2e-offers-crud-report.json', JSON.stringify(report, null, 2));
    log.info(`\nRapport JSON: e2e-offers-crud-report.json`);

  } catch (error) {
    log.error(`Erreur globale: ${error.message}`);
  }
}

testCRUD();
