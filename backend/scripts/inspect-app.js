#!/usr/bin/env node

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'rhconnect';

async function inspect() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('\n========================================');
    console.log('  INSPECTION DÉTAILLÉE');
    console.log('========================================\n');

    const app = await db.collection('applications').findOne({});
    console.log(JSON.stringify(app, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

inspect();
