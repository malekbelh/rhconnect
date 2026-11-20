#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'rhconnect';

async function verifySeed() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('\n========================================');
    console.log('     VÉRIFICATION DES DONNÉES SEED');
    console.log('========================================\n');

    const counts = {
      users: await db.collection('users').countDocuments(),
      candidateProfiles: await db.collection('candidate_profiles').countDocuments(),
      companyProfiles: await db.collection('company_profiles').countDocuments(),
      offers: await db.collection('offers').countDocuments(),
      applications: await db.collection('applications').countDocuments(),
      verifications: await db.collection('verifications').countDocuments(),
      refreshTokens: await db.collection('refresh_tokens').countDocuments(),
      notifications: await db.collection('user_notifications').countDocuments(),
      auditLogs: await db.collection('audit_logs').countDocuments()
    };

    console.log('📊 Nombres de documents:\n');
    console.log('✅ Users:               ' + counts.users);
    console.log('✅ Candidate Profiles:  ' + counts.candidateProfiles);
    console.log('✅ Company Profiles:    ' + counts.companyProfiles);
    console.log('✅ Offers:              ' + counts.offers);
    console.log('✅ Applications:        ' + counts.applications);
    console.log('✅ Verifications:       ' + counts.verifications);
    console.log('✅ Refresh Tokens:      ' + counts.refreshTokens);
    console.log('✅ Notifications:       ' + counts.notifications);
    console.log('✅ Audit Logs:          ' + counts.auditLogs);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log('\n✅ TOTAL:               ' + total + ' documents\n');

    console.log('📝 Utilisateurs:\n');
    const users = await db.collection('users').find({}, { projection: { email: 1, roles: 1 } }).toArray();
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.roles.join(', ')})`);
    });

    console.log('\n💼 Offres d\'emploi:\n');
    const offers = await db.collection('offers').find({}, { projection: { title: 1, statut: 1 } }).toArray();
    offers.forEach(o => {
      console.log(`  - ${o.title} (${o.statut})`);
    });

    console.log('\n👥 Candidatures:\n');
    const applications = await db.collection('applications').find({}, { projection: { statut: 1 } }).toArray();
    const statusCount = {};
    applications.forEach(app => {
      statusCount[app.statut] = (statusCount[app.statut] || 0) + 1;
    });
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('\n✅ Vérification réussie!\n');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifySeed();
