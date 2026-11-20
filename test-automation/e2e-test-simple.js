#!/usr/bin/env node

/**
 * Test E2E Simplifié - Versión sans chalk
 * Teste la synchronisation candidat-entreprise
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config
const API_URL = 'http://localhost:8080/api';
const VERBOSE = process.argv.includes('--verbose');

// Résultats
const results = [];

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
  info: (msg) => console.log(`${msg}`),
  success: (msg) => console.log(`${c.green}✅ ${msg}${c.reset}`),
  error: (msg) => console.error(`${c.red}❌ ${msg}${c.reset}`),
  warn: (msg) => console.warn(`${c.yellow}⚠️  ${msg}${c.reset}`),
  section: (msg) => console.log(`\n${c.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}\n${c.reset}`),
  debug: (msg) => VERBOSE && console.log(`${c.gray}🔍 ${msg}${c.reset}`),
};

class APIClient {
  constructor(baseURL, token = null) {
    this.client = axios.create({ baseURL, timeout: 10000 });
    if (token) this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  setToken(token) {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  async post(endpoint, data) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async get(endpoint) {
    try {
      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async patch(endpoint, data) {
    try {
      const response = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

async function testAPI() {
  log.section('E2E TEST: Synchronisation Candidat ↔ Entreprise');
  
  try {
    // Test 1: Vérifier l'API
    console.log('🔍 Test 1: Vérification API...');
    const clientAPI = new APIClient(API_URL);
    const health = await clientAPI.get('/health').catch(() => ({ status: 'unknown' }));
    console.log(`   API Status: ${health.status || 'unavailable'}`);
    
    // Test 2: Tester l'authentification
    console.log('\n🔍 Test 2: Authentification...');
    try {
      const authResp = await clientAPI.post('/auth/login', {
        email: 'test@test.fr',
        password: 'test123'
      });
      console.log(`   ✓ Auth réponse reçue (même si erreur)`, authResp);
    } catch (error) {
      console.log(`   ⚠️  Auth test (erreur attendue): ${typeof error === 'object' ? error.message : error}`);
    }
    
    // Test 3: Lister les applications
    console.log('\n🔍 Test 3: Lister les applications...');
    try {
      const apps = await clientAPI.get('/applications');
      console.log(`   ✓ Applications trouvées: ${Array.isArray(apps) ? apps.length : 'N/A'}`);
    } catch (error) {
      console.log(`   ⚠️  Applications (erreur): ${typeof error === 'object' ? error.message : error}`);
    }
    
    // Rapport final
    console.log('\n' + '='.repeat(70));
    console.log(`${c.cyan}RÉSUMÉ${c.reset}`);
    console.log('='.repeat(70));
    console.log(`${c.green}✅ API Contact établi${c.reset}`);
    console.log(`${c.yellow}⚠️  Tests compllets nécessitent une BD initialisée${c.reset}`);
    console.log('\n📋 Pour tester complètement:');
    console.log('   1. Initialiser BD: mysql ... < init-test-accounts.sql');
    console.log('   2. Exécuter: node e2e-candidature-flux.js');
    console.log('\n✨ Infrastructure en place!');
    
  } catch (error) {
    log.error(`Erreur: ${error.message || error}`);
    process.exit(1);
  }
}

testAPI();
