#!/usr/bin/env node

/**
 * Script pour seed les comptes de test documentés
 * Crée les comptes avec les emails et mots de passe documentés dans TEST_CREDENTIALS.md
 * 
 * Usage: node scripts/seed-test-accounts.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://localhost:27017/rhconnect';

// Hash de "RhConnect2026!" généré avec bcrypt cost 10
const PASSWORD_HASH = '$2b$10$/OxYakWFj/yfoGfOT9zbL.vQ4o1x2FWdmUWXoxMptMZtX5AbP9OFW';

const testAccounts = {
  ADMIN: {
    email: 'admin@rhconnect.tn',
    password: PASSWORD_HASH,
    roles: ['ADMIN'],
    enabled: true,
  },
  CANDIDATE_1: {
    email: 'lucas.martin@rhconnect.tn',
    password: PASSWORD_HASH,
    roles: ['CANDIDATE'],
    enabled: true,
    verified: true,
  },
  CANDIDATE_2: {
    email: 'marie.dupont@rhconnect.tn',
    password: PASSWORD_HASH,
    roles: ['CANDIDATE'],
    enabled: true,
    verified: false,
  },
  CANDIDATE_3: {
    email: 'jean.bernard@rhconnect.tn',
    password: PASSWORD_HASH,
    roles: ['CANDIDATE'],
    enabled: true,
    verified: false,
  },
  COMPANY_1: {
    email: 'recruiter@techcorp-tn.com',
    password: PASSWORD_HASH,
    roles: ['COMPANY'],
    enabled: true,
    verified: true,
  },
  COMPANY_2: {
    email: 'hr@innovationlabs.tn',
    password: PASSWORD_HASH,
    roles: ['COMPANY'],
    enabled: true,
    verified: false,
  },
  COMPANY_3: {
    email: 'admin@startuphub.tn',
    password: PASSWORD_HASH,
    roles: ['COMPANY'],
    enabled: true,
    verified: false,
  },
};

async function seedTestAccounts() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    const db = client.db('rhconnect');
    const usersCollection = db.collection('users');

    console.log('🌱 Début du seeding des comptes de test...\n');

    for (const [key, account] of Object.entries(testAccounts)) {
      // Vérifier si le compte existe déjà
      const existingUser = await usersCollection.findOne({ email: account.email });

      if (existingUser) {
        console.log(`⚠️  Compte existant: ${account.email}`);
        // Mise à jour optionnelle
        const result = await usersCollection.updateOne(
          { email: account.email },
          {
            $set: {
              password: account.password,
              roles: account.roles,
              enabled: account.enabled,
              verified: account.verified || false,
              updatedAt: new Date(),
            },
          }
        );
        console.log(`   ✏️  Mise à jour effectuée (${result.modifiedCount} document(s))\n`);
      } else {
        // Créer le nouveau compte
        const result = await usersCollection.insertOne({
          email: account.email,
          password: account.password,
          roles: account.roles,
          enabled: account.enabled,
          verified: account.verified || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Compte créé: ${account.email}`);
        console.log(`   ID: ${result.insertedId}\n`);
      }
    }

    // Créer également les profils candidat et entreprise si nécessaire
    const candidatesCollection = db.collection('candidate_profiles');
    const companiesCollection = db.collection('company_profiles');

    console.log('\n📋 Création des profils...\n');

    // Profils candidat
    const candidateEmails = [
      'lucas.martin@rhconnect.tn',
      'marie.dupont@rhconnect.tn',
      'jean.bernard@rhconnect.tn',
    ];

    for (const email of candidateEmails) {
      const user = await usersCollection.findOne({ email });
      if (user) {
        const profile = await candidatesCollection.findOne({ userId: user._id.toString() });
        if (!profile) {
          await candidatesCollection.insertOne({
            userId: user._id.toString(),
            firstName: email.split('.')[0],
            lastName: email.split('.')[1].split('@')[0],
            email: email,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ Profil candidat créé: ${email}`);
        } else {
          console.log(`⚠️  Profil candidat existant: ${email}`);
        }
      }
    }

    // Profils entreprise
    const companyEmails = [
      'recruiter@techcorp-tn.com',
      'hr@innovationlabs.tn',
      'admin@startuphub.tn',
    ];

    const companyNames = {
      'recruiter@techcorp-tn.com': 'TechCorp Tunisia',
      'hr@innovationlabs.tn': 'Innovation Labs',
      'admin@startuphub.tn': 'Startup Hub',
    };

    for (const email of companyEmails) {
      const user = await usersCollection.findOne({ email });
      if (user) {
        const profile = await companiesCollection.findOne({ userId: user._id.toString() });
        if (!profile) {
          await companiesCollection.insertOne({
            userId: user._id.toString(),
            companyName: companyNames[email],
            email: email,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ Profil entreprise créé: ${email}`);
        } else {
          console.log(`⚠️  Profil entreprise existant: ${email}`);
        }
      }
    }

    console.log('\n✨ Seeding des comptes de test terminé!\n');
    console.log('📌 Comptes disponibles:\n');
    console.log('CANDIDATS:');
    console.log('  • lucas.martin@rhconnect.tn / RhConnect2026! (Vérifié)');
    console.log('  • marie.dupont@rhconnect.tn / RhConnect2026! (En attente)');
    console.log('  • jean.bernard@rhconnect.tn / RhConnect2026! (Non vérifié)\n');
    console.log('ENTREPRISES:');
    console.log('  • recruiter@techcorp-tn.com / RhConnect2026! (Vérifiée)');
    console.log('  • hr@innovationlabs.tn / RhConnect2026! (En attente)');
    console.log('  • admin@startuphub.tn / RhConnect2026! (Non vérifiée)\n');
    console.log('ADMIN:');
    console.log('  • admin@rhconnect.tn / RhConnect2026!\n');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedTestAccounts();
