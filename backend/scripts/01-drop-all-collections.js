/**
 * Script pour vider complètement la base de données MongoDB
 * Usage: mongosh < scripts/01-drop-all-collections.js
 */

// Utiliser la base de données rhconnect
db = db.getSiblingDB('rhconnect');

// Afficher les collections actuelles
console.log('Collections actuelles:');
db.getCollectionNames().forEach(col => console.log('  -', col));

console.log('\n--- SUPPRESSION DES COLLECTIONS ---\n');

// Supprimer toutes les collections
const collections = [
  'users',
  'candidate_profiles',
  'company_profiles',
  'offers',
  'applications',
  'verifications',
  'audit_logs',
  'refresh_tokens',
  'user_notifications'
];

collections.forEach(col => {
  if (db.getCollectionNames().includes(col)) {
    db.getCollection(col).drop();
    console.log(`✅ Collection '${col}' supprimée`);
  } else {
    console.log(`⚠️  Collection '${col}' n'existe pas`);
  }
});

console.log('\n--- VERIFICATION ---\n');

// Vérifier que la base est vide
const remainingCollections = db.getCollectionNames();
if (remainingCollections.length === 0) {
  console.log('✅ Base de données complètement vidée');
} else {
  console.log('❌ Collections restantes:', remainingCollections);
}

console.log('\n✅ Script de suppression terminé\n');
