#!/usr/bin/env node

/**
 * Script Node.js pour vider et remplir la base de données MongoDB
 * Usage: node backend/scripts/seed-db.js
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'rhconnect';

async function dropAllCollections(db) {
  console.log('\n--- SUPPRESSION DES COLLECTIONS ---\n');

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

  for (const col of collections) {
    try {
      await db.collection(col).drop();
      console.log(`✅ Collection '${col}' supprimée`);
    } catch (err) {
      if (err.code !== 26) { // 26 = namespace not found
        console.log(`⚠️  Collection '${col}' n'existe pas`);
      }
    }
  }

  console.log('');
}

async function seedData(db) {
  console.log('\n========================================');
  console.log('  SEED DONNÉES TUNISIENNES - RHCONNECT');
  console.log('========================================\n');

  // ===== USERS =====
  console.log('📝 Création des utilisateurs...\n');

  const usersCollection = db.collection('users');
  const BCRYPT_HASH = '$2b$12$BuvVN7fKjaUloKq.4BvchebYtTvzRHhmu31nNZFWZTrnLmQHPFgVi'; // rhconnect@123 (bcrypt cost 12)
  
  const users = await usersCollection.insertMany([
    // ADMIN
    {
      _id: new ObjectId('000000000000000000000001'),
      email: 'admin@rhconnect.tn',
      password: BCRYPT_HASH,
      roles: ['ADMIN'],
      enabled: true,
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-09-17'),
      verified: true
    },

    // CANDIDATS
    {
      _id: new ObjectId('100000000000000000000001'),
      email: 'ahmed.ben.ali@email.tn',
      password: BCRYPT_HASH,
      roles: ['CANDIDATE'],
      enabled: true,
      createdAt: new Date('2024-02-15'),
      lastLogin: new Date('2024-09-16'),
      verified: true
    },
    {
      _id: new ObjectId('100000000000000000000002'),
      email: 'fatima.hamzaoui@email.tn',
      password: BCRYPT_HASH,
      roles: ['CANDIDATE'],
      enabled: true,
      createdAt: new Date('2024-03-20'),
      lastLogin: new Date('2024-09-15'),
      verified: true
    },
    {
      _id: new ObjectId('100000000000000000000003'),
      email: 'khadija.slimani@email.tn',
      password: BCRYPT_HASH,
      roles: ['CANDIDATE'],
      enabled: true,
      createdAt: new Date('2024-01-10'),
      lastLogin: new Date('2024-09-14'),
      verified: true
    },
    {
      _id: new ObjectId('100000000000000000000004'),
      email: 'mouhamed.karim@email.tn',
      password: BCRYPT_HASH,
      roles: ['CANDIDATE'],
      enabled: true,
      createdAt: new Date('2024-04-05'),
      lastLogin: new Date('2024-09-13'),
      verified: true
    },
    {
      _id: new ObjectId('100000000000000000000005'),
      email: 'salma.bennour@email.tn',
      password: BCRYPT_HASH,
      roles: ['CANDIDATE'],
      enabled: true,
      createdAt: new Date('2024-02-28'),
      lastLogin: new Date('2024-09-12'),
      verified: true
    },

    // ENTREPRISES
    {
      _id: new ObjectId('200000000000000000000001'),
      email: 'rh@tunisie-soft.tn',
      password: BCRYPT_HASH,
      roles: ['COMPANY'],
      enabled: true,
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-09-16'),
      verified: true
    },
    {
      _id: new ObjectId('200000000000000000000002'),
      email: 'hr@digitech-tunisia.tn',
      password: BCRYPT_HASH,
      roles: ['COMPANY'],
      enabled: true,
      createdAt: new Date('2024-02-10'),
      lastLogin: new Date('2024-09-15'),
      verified: true
    },
    {
      _id: new ObjectId('200000000000000000000003'),
      email: 'contact@star-consulting.tn',
      password: BCRYPT_HASH,
      roles: ['COMPANY'],
      enabled: true,
      createdAt: new Date('2024-03-15'),
      lastLogin: new Date('2024-09-14'),
      verified: true
    },
    {
      _id: new ObjectId('200000000000000000000004'),
      email: 'hr@innovate-tn.tn',
      password: BCRYPT_HASH,
      roles: ['COMPANY'],
      enabled: true,
      createdAt: new Date('2024-04-01'),
      lastLogin: new Date('2024-09-13'),
      verified: true
    }
  ]);

  console.log(`✅ ${users.insertedIds.length} utilisateurs créés\n`);

  // ===== CANDIDATE PROFILES =====
  console.log('👤 Création des profils candidats...\n');

  const candidateProfilesCollection = db.collection('candidate_profiles');
  const candidateProfiles = await candidateProfilesCollection.insertMany([
    {
      userId: new ObjectId('100000000000000000000001'),
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      email: 'ahmed.ben.ali@email.tn',
      phone: '+216 20 123 456',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'M',
      location: 'Tunis',
      bio: 'Ingénieur informatique avec 5 ans d\'expérience en développement web',
      profileImage: 'https://api.example.com/profiles/ahmed.jpg',
      cv: 'https://api.example.com/cv/ahmed_ben_ali.pdf',
      education: [
        {
          degree: 'Master',
          field: 'Informatique',
          institution: 'Université de Tunis El Manar',
          year: 2019
        }
      ],
      experience: [
        {
          position: 'Développeur Web Senior',
          company: 'Tunisie Software',
          duration: '3 ans',
          description: 'Développement d\'applications web avec React et Node.js'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST API'],
      languages: ['Arabe', 'Français', 'Anglais'],
      matchingTags: ['Dev', 'Web', 'React', 'Backend'],
      verificationStatus: 'VERIFIED',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-09-16')
    },
    {
      userId: new ObjectId('100000000000000000000002'),
      firstName: 'Fatima',
      lastName: 'Hamzaoui',
      email: 'fatima.hamzaoui@email.tn',
      phone: '+216 21 234 567',
      dateOfBirth: new Date('1998-08-22'),
      gender: 'F',
      location: 'Sfax',
      bio: 'Designer UX/UI passionnée par l\'expérience utilisateur',
      profileImage: 'https://api.example.com/profiles/fatima.jpg',
      cv: 'https://api.example.com/cv/fatima_hamzaoui.pdf',
      education: [
        {
          degree: 'Licence',
          field: 'Design Graphique',
          institution: 'Université de Sfax',
          year: 2020
        }
      ],
      skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping'],
      languages: ['Arabe', 'Français'],
      matchingTags: ['Design', 'UX', 'UI', 'Figma'],
      verificationStatus: 'VERIFIED',
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date('2024-09-15')
    },
    {
      userId: new ObjectId('100000000000000000000003'),
      firstName: 'Khadija',
      lastName: 'Slimani',
      email: 'khadija.slimani@email.tn',
      phone: '+216 22 345 678',
      dateOfBirth: new Date('1993-11-03'),
      gender: 'F',
      location: 'Sousse',
      bio: 'Chef de projet agile avec certification Scrum Master',
      profileImage: 'https://api.example.com/profiles/khadija.jpg',
      cv: 'https://api.example.com/cv/khadija_slimani.pdf',
      education: [
        {
          degree: 'Master',
          field: 'Gestion de Projets',
          institution: 'ESSEC Tunis',
          year: 2018
        }
      ],
      skills: ['Agile', 'Scrum', 'JIRA', 'Leadership', 'Communication'],
      languages: ['Arabe', 'Français', 'Anglais'],
      matchingTags: ['ProjectManager', 'Agile', 'Scrum'],
      verificationStatus: 'VERIFIED',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-09-14')
    },
    {
      userId: new ObjectId('100000000000000000000004'),
      firstName: 'Mouhamed',
      lastName: 'Karim',
      email: 'mouhamed.karim@email.tn',
      phone: '+216 23 456 789',
      dateOfBirth: new Date('1996-03-12'),
      gender: 'M',
      location: 'Gafsa',
      bio: 'Data Scientist avec expertise en Machine Learning',
      profileImage: 'https://api.example.com/profiles/mouhamed.jpg',
      cv: 'https://api.example.com/cv/mouhamed_karim.pdf',
      education: [
        {
          degree: 'Master',
          field: 'Data Science',
          institution: 'Université de Tunis',
          year: 2021
        }
      ],
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
      languages: ['Arabe', 'Français', 'Anglais'],
      matchingTags: ['DataScience', 'ML', 'Python', 'AI'],
      verificationStatus: 'VERIFIED',
      createdAt: new Date('2024-04-05'),
      updatedAt: new Date('2024-09-13')
    },
    {
      userId: new ObjectId('100000000000000000000005'),
      firstName: 'Salma',
      lastName: 'Bennour',
      email: 'salma.bennour@email.tn',
      phone: '+216 24 567 890',
      dateOfBirth: new Date('1997-07-18'),
      gender: 'F',
      location: 'Rades',
      bio: 'Marketing Manager spécialisée en digital et content strategy',
      profileImage: 'https://api.example.com/profiles/salma.jpg',
      cv: 'https://api.example.com/cv/salma_bennour.pdf',
      education: [
        {
          degree: 'Licence',
          field: 'Marketing',
          institution: 'Université de Carthage',
          year: 2019
        }
      ],
      skills: ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media', 'Analytics'],
      languages: ['Arabe', 'Français', 'Anglais'],
      matchingTags: ['Marketing', 'Digital', 'Content'],
      verificationStatus: 'PENDING',
      createdAt: new Date('2024-02-28'),
      updatedAt: new Date('2024-09-12')
    }
  ]);

  console.log(`✅ ${candidateProfiles.insertedIds.length} profils candidats créés\n`);

  // ===== COMPANY PROFILES =====
  console.log('🏢 Création des profils entreprises...\n');

  const companyProfilesCollection = db.collection('company_profiles');
  const companyProfiles = await companyProfilesCollection.insertMany([
    {
      userId: new ObjectId('200000000000000000000001'),
      companyName: 'Tunisie Software',
      siret: '10234567890123',
      industry: 'Software Development',
      website: 'https://www.tunisie-soft.tn',
      phone: '+216 71 123 456',
      email: 'rh@tunisie-soft.tn',
      address: '123 Avenue Bourguiba, 1000 Tunis',
      city: 'Tunis',
      postalCode: '1000',
      country: 'Tunisie',
      description: 'Entreprise de développement logiciel basée à Tunis avec plus de 100 employés',
      logo: 'https://api.example.com/logos/tunisie-soft.png',
      numberOfEmployees: '100-500',
      foundedYear: 2010,
      verifiedStatus: 'VERIFIED',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-09-16')
    },
    {
      userId: new ObjectId('200000000000000000000002'),
      companyName: 'DigiTech Tunisia',
      siret: '10345678901234',
      industry: 'Digital Transformation',
      website: 'https://www.digitech-tunisia.tn',
      phone: '+216 71 234 567',
      email: 'hr@digitech-tunisia.tn',
      address: '456 Rue Ibn Khaldoun, 1001 Tunis',
      city: 'Tunis',
      postalCode: '1001',
      country: 'Tunisie',
      description: 'Agence spécialisée en transformation digitale et solutions cloud',
      logo: 'https://api.example.com/logos/digitech-tunisia.png',
      numberOfEmployees: '50-100',
      foundedYear: 2015,
      verifiedStatus: 'VERIFIED',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-09-15')
    },
    {
      userId: new ObjectId('200000000000000000000003'),
      companyName: 'Star Consulting',
      siret: '10456789012345',
      industry: 'Management Consulting',
      website: 'https://www.star-consulting.tn',
      phone: '+216 71 345 678',
      email: 'contact@star-consulting.tn',
      address: '789 Avenue Mohamed V, 2000 Sfax',
      city: 'Sfax',
      postalCode: '2000',
      country: 'Tunisie',
      description: 'Cabinet de conseil en stratégie et management',
      logo: 'https://api.example.com/logos/star-consulting.png',
      numberOfEmployees: '20-50',
      foundedYear: 2012,
      verifiedStatus: 'PENDING',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-09-14')
    },
    {
      userId: new ObjectId('200000000000000000000004'),
      companyName: 'Innovate Tunisia',
      siret: '10567890123456',
      industry: 'Innovation & Startups',
      website: 'https://www.innovate-tn.tn',
      phone: '+216 71 456 789',
      email: 'hr@innovate-tn.tn',
      address: '321 Boulevard 2 Mars, 1002 Tunis',
      city: 'Tunis',
      postalCode: '1002',
      country: 'Tunisie',
      description: 'Startup spécialisée en développement mobile et applications innovantes',
      logo: 'https://api.example.com/logos/innovate-tunisia.png',
      numberOfEmployees: '10-20',
      foundedYear: 2020,
      verifiedStatus: 'VERIFIED',
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-09-13')
    }
  ]);

  console.log(`✅ ${companyProfiles.insertedIds.length} profils entreprises créés\n`);

  // ===== OFFERS =====
  console.log('💼 Création des offres d\'emploi...\n');

  const offersCollection = db.collection('offers');
  const offers = await offersCollection.insertMany([
    {
      companyId: new ObjectId('200000000000000000000001'),
      title: 'Développeur React Senior',
      description: 'Nous recherchons un développeur React expérimenté pour rejoindre notre équipe',
      competencesRequises: 'React, TypeScript, Node.js, REST API',
      niveauExperience: 'CONFIRME',
      typeContrat: 'CDI',
      localisation: 'Tunis',
      salaireMin: 2500,
      salaireMax: 3500,
      datePublication: new Date('2024-09-10'),
      dateExpiration: new Date('2024-10-10'),
      statut: 'ACTIVE',
      matchingTags: ['React', 'TypeScript', 'Web', 'Senior'],
      viewCount: 145,
      createdAt: new Date('2024-09-10'),
      updatedAt: new Date('2024-09-16')
    },
    {
      companyId: new ObjectId('200000000000000000000002'),
      title: 'Designer UX/UI',
      description: 'Rejoignez notre équipe de design pour créer des interfaces exceptionnelles',
      competencesRequises: 'Figma, Adobe XD, UI/UX Design',
      niveauExperience: 'CONFIRME',
      typeContrat: 'CDI',
      localisation: 'Tunis',
      salaireMin: 1800,
      salaireMax: 2500,
      datePublication: new Date('2024-09-12'),
      dateExpiration: new Date('2024-10-12'),
      statut: 'ACTIVE',
      matchingTags: ['Design', 'UX', 'UI', 'Figma'],
      viewCount: 98,
      createdAt: new Date('2024-09-12'),
      updatedAt: new Date('2024-09-16')
    },
    {
      companyId: new ObjectId('200000000000000000000003'),
      title: 'Chef de Projet Agile',
      description: 'Vous piloterez des projets innovants dans un environnement agile',
      competencesRequises: 'Agile, Scrum, JIRA, Leadership',
      niveauExperience: 'CONFIRME',
      typeContrat: 'CDI',
      localisation: 'Sfax',
      salaireMin: 2000,
      salaireMax: 2800,
      datePublication: new Date('2024-09-08'),
      dateExpiration: new Date('2024-10-08'),
      statut: 'ACTIVE',
      matchingTags: ['Agile', 'ProjectManager', 'Leadership'],
      viewCount: 67,
      createdAt: new Date('2024-09-08'),
      updatedAt: new Date('2024-09-16')
    },
    {
      companyId: new ObjectId('200000000000000000000001'),
      title: 'Data Scientist',
      description: 'Nous cherchons un Data Scientist pour nos projets de machine learning',
      competencesRequises: 'Python, Machine Learning, SQL, TensorFlow',
      niveauExperience: 'CONFIRME',
      typeContrat: 'CDI',
      localisation: 'Tunis',
      salaireMin: 2800,
      salaireMax: 4000,
      datePublication: new Date('2024-09-14'),
      dateExpiration: new Date('2024-10-14'),
      statut: 'ACTIVE',
      matchingTags: ['DataScience', 'ML', 'Python', 'AI'],
      viewCount: 112,
      createdAt: new Date('2024-09-14'),
      updatedAt: new Date('2024-09-16')
    },
    {
      companyId: new ObjectId('200000000000000000000004'),
      title: 'Développeur Mobile Flutter',
      description: 'Rejoignez notre startup pour développer des applications mobiles innovantes',
      competencesRequises: 'Flutter, Dart, Mobile Development',
      niveauExperience: 'JUNIOR',
      typeContrat: 'CDI',
      localisation: 'Tunis',
      salaireMin: 1200,
      salaireMax: 1800,
      datePublication: new Date('2024-09-15'),
      dateExpiration: new Date('2024-10-15'),
      statut: 'ACTIVE',
      matchingTags: ['Flutter', 'Mobile', 'Dart'],
      viewCount: 34,
      createdAt: new Date('2024-09-15'),
      updatedAt: new Date('2024-09-16')
    },
    {
      companyId: new ObjectId('200000000000000000000002'),
      title: 'Marketing Manager Digital',
      description: 'Pilotez notre stratégie marketing digitale et développez notre présence online',
      competencesRequises: 'Digital Marketing, SEO, Content Strategy',
      niveauExperience: 'CONFIRME',
      typeContrat: 'CDI',
      localisation: 'Tunis',
      salaireMin: 1600,
      salaireMax: 2300,
      datePublication: new Date('2024-09-13'),
      dateExpiration: new Date('2024-10-13'),
      statut: 'DRAFT',
      matchingTags: ['Marketing', 'Digital', 'Content'],
      viewCount: 0,
      createdAt: new Date('2024-09-13'),
      updatedAt: new Date('2024-09-13')
    }
  ]);

  console.log(`✅ ${offers.insertedIds.length} offres créées\n`);

  // ===== APPLICATIONS =====
  console.log('📋 Création des candidatures...\n');

  const applicationsCollection = db.collection('applications');
  const applications = await applicationsCollection.insertMany([
    {
      candidateId: new ObjectId('100000000000000000000001'),
      offerId: offers.insertedIds[0],
      companyId: new ObjectId('200000000000000000000001'),
      statut: 'VERIFIE',
      dateCreation: new Date('2024-09-11'),
      lettreMotivation: 'Je suis très intéressé par ce poste senior en React',
      dossierIncomplet: false,
      timeline: [
        {
          statut: 'POSTULE',
          date: new Date('2024-09-11T09:00:00Z'),
          acteurId: new ObjectId('100000000000000000000001').toString()
        },
        {
          statut: 'VERIFIE',
          date: new Date('2024-09-12T14:30:00Z'),
          acteurId: new ObjectId('200000000000000000000001').toString(),
          commentaire: 'Profil intéressant'
        }
      ],
      createdAt: new Date('2024-09-11'),
      disputeOpen: false,
      dossierIncomplet: false,
      adminNotes: []
    },
    {
      candidateId: new ObjectId('100000000000000000000002'),
      offerId: offers.insertedIds[1],
      companyId: new ObjectId('200000000000000000000002'),
      statut: 'POSTULE',
      dateCreation: new Date('2024-09-14'),
      lettreMotivation: 'Passionnée par le design UX/UI, j\'aimerais rejoindre votre équipe',
      dossierIncomplet: false,
      timeline: [
        {
          statut: 'POSTULE',
          date: new Date('2024-09-14T11:00:00Z'),
          acteurId: new ObjectId('100000000000000000000002').toString()
        }
      ],
      createdAt: new Date('2024-09-14'),
      disputeOpen: false,
      adminNotes: []
    },
    {
      candidateId: new ObjectId('100000000000000000000003'),
      offerId: offers.insertedIds[2],
      companyId: new ObjectId('200000000000000000000003'),
      statut: 'ACCEPTE',
      dateCreation: new Date('2024-09-09'),
      lettreMotivation: 'Chef de projet agile avec 6 ans d\'expérience',
      dossierIncomplet: false,
      timeline: [
        {
          statut: 'POSTULE',
          date: new Date('2024-09-09T08:00:00Z'),
          acteurId: new ObjectId('100000000000000000000003').toString()
        },
        {
          statut: 'VERIFIE',
          date: new Date('2024-09-10T10:00:00Z'),
          acteurId: new ObjectId('200000000000000000000003').toString()
        },
        {
          statut: 'ACCEPTE',
          date: new Date('2024-09-13T16:00:00Z'),
          acteurId: new ObjectId('200000000000000000000003').toString(),
          commentaire: 'Sélectionné pour l\'entretien final'
        }
      ],
      createdAt: new Date('2024-09-09'),
      disputeOpen: false,
      adminNotes: []
    },
    {
      candidateId: new ObjectId('100000000000000000000004'),
      offerId: offers.insertedIds[3],
      companyId: new ObjectId('200000000000000000000001'),
      statut: 'VERIFIE',
      dateCreation: new Date('2024-09-15'),
      lettreMotivation: 'Data Scientist avec expertise en ML et Python',
      dossierIncomplet: false,
      timeline: [
        {
          statut: 'POSTULE',
          date: new Date('2024-09-15T10:00:00Z'),
          acteurId: new ObjectId('100000000000000000000004').toString()
        },
        {
          statut: 'VERIFIE',
          date: new Date('2024-09-16T09:30:00Z'),
          acteurId: new ObjectId('200000000000000000000001').toString()
        }
      ],
      createdAt: new Date('2024-09-15'),
      disputeOpen: false,
      adminNotes: []
    },
    {
      candidateId: new ObjectId('100000000000000000000001'),
      offerId: offers.insertedIds[4],
      companyId: new ObjectId('200000000000000000000004'),
      statut: 'REFUSE',
      dateCreation: new Date('2024-09-16'),
      lettreMotivation: 'Je m\'intéresse au développement mobile',
      dossierIncomplet: false,
      timeline: [
        {
          statut: 'POSTULE',
          date: new Date('2024-09-16T13:00:00Z'),
          acteurId: new ObjectId('100000000000000000000001').toString()
        },
        {
          statut: 'REFUSE',
          date: new Date('2024-09-16T15:00:00Z'),
          acteurId: new ObjectId('200000000000000000000004').toString(),
          commentaire: 'Profil surqualifié'
        }
      ],
      createdAt: new Date('2024-09-16'),
      disputeOpen: false,
      adminNotes: []
    }
  ]);

  console.log(`✅ ${applications.insertedIds.length} candidatures créées\n`);

  // ===== VERIFICATIONS =====
  console.log('✔️  Création des vérifications de profils...\n');

  const verificationsCollection = db.collection('verifications');
  const verifications = await verificationsCollection.insertMany([
    {
      candidateId: new ObjectId('100000000000000000000001'),
      statut: 'VALIDE',
      validatedAt: new Date('2024-09-01'),
      validatorId: new ObjectId('000000000000000000000001'),
      documents: ['diploma.pdf', 'cv.pdf'],
      notes: 'Profil vérifié. Diplôme Master authentifié.'
    },
    {
      candidateId: new ObjectId('100000000000000000000002'),
      statut: 'VALIDE',
      validatedAt: new Date('2024-09-05'),
      validatorId: new ObjectId('000000000000000000000001'),
      documents: ['license.pdf', 'portfolio.pdf'],
      notes: 'Portfolio impressionnant en design'
    },
    {
      candidateId: new ObjectId('100000000000000000000003'),
      statut: 'VALIDE',
      validatedAt: new Date('2024-08-20'),
      validatorId: new ObjectId('000000000000000000000001'),
      documents: ['master_diploma.pdf', 'scrum_certification.pdf'],
      notes: 'Certification Scrum Master vérifiée'
    },
    {
      candidateId: new ObjectId('100000000000000000000004'),
      statut: 'VALIDE',
      validatedAt: new Date('2024-09-03'),
      validatorId: new ObjectId('000000000000000000000001'),
      documents: ['master_diploma.pdf', 'projects.pdf'],
      notes: 'Projets ML démontrés'
    },
    {
      candidateId: new ObjectId('100000000000000000000005'),
      statut: 'EN_ATTENTE',
      submittedAt: new Date('2024-09-10'),
      documents: ['license.pdf', 'courses.pdf'],
      notes: 'En cours de vérification'
    }
  ]);

  console.log(`✅ ${verifications.insertedIds.length} vérifications créées\n`);

  // ===== REFRESH TOKENS =====
  console.log('🔑 Création des tokens de refresh...\n');

  const refreshTokensCollection = db.collection('refresh_tokens');
  const refreshTokens = await refreshTokensCollection.insertMany([
    {
      userId: new ObjectId('100000000000000000000001'),
      token: 'refresh_token_candidate_1_' + new Date().getTime(),
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      revokedAt: null
    },
    {
      userId: new ObjectId('200000000000000000000001'),
      token: 'refresh_token_company_1_' + new Date().getTime(),
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      revokedAt: null
    },
    {
      userId: new ObjectId('000000000000000000000001'),
      token: 'refresh_token_admin_1_' + new Date().getTime(),
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      revokedAt: null
    }
  ]);

  console.log(`✅ ${refreshTokens.insertedIds.length} refresh tokens créés\n`);

  // ===== USER NOTIFICATIONS =====
  console.log('🔔 Création des notifications...\n');

  const notificationsCollection = db.collection('user_notifications');
  const notifications = await notificationsCollection.insertMany([
    {
      userId: new ObjectId('100000000000000000000001'),
      type: 'APPLICATION_STATUS_UPDATE',
      title: 'Statut de votre candidature',
      message: 'Votre candidature pour "Développeur React Senior" a été vérifiée',
      read: false,
      link: '/candidate/applications/1',
      createdAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000)
    },
    {
      userId: new ObjectId('100000000000000000000002'),
      type: 'NEW_OFFER_MATCHING',
      title: 'Nouvelle offre correspondante',
      message: 'Une nouvelle offre Designer UX/UI correspond à votre profil',
      read: false,
      link: '/candidate/offers',
      createdAt: new Date(new Date().getTime() - 4 * 60 * 60 * 1000)
    },
    {
      userId: new ObjectId('200000000000000000000001'),
      type: 'NEW_APPLICATION',
      title: 'Nouvelle candidature',
      message: '2 candidatures reçues pour vos offres',
      read: true,
      link: '/company/applications',
      createdAt: new Date(new Date().getTime() - 6 * 60 * 60 * 1000)
    },
    {
      userId: new ObjectId('000000000000000000000001'),
      type: 'OFFER_PENDING_MODERATION',
      title: 'Offres en attente',
      message: '1 offre en attente de modération',
      read: false,
      link: '/admin/offers',
      createdAt: new Date(new Date().getTime() - 8 * 60 * 60 * 1000)
    }
  ]);

  console.log(`✅ ${notifications.insertedIds.length} notifications créées\n`);

  // ===== AUDIT LOGS =====
  console.log('📊 Création des logs d\'audit...\n');

  const auditLogsCollection = db.collection('audit_logs');
  const auditLogs = await auditLogsCollection.insertMany([
    {
      actorId: new ObjectId('100000000000000000000001'),
      action: 'OFFER_VIEWED',
      entityType: 'OFFER',
      entityId: offers.insertedIds[0].toString(),
      timestamp: new Date('2024-09-11T09:15:00Z'),
      details: { title: 'Développeur React Senior' }
    },
    {
      actorId: new ObjectId('100000000000000000000001'),
      action: 'APPLICATION_SUBMITTED',
      entityType: 'APPLICATION',
      entityId: applications.insertedIds[0].toString(),
      timestamp: new Date('2024-09-11T09:20:00Z'),
      details: { offerId: offers.insertedIds[0].toString() }
    },
    {
      actorId: new ObjectId('200000000000000000000001'),
      action: 'OFFER_CREATED',
      entityType: 'OFFER',
      entityId: offers.insertedIds[0].toString(),
      timestamp: new Date('2024-09-10T08:00:00Z'),
      details: { title: 'Développeur React Senior', company: 'Tunisie Software' }
    },
    {
      actorId: new ObjectId('200000000000000000000001'),
      action: 'APPLICATION_STATUS_UPDATED',
      entityType: 'APPLICATION',
      entityId: applications.insertedIds[0].toString(),
      timestamp: new Date('2024-09-12T14:30:00Z'),
      details: { oldStatus: 'ENVOYEE', newStatus: 'VERIFIE' }
    },
    {
      actorId: new ObjectId('000000000000000000000001'),
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: new ObjectId('100000000000000000000001').toString(),
      timestamp: new Date('2024-02-15T10:00:00Z'),
      details: { email: 'ahmed.ben.ali@email.tn', role: 'CANDIDATE' }
    }
  ]);

  console.log(`✅ ${auditLogs.insertedIds.length} logs d'audit créés\n`);

  // ===== RÉSUMÉ FINAL =====
  console.log('\n========================================');
  console.log('        RÉSUMÉ DU SEED DE DONNÉES');
  console.log('========================================\n');

  console.log('✅ Utilisateurs:           ' + users.insertedIds.length);
  console.log('✅ Profils Candidats:      ' + candidateProfiles.insertedIds.length);
  console.log('✅ Profils Entreprises:    ' + companyProfiles.insertedIds.length);
  console.log('✅ Offres d\'emploi:       ' + offers.insertedIds.length);
  console.log('✅ Candidatures:           ' + applications.insertedIds.length);
  console.log('✅ Vérifications:          ' + verifications.insertedIds.length);
  console.log('✅ Refresh Tokens:         ' + refreshTokens.insertedIds.length);
  console.log('✅ Notifications:          ' + notifications.insertedIds.length);
  console.log('✅ Logs d\'audit:           ' + auditLogs.insertedIds.length);

  const total = users.insertedIds.length + 
                candidateProfiles.insertedIds.length + 
                companyProfiles.insertedIds.length +
                offers.insertedIds.length +
                applications.insertedIds.length +
                verifications.insertedIds.length +
                refreshTokens.insertedIds.length +
                notifications.insertedIds.length +
                auditLogs.insertedIds.length;

  console.log('\n========================================');
  console.log(`  🎉 ${total} DOCUMENTS CRÉÉS AVEC SUCCÈS`);
  console.log('========================================\n');

  console.log('📝 Test de connexion:\n');
  console.log('Admin:');
  console.log('  Email: admin@rhconnect.tn');
  console.log('  Mot de passe: rhconnect@123\n');

  console.log('Candidat:');
  console.log('  Email: ahmed.ben.ali@email.tn');
  console.log('  Mot de passe: rhconnect@123\n');

  console.log('Entreprise:');
  console.log('  Email: rh@tunisie-soft.tn');
  console.log('  Mot de passe: rhconnect@123\n');
}

async function main() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log(`✅ Connecté à MongoDB: ${MONGO_URL}`);

    const db = client.db(DB_NAME);

    // Drop collections
    await dropAllCollections(db);

    // Seed data
    await seedData(db);

    console.log('\n✅ Seed terminé avec succès!\n');
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connexion MongoDB fermée.');
  }
}

main();
