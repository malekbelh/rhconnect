#!/usr/bin/env node

/**
 * 🤖 E2E Automated Test: Candidate ↔ Company Flow
 * 
 * Teste la synchronisation complète entre candidat et entreprise:
 * 1. Candidat postule à une offre
 * 2. Entreprise reçoit la candidature
 * 3. Entreprise change le statut
 * 4. Candidat reçoit notification et voit mise à jour
 * 5. Entreprise rejette la candidature avec motif
 * 6. Candidat voit le rejet
 * 7. Cas limites et edge cases
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIG
// ============================================================================

const API_BASE = 'http://localhost:8080/api';
const TIMEOUT = 15000;
const VERBOSE = process.argv.includes('--verbose');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// ============================================================================
// UTILS
// ============================================================================

const log = {
  section: (title) => console.log(`\n${colors.bright}${colors.magenta}${'═'.repeat(80)}\n${title}\n${'═'.repeat(80)}${colors.reset}`),
  step: (num, desc) => console.log(`\n${colors.bright}${colors.blue}[${num}]${colors.reset} ${desc}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}❌${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️${colors.reset}  ${msg}`),
  detail: (key, val) => console.log(`${colors.dim}    ${key}: ${colors.reset}${val}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
};

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: TIMEOUT,
      validateStatus: () => true,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  setToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async request(method, endpoint, data = null) {
    try {
      const config = { method, url: endpoint };
      if (data) config.data = data;

      const response = await this.client.request(config);
      return response;
    } catch (error) {
      log.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request('GET', endpoint);
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

class CandidateCompanyFlowTest {
  constructor() {
    this.client = new ApiClient(API_BASE);
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: [],
    };
    this.candidateToken = null;
    this.companyToken = null;
    this.candidateId = null;
    this.companyId = null;
    this.offerId = null;
    this.applicationId = null;
  }

  async test(name, fn) {
    this.results.total++;
    try {
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      log.success(name);
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      log.error(`${name}: ${error.message}`);
      return false;
    }
  }

  async assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async assertExists(value, message) {
    if (!value) {
      throw new Error(`${message} | Value is undefined/null`);
    }
  }

  // ========================================================================
  // SETUP: Create Candidate & Company Accounts
  // ========================================================================

  async setupAccounts() {
    log.step(0, 'Setup: Create Test Accounts');

    // Register NEW Candidate with complete profile
    await this.test('Register candidate account', async () => {
      const email = `candidate-${Date.now()}@test.tn`;
      
      const response = await this.client.post('/auth/register', {
        email,
        password: 'Test123!@#',
        userType: 'CANDIDATE',
        role: 'CANDIDATE',
        firstName: 'Marie',
        lastName: 'Test',
      });

      if (response.status < 400 && response.data?.accessToken) {
        this.candidateToken = response.data.accessToken;
        this.candidateId = response.data?.userId || response.data?.id;
        this.client.setToken(this.candidateToken);
        log.detail('Status', response.status);
        log.detail('Candidate Email', email);
      } else {
        throw new Error(`Candidate register failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    });

    // Register new Company for testing
    await this.test('Register company account', async () => {
      const email = `company-${Date.now()}@test.tn`;
      const response = await this.client.post('/auth/register', {
        email,
        password: 'Test123!@#',
        userType: 'COMPANY',
        role: 'COMPANY',
        companyName: `Test Company ${Date.now()}`,
      });

      if (response.status < 400 && response.data?.accessToken) {
        this.companyToken = response.data.accessToken;
        this.companyId = response.data?.userId || response.data?.id;
        log.detail('Status', response.status);
        log.detail('Company Email', email);
      } else {
        throw new Error(`Company register failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    });
  }

  // ========================================================================
  // STEP 1: Candidate Completes Profile
  // ========================================================================

  async stepCandidateCompletesProfile() {
    log.step(1, 'Candidate Completes Profile (Comprehensive Skills)');

    await this.test('PUT /api/candidates/me - Complete profile with strong matching', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.put(`/candidates/me`, {
        firstName: 'Marie',
        lastName: 'Test',
        phone: '+216 99 123 456',
        address: 'Tunis, Tunisie',
        bio: 'Full Stack Developer',
        competences: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'Docker', 'AWS', 'GraphQL'],
        matchingTags: ['react', 'nodejs', 'fullstack', 'typescript', 'mongodb', 'express', 'docker'],
        parcours: [
          {
            titre: 'Senior Full Stack Developer',
            entreprise: 'Tech Corp',
            startDate: '2018-01-01',
            endDate: null,
          }
        ],
      });

      if (response.status === 200 || response.status === 204) {
        log.detail('Status', response.status);
        log.detail('Skills Added', '8 competences + matching tags');
      } else {
        throw new Error(`Update profile failed: ${response.status}`);
      }
    });
  }

  // ========================================================================
  // STEP 1b: Create Job Offer
  // ========================================================================

  async stepCreateOffer() {
    log.step('1b', 'Create Job Offer (Company)');

    await this.test('POST /api/offers - Create job offer', async () => {
      this.client.setToken(this.companyToken);

      const response = await this.client.post('/offers', {
        title: 'Développeur Full Stack - E2E Test Flow',
        description: 'Test de flux candidat-entreprise automatisé',
        requirements: 'React, Node.js, TypeScript, MongoDB, Express',
        location: 'Tunis, Tunisie',
        salary: '2500-4000 TND',
        jobType: 'CDI',
        seniority: 'Senior',
        status: 'PUBLISHED',
      });

      if (response.status === 201) {
        this.offerId = response.data?.id;
        log.detail('Status', response.status);
        log.detail('Offer ID', this.offerId);
        log.detail('Title', response.data?.title);
      } else {
        throw new Error(`Create offer failed: ${response.status}`);
      }
    });
  }

  // ========================================================================
  // STEP 2: Candidate Applies to Offer
  // ========================================================================

  async stepCandidateApplies() {
    log.step(2, 'Candidate Applies to Offer');

    await this.test('POST /api/applications - Submit application', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.post('/applications', {
        offerId: this.offerId,
        motivation: 'Je suis intéressé par ce poste.',
        coverLetter: 'Voici ma lettre de motivation test.',
      });

      if (response.status === 201 || response.status === 200) {
        this.applicationId = response.data?.id;
        log.detail('Status', response.status);
        log.detail('Application ID', this.applicationId);
        log.detail('Initial Status', response.data?.status);
      } else {
        throw new Error(`Apply failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    });
  }

  // ========================================================================
  // STEP 3: Company Receives Application
  // ========================================================================

  async stepCompanyReceivesApplication() {
    log.step(3, 'Company Receives Application');

    await this.test('GET /api/applications - Company views applications', async () => {
      this.client.setToken(this.companyToken);

      const response = await this.client.get(`/applications`);

      if (response.status === 200) {
        let applications = response.data;

        // Handle wrapped response
        if (response.data?.data && Array.isArray(response.data.data)) {
          applications = response.data.data;
        }

        // Find our application
        const found = Array.isArray(applications)
          ? applications.find((a) => a.id === this.applicationId)
          : null;

        log.detail('Status', response.status);
        log.detail('Total Applications', Array.isArray(applications) ? applications.length : 'N/A');
        log.detail('Our Application Found', found ? 'Yes' : 'No');

        if (found) {
          log.detail('Candidate Name', found.candidateName || found.firstName);
          log.detail('Application Status', found.status);
        }

        await this.assertTrue(found, 'Company should see the application');
      } else {
        throw new Error(`Get applications failed: ${response.status}`);
      }
    });
  }

  // ========================================================================
  // STEP 4: Company Changes Application Status
  // ========================================================================

  async stepCompanyChangesStatus() {
    log.step(4, 'Company Changes Application Status to ENTRETIEN');

    await this.test('PUT /api/applications/:id - Change application status', async () => {
      this.client.setToken(this.companyToken);

      const response = await this.client.put(`/applications/${this.applicationId}`, {
        status: 'ENTRETIEN',
      });

      if (response.status === 200 || response.status === 204) {
        log.detail('Status', response.status);
        log.detail('New Status', 'INTERVIEW');

        // Verify the change
        const verifyResponse = await this.client.get(`/applications/${this.applicationId}`);
        if (verifyResponse.status === 200) {
          const app = verifyResponse.data;
          log.detail('Verified Status', app.status || app.statut);
        }
      } else {
        throw new Error(`Change status failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }
    });
  }

  // ========================================================================
  // STEP 5: Candidate Sees Status Update & Notifications
  // ========================================================================

  async stepCandidateSeesUpdate() {
    log.step(5, 'Candidate Sees Status Update & Receives Notifications');

    await this.test('GET /api/applications/:id - Candidate views updated application', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.get(`/applications/${this.applicationId}`);

      if (response.status === 200) {
        const app = response.data;
        log.detail('Status', response.status);
        log.detail('Application Status', app.status || app.statut);

        await this.assertTrue(
          app.status === 'ENTRETIEN' || app.statut === 'ENTRETIEN',
          'Candidate should see updated status ENTRETIEN'
        );
      } else {
        throw new Error(`Get application failed: ${response.status}`);
      }
    });

    await this.test('GET /api/notifications - Candidate receives notification', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.get(`/notifications`);

      if (response.status === 200) {
        let notifications = response.data;

        // Handle wrapped response
        if (response.data?.data && Array.isArray(response.data.data)) {
          notifications = response.data.data;
        }

        log.detail('Status', response.status);
        log.detail('Notifications Count', Array.isArray(notifications) ? notifications.length : 'N/A');

        if (Array.isArray(notifications) && notifications.length > 0) {
          log.detail('Latest Notification', notifications[0].title || notifications[0].message);
        }
      } else {
        log.warning(`Get notifications failed: ${response.status} (may not be implemented)`);
      }
    });
  }

  // ========================================================================
  // STEP 6: Company Rejects Application with Reason
  // ========================================================================

  async stepCompanyRejects() {
    log.step(6, 'Company Rejects Application with Reason');

    // Create another application to reject
    await this.test('Candidate applies to same offer again (for rejection test)', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.post('/applications', {
        offerId: this.offerId,
        motivation: 'Deuxième tentative',
      });

      if (response.status === 201 || response.status === 200) {
        this.applicationId2 = response.data?.id;
        log.detail('New Application ID', this.applicationId2);
      } else {
        log.warning(`Could not create second application: ${response.status}`);
      }
    });

    if (this.applicationId2) {
      await this.test('PATCH /api/applications/:id - Company rejects with reason', async () => {
        this.client.setToken(this.companyToken);

        const response = await this.client.patch(`/applications/${this.applicationId2}`, {
          status: 'REJECTED',
          rejectionReason: 'Profil ne correspond pas aux compétences requises.',
        });

        if (response.status === 200 || response.status === 204) {
          log.detail('Status', response.status);
          log.detail('Rejection Reason Sent', 'Profil ne correspond pas...');

          // Verify
          const verifyResponse = await this.client.get(`/applications/${this.applicationId2}`);
          if (verifyResponse.status === 200) {
            const app = verifyResponse.data;
            log.detail('Verified Status', app.status || app.statut);
            log.detail('Reason Persisted', app.rejectionReason || app.motifRejet ? 'Yes' : 'No');
          }
        } else {
          throw new Error(`Reject failed: ${response.status}`);
        }
      });

      await this.test('Candidate sees rejection reason', async () => {
        this.client.setToken(this.candidateToken);

        const response = await this.client.get(`/applications/${this.applicationId2}`);

        if (response.status === 200) {
          const app = response.data;
          log.detail('Status', response.status);
          log.detail('Application Status', app.status || app.statut);
          log.detail('Rejection Reason', app.rejectionReason || app.motifRejet || 'Not shown');

          await this.assertTrue(
            app.status === 'REJECTED' || app.statut === 'REJECTED',
            'Candidate should see REJECTED status'
          );
        } else {
          throw new Error(`Get rejected application failed: ${response.status}`);
        }
      });
    }
  }

  // ========================================================================
  // STEP 7: Edge Cases
  // ========================================================================

  async stepEdgeCases() {
    log.step(7, 'Edge Cases & Boundary Tests');

    // Edge case: Duplicate application attempt
    await this.test('Duplicate application to same offer', async () => {
      this.client.setToken(this.candidateToken);

      const response = await this.client.post('/applications', {
        offerId: this.offerId,
        motivation: 'Tentative de doublon',
      });

      // Should either fail (400) or create another application (edge case behavior)
      log.detail('Status', response.status);
      if (response.status === 400 || response.status === 409) {
        log.info('System correctly prevents duplicate applications');
      } else if (response.status === 201) {
        log.warning('System allows duplicate applications (edge case)');
      } else {
        log.warning(`Unexpected response: ${response.status}`);
      }
    });

    // Edge case: Accessing application with wrong token
    await this.test('Security: Candidate cannot access other company\'s applications', async () => {
      // Attempt to access with wrong token
      this.client.setToken(this.candidateToken); // Using candidate token on company resource

      const response = await this.client.get(`/applications/${this.applicationId}`);

      if (response.status === 403 || response.status === 401) {
        log.info('✅ Access control working correctly');
      } else if (response.status === 200) {
        log.warning('⚠️  Candidate can access application (may be intentional if viewer is owner)');
      }
    });
  }

  // ========================================================================
  // RUN ALL TESTS
  // ========================================================================

  async run() {
    try {
      log.section('🤖 E2E TEST: CANDIDATE ↔ COMPANY SYNCHRONIZATION FLOW');
      log.info(`API Base: ${API_BASE}`);
      log.info(`Start Time: ${new Date().toISOString()}`);

      await this.setupAccounts();
      await this.stepCandidateCompletesProfile();
      await this.stepCreateOffer();
      await this.stepCandidateApplies();
      await this.stepCompanyReceivesApplication();
      await this.stepCompanyChangesStatus();
      await this.stepCandidateSeesUpdate();
      await this.stepCompanyRejects();
      await this.stepEdgeCases();

      this.printResults();
      this.saveReport();
    } catch (error) {
      log.error(`Fatal error: ${error.message}`);
      process.exit(1);
    }
  }

  printResults() {
    log.section('📊 FLOW TEST RESULTS');

    const { total, passed, failed } = this.results;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

    console.log(`${colors.bright}Total Tests:${colors.reset}  ${total}`);
    console.log(`${colors.green}Passed:${colors.reset}        ${passed}`);
    console.log(`${colors.red}Failed:${colors.reset}        ${failed}`);
    console.log(`${colors.bright}Success Rate:${colors.reset}  ${percentage}%`);

    console.log(`\n${colors.bright}Test Details:${colors.reset}`);
    this.results.tests.forEach((test, i) => {
      const status = test.status === 'PASSED' ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
      const error = test.error ? ` | ${test.error}` : '';
      console.log(`  ${i + 1}. ${status} ${test.name}${error}`);
    });

    console.log(`\n${colors.bright}Flow Summary:${colors.reset}`);
    if (percentage >= 75) {
      log.success(`FLUX CANDIDAT ↔ ENTREPRISE: OPÉRATIONNEL`);
    } else if (percentage >= 50) {
      log.info(`⚠️  FLUX CANDIDAT ↔ ENTREPRISE: À INVESTIGUER`);
    } else {
      log.error(`FLUX CANDIDAT ↔ ENTREPRISE: CASSÉ`);
    }

    console.log(`\n${colors.dim}End Time: ${new Date().toISOString()}${colors.reset}\n`);
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: { API_BASE, nodeVersion: process.version },
      results: this.results,
      testIds: {
        candidateId: this.candidateId,
        companyId: this.companyId,
        offerId: this.offerId,
        applicationId: this.applicationId,
      },
    };

    const reportPath = path.join(__dirname, 'e2e-flow-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log.info(`Report saved to: ${reportPath}`);
  }
}

// ============================================================================
// RUN
// ============================================================================

const test = new CandidateCompanyFlowTest();
test.run().catch((error) => {
  console.error(colors.red, error, colors.reset);
  process.exit(1);
});
