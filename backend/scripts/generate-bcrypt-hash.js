#!/usr/bin/env node

/**
 * Script pour générer un hash bcrypt avec coût 12
 * Usage: node backend/scripts/generate-bcrypt-hash.js
 */

const bcrypt = require('bcrypt');

async function generateHash(password) {
  try {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    console.log('\n🔐 Hash Bcrypt (coût 12) généré:\n');
    console.log('Mot de passe: ' + password);
    console.log('Hash:        ' + hash);
    console.log('\n✅ Copier ce hash pour utiliser dans les données seed\n');
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

generateHash('rhconnect@123');
