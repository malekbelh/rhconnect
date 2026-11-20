#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'rhconnect';

async function testQueries() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('\n========================================');
    console.log('  TEST DES REQUÊTES SPRING DATA');
    console.log('========================================\n');

    // Test 1: Count users
    console.log('1️⃣  COUNT USERS');
    const userCount = await db.collection('users').countDocuments();
    console.log(`   Result: ${userCount}\n`);

    // Test 2: Count applications
    console.log('2️⃣  COUNT APPLICATIONS');
    const appCount = await db.collection('applications').countDocuments();
    console.log(`   Result: ${appCount}\n`);

    // Test 3: Get one application
    console.log('3️⃣  GET ONE APPLICATION WITH TIMELINE');
    const app = await db.collection('applications').findOne({});
    if (app) {
      console.log(`   ID: ${app._id}`);
      console.log(`   Statut: ${app.statut}`);
      console.log(`   Timeline entries: ${app.timeline ? app.timeline.length : 0}`);
      if (app.timeline && app.timeline.length > 0) {
        console.log(`   First entry statut: ${app.timeline[0].statut}`);
      }
    }
    console.log('');

    // Test 4: Aggregate like the backend does
    console.log('4️⃣  AGGREGATE STATS (COMME LE BACKEND)');
    const stats = await db.collection('applications').aggregate([
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('   Applications par statut:');
    stats.forEach(s => {
      console.log(`     - ${s._id}: ${s.count}`);
    });
    console.log('');

    // Test 5: Get application statuses list
    console.log('5️⃣  VÉRIFIER LES VALEURS ENUM');
    const allApps = await db.collection('applications').find({}, { projection: { statut: 1 } }).toArray();
    const statuses = new Set(allApps.map(a => a.statut));
    console.log(`   Statuts trouvés: ${Array.from(statuses).join(', ')}\n`);

    // Test 6: Check timeline statuts
    console.log('6️⃣  VÉRIFIER LES TIMELINE STATUTS');
    const timelineStatuses = new Set();
    allApps.forEach(app => {
      if (app.timeline && Array.isArray(app.timeline)) {
        console.log(`   App ${app._id} has ${app.timeline.length} entries`);
        app.timeline.forEach((entry, idx) => {
          console.log(`     Entry ${idx}: ${JSON.stringify(entry)}`);
          if (entry.statut) {
            timelineStatuses.add(entry.statut);
          }
        });
      }
    });
    console.log(`   Timeline statuts trouvés: ${Array.from(timelineStatuses).join(', ')}\n`);

    console.log('✅ Test de requêtes terminé!\n');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testQueries();
