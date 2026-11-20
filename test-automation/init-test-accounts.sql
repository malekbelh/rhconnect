-- ============================================================================
-- Script d'Initialisation des Comptes de Test
-- ============================================================================
-- 
-- Ce script crée les comptes nécessaires pour exécuter les tests E2E.
-- 
-- Mots de passe bcrypt (Password123!):
-- $2a$10$5u0OKQqzYczHsgqFI7i0mOWL7TclKJKmLdQhBcRx7D7qFz8CJ3l3W
--
-- ============================================================================

-- 1. CANDIDAT COMPLET (Vérifié)
-- ============================================================================

INSERT IGNORE INTO users (
  id, email, password_hash, first_name, last_name, phone, 
  role, status, created_at, updated_at
) VALUES (
  UUID(),
  'candidat-complet@test.fr',
  '$2a$10$5u0OKQqzYczHsgqFI7i0mOWL7TclKJKmLdQhBcRx7D7qFz8CJ3l3W',
  'Jean',
  'Dupont',
  '+216 90 123 4567',
  'CANDIDATE',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Récupérer l'ID du candidat
SET @candidate_id = (
  SELECT id FROM users WHERE email = 'candidat-complet@test.fr'
);

-- Profil candidat complet
INSERT IGNORE INTO candidates (
  user_id, title, sector, experience_level, bio, phone,
  created_at, updated_at
) VALUES (
  @candidate_id,
  'Développeur Full Stack',
  'Informatique',
  'JUNIOR',
  'Développeur passionné avec 3 ans d\'expérience en web',
  '+216 90 123 4567',
  NOW(),
  NOW()
);

-- Compétences
INSERT IGNORE INTO candidate_skills (candidate_id, skill_name) VALUES
  (@candidate_id, 'React'),
  (@candidate_id, 'Node.js'),
  (@candidate_id, 'TypeScript'),
  (@candidate_id, 'JavaScript'),
  (@candidate_id, 'PostgreSQL');

-- CV (optionnel - fichier dummy)
INSERT IGNORE INTO candidate_documents (
  candidate_id, document_type, file_name, file_url, created_at
) VALUES (
  @candidate_id,
  'CV',
  'cv-dupont-jean.pdf',
  'file:///documents/cv-test.pdf',
  NOW()
);

-- Vérification candidat (VALIDE)
INSERT IGNORE INTO verifications (
  candidate_id, status, checklist, created_at, updated_at
) VALUES (
  @candidate_id,
  'VALIDE',
  JSON_OBJECT(
    'firstName', true,
    'lastName', true,
    'phone', true,
    'email', true,
    'competences', true,
    'cv', true
  ),
  NOW(),
  NOW()
);

-- ============================================================================
-- 2. ENTREPRISE (Actif et Vérifié)
-- ============================================================================

INSERT IGNORE INTO users (
  id, email, password_hash, first_name, last_name, phone,
  role, status, created_at, updated_at
) VALUES (
  UUID(),
  'recruteur@entreprise-test.fr',
  '$2a$10$5u0OKQqzYczHsgqFI7i0mOWL7TclKJKmLdQhBcRx7D7qFz8CJ3l3W',
  'Recruteur',
  'Test',
  '+216 90 234 5678',
  'COMPANY',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Récupérer l'ID de l'entreprise
SET @company_id = (
  SELECT id FROM users WHERE email = 'recruteur@entreprise-test.fr'
);

-- Profil entreprise
INSERT IGNORE INTO companies (
  user_id, company_name, sector, size, address,
  description, website, status, created_at, updated_at
) VALUES (
  @company_id,
  'TechCorp Tunisia',
  'Informatique',
  'SMALL',
  'Tunis, Tunisie',
  'Entreprise technologique spécialisée en développement web et mobile',
  'https://techcorp-tunisia.test',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Récupérer l'ID de l'entreprise (depuis companies)
SET @company_db_id = (
  SELECT id FROM companies WHERE user_id = @company_id
);

-- Vérification entreprise (VALIDE)
INSERT IGNORE INTO company_verifications (
  company_id, status, created_at, updated_at
) VALUES (
  @company_db_id,
  'VALIDE',
  NOW(),
  NOW()
);

-- Créer une offre d'emploi ACTIVE
INSERT IGNORE INTO offers (
  id, company_id, title, description, required_skills,
  min_experience, location, salary_min, salary_max,
  status, created_at, updated_at
) VALUES (
  UUID(),
  @company_db_id,
  'Développeur Full Stack Junior',
  'Nous recherchons un développeur Full Stack junior pour rejoindre notre équipe. Vous travaillerez avec React et Node.js.',
  JSON_ARRAY('React', 'Node.js', 'TypeScript'),
  2,
  'Tunis',
  2000,
  3500,
  'ACTIVE',
  NOW(),
  NOW()
);

-- ============================================================================
-- 3. ADMIN / RECRUITER
-- ============================================================================

INSERT IGNORE INTO users (
  id, email, password_hash, first_name, last_name,
  role, status, created_at, updated_at
) VALUES (
  UUID(),
  'admin@rhconnect.local',
  '$2a$10$5u0OKQqzYczHsgqFI7i0mOWL7TclKJKmLdQhBcRx7D7qFz8CJ3l3W',
  'Admin',
  'System',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);

-- ============================================================================
-- 4. CANDIDAT INCOMPLET (Non Vérifié - pour test règles métier)
-- ============================================================================

INSERT IGNORE INTO users (
  id, email, password_hash, first_name, last_name,
  role, status, created_at, updated_at
) VALUES (
  UUID(),
  'candidat-incomplet@test.fr',
  '$2a$10$5u0OKQqzYczHsgqFI7i0mOWL7TclKJKmLdQhBcRx7D7qFz8CJ3l3W',
  'Marie',
  'Petit',
  'CANDIDATE',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Récupérer l'ID du candidat incomplet
SET @candidate_incomplete_id = (
  SELECT id FROM users WHERE email = 'candidat-incomplet@test.fr'
);

-- Profil candidat incomplet (volontairement incomplet)
INSERT IGNORE INTO candidates (
  user_id, title, sector, experience_level,
  created_at, updated_at
) VALUES (
  @candidate_incomplete_id,
  'Développeur',
  'Informatique',
  'JUNIOR',
  NOW(),
  NOW()
);

-- Pas de CV pour ce candidat
-- Pas de compétences pour ce candidat

-- Vérification candidat (EN_ATTENTE)
INSERT IGNORE INTO verifications (
  candidate_id, status, checklist, created_at, updated_at
) VALUES (
  @candidate_incomplete_id,
  'EN_ATTENTE',
  JSON_OBJECT(
    'firstName', true,
    'lastName', true,
    'phone', false,    -- Manquant
    'email', true,
    'competences', false,  -- Manquant
    'cv', false        -- Manquant
  ),
  NOW(),
  NOW()
);

-- ============================================================================
-- Résumé des comptes créés
-- ============================================================================
--
-- CANDIDAT COMPLET:
--   Email: candidat-complet@test.fr
--   Password: Password123!
--   Statut: VALIDE (vérifié)
--   Profil: 100% complet
--
-- CANDIDAT INCOMPLET:
--   Email: candidat-incomplet@test.fr
--   Password: Password123!
--   Statut: EN_ATTENTE (non vérifié)
--   Profil: Incomplet (pas de CV, pas de compétences)
--
-- ENTREPRISE:
--   Email: recruteur@entreprise-test.fr
--   Password: Password123!
--   Statut: ACTIVE et VALIDE (vérifié)
--   Offre: 1 offre "Développeur Full Stack Junior" (ACTIVE)
--
-- ADMIN:
--   Email: admin@rhconnect.local
--   Password: Password123!
--   Rôle: ADMIN
--
-- ============================================================================

SELECT 'Comptes de test créés avec succès !' AS status;
