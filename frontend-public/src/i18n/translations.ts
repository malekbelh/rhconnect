export type Locale = 'fr' | 'en';

export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    logout: string;
  };

  // Navigation & Sidebar
  nav: {
    dashboard: string;
    applications: string;
    offers: string;
    profile: string;
    settings: string;
    notifications: string;
    verification: string;
    aiAssistant: string;
    overview: string;
    recruitment: string;
    ai: string;
    system: string;
    myProfile: string;
    jobOffers: string;
    myApplications: string;
    documents: string;
    recruiterSpace: string;
    hrDashboard: string;
    companyProfile: string;
    offerManagement: string;
    receivedApplications: string;
    fileFolders: string;
    kbisVerification: string;
    teamSystem: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    applications: string;
    offers: string;
  };

  // Offers Page
  offers: {
    title: string;
    searchPlaceholder: string;
    noOffers: string;
  };

  // Applications Page
  applications: {
    title: string;
    status: string;
    noApplications: string;
  };

  // Profile Page
  profile: {
    title: string;
    editProfile: string;
    uploadDocument: string;
  };

  // Verification Page
  verification: {
    title: string;
    pendingVerification: string;
    verified: string;
  };

  // Settings Page
  settings: {
    title: string;
    subtitle: string;
    notifications: string;
    confidentiality: string;
    security: string;
    language: string;
    account: string;

    notif_title: string;
    notif_subtitle: string;
    notif_applications: string;
    notif_applications_desc: string;
    notif_offers: string;
    notif_offers_desc: string;
    notif_messages: string;
    notif_messages_desc: string;
    notif_push: string;
    notif_push_desc: string;

    conf_title: string;
    conf_subtitle: string;
    conf_profile: string;
    conf_profile_desc: string;
    conf_cv: string;
    conf_cv_desc: string;

    sec_title: string;
    sec_email_title: string;
    sec_email_current: string;
    sec_email_new: string;
    sec_email_button: string;
    sec_email_success: string;
    sec_email_password: string;
    sec_email_new_placeholder: string;
    sec_email_password_placeholder: string;
    sec_password_title: string;
    sec_password_subtitle: string;
    sec_password_current: string;
    sec_password_new: string;
    sec_password_confirm: string;
    sec_password_button: string;
    sec_password_mismatch: string;
    sec_password_strength: string;
    sec_password_current_placeholder: string;
    sec_password_new_placeholder: string;
    sec_password_confirm_placeholder: string;

    lang_title: string;
    lang_subtitle: string;
    lang_preferred: string;
    lang_french: string;
    lang_english: string;

    acc_title: string;
    acc_info_title: string;
    acc_email_label: string;
    acc_role_label: string;
    acc_role_candidate: string;
    acc_delete_title: string;
    acc_delete_subtitle: string;
    acc_delete_button: string;
    acc_delete_confirm: string;
    acc_delete_confirm_placeholder: string;
    acc_delete_password_placeholder: string;
    acc_delete_cancel: string;
    acc_delete_final: string;

    sec_password_minlength: string;
    sec_password_success: string;
    sec_password_policy_desc: string;

    err_email_required: string;
    err_email_invalid: string;
    err_password_required: string;
    err_current_password_wrong: string;
    err_delete_confirm_mismatch: string;
    err_password_policy: string;
    err_update_failed: string;
    unsaved_changes: string;
  };

  // Notifications Page
  notifications: {
    title: string;
    noNotifications: string;
  };

  // AI Assistant
  aiAssistant: {
    title: string;
    askQuestion: string;
  };

  // Company Pages
  company: {
    dashboard: {
      loading: string;
      profileCompletion: string;
      missingElements: string;
      profileComplete: string;
      editProfile: string;
      newOffer: string;
      activeOffers: string;
      online: string;
      applications: string;
      total: string;
      allOffers: string;
      published: string;
      recent: string;
      thisWeek: string;
      receivedApplications: string;
      noApplications: string;
      createOffer: string;
      noActiveOffers: string;
      management: string;
      statistics: string;
      viewMore: string;
      manageApplications: string;
      aiAssistant: string;
      offerWritingHelp: string;
    };
    profile: {
      companyName: string;
      matriculeFiscal: string;
      description: string;
      sector: string;
      size: string;
      address: string;
      website: string;
      email: string;
      phone: string;
      logo: string;
      uploadLogo: string;
      logoFormats: string;
      save: string;
      profileUpdated: string;
      info: string;
      contact: string;
      noLogo: string;
      loading: string;
      logoUploaded: string;
      uploadError: string;
      loadingError: string;
      saveError: string;
      descriptionPlaceholder: string;
      selectSector: string;
      selectSize: string;
      websiteLabel: string;
      tabInfo: string;
      tabContact: string;
      tabLogo: string;
    };
    verification: {
      title: string;
      description: string;
      uploadDocument: string;
      documentType: string;
      rca: string;
      statuts: string;
      certification: string;
      otherDocument: string;
      registeredDocuments: string;
      submitted: string;
      verification: string;
      company: {
        verified: string;
        inVerification: string;
        uploadedRecently: string;
        delayedExamination: string;
      };
      uploadSuccess: string;
      uploadError: string;
      selectDocumentType: string;
      dragDropLabel: string;
      fileHint: string;
      submitButton: string;
      loading: string;
      registeredCount: string;
      historyDescription: string;
      uploadedOn: string;
      statusValidated: string;
      statusRejected: string;
      statusInProgress: string;
      statusPending: string;
      privacyNotice: string;
    };
  };
}

export const translations: Record<Locale, Translations> = {
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      logout: 'Déconnexion',
    },
    nav: {
      dashboard: 'Tableau de bord',
      applications: 'Candidatures',
      offers: 'Offres',
      profile: 'Profil',
      settings: 'Paramètres',
      notifications: 'Notifications',
      verification: 'Vérification',
      aiAssistant: 'Assistant IA',
      overview: 'Vue d\'ensemble',
      recruitment: 'Recrutement',
      ai: 'Intelligence Artificielle',
      system: 'Système',
      myProfile: 'Mon Profil',
      jobOffers: 'Offres d\'emploi',
      myApplications: 'Mes candidatures',
      documents: 'Vérification & Pièces',
      recruiterSpace: 'Espace Recruteur',
      hrDashboard: 'Dashboard RH',
      companyProfile: 'Profil Entreprise',
      offerManagement: 'Gestion des offres',
      receivedApplications: 'Candidatures reçues',
      fileFolders: 'Suivi des dossiers',
      kbisVerification: 'Vérification RNE',
      teamSystem: 'Système & Équipe',
    },
    dashboard: {
      title: 'Tableau de bord',
      welcome: 'Bienvenue sur votre espace candidat',
      applications: 'Mes candidatures',
      offers: 'Offres pour vous',
    },
    offers: {
      title: 'Offres d\'emploi',
      searchPlaceholder: 'Rechercher une offre...',
      noOffers: 'Aucune offre disponible',
    },
    applications: {
      title: 'Mes candidatures',
      status: 'Statut',
      noApplications: 'Aucune candidature',
    },
    profile: {
      title: 'Mon profil',
      editProfile: 'Modifier le profil',
      uploadDocument: 'Télécharger un document',
    },
    verification: {
      title: 'Vérification de compte',
      pendingVerification: 'En attente de vérification',
      verified: 'Vérifié',
    },
    settings: {
      title: 'Paramètres du compte',
      subtitle: 'Gérez vos préférences et la sécurité de vos données',
      notifications: 'Notifications & Alertes',
      confidentiality: 'Confidentialité & Visibilité',
      security: 'Sécurité & Accès',
      language: 'Langue & Préférences',
      account: 'Gestion du compte',

      notif_title: 'Notifications & Alertes',
      notif_subtitle: 'Choisissez comment vous souhaitez être notifié',
      notif_applications: 'Mises à jour des candidatures',
      notif_applications_desc: 'Recevez des alertes sur l\'état de vos candidatures',
      notif_offers: 'Nouvelles offres recommandées',
      notif_offers_desc: 'Recevez les offres qui correspondent à votre profil',
      notif_messages: 'Demandes de rendez-vous',
      notif_messages_desc: 'Recevez les demandes d\'entretien immédiatement',
      notif_push: 'Notifications navigateur',
      notif_push_desc: 'Recevez les alertes en temps réel',

      conf_title: 'Visibilité du profil',
      conf_subtitle: 'Contrôlez qui peut voir votre profil',
      conf_profile: 'Profil visible aux recruteurs',
      conf_profile_desc: 'Permettre aux recruteurs de trouver votre profil',
      conf_cv: 'Téléchargement du CV autorisé',
      conf_cv_desc: 'Permettre le téléchargement direct de votre CV',

      sec_title: 'Sécurité & Accès',
      sec_email_title: 'Modifier mon email',
      sec_email_current: 'Email actuel',
      sec_email_new: 'Nouvel email',
      sec_email_button: 'Mettre à jour l\'email',
      sec_email_success: 'Email changé avec succès. Veuillez vous reconnecter.',
      sec_email_password: 'Mot de passe',
      sec_email_new_placeholder: 'Entrez votre nouvel email',
      sec_email_password_placeholder: 'Entrez votre mot de passe pour confirmer',
      sec_password_title: 'Modifier mon mot de passe',
      sec_password_subtitle: 'Changez votre mot de passe régulièrement pour sécuriser votre compte',
      sec_password_current: 'Mot de passe actuel',
      sec_password_new: 'Nouveau mot de passe',
      sec_password_confirm: 'Confirmer le mot de passe',
      sec_password_button: 'Modifier le mot de passe',
      sec_password_mismatch: 'Les mots de passe ne correspondent pas',
      sec_password_strength: 'Longueur min. 8 caractères, avec majuscule, chiffre et symbole recommandés',
      sec_password_current_placeholder: 'Entrez votre mot de passe actuel',
      sec_password_new_placeholder: 'Entrez un nouveau mot de passe (min. 8 caractères)',
      sec_password_confirm_placeholder: 'Confirmez votre nouveau mot de passe',

      lang_title: 'Langue & Région',
      lang_subtitle: 'Choisissez votre langue préférée',
      lang_preferred: 'Langue préférée',
      lang_french: 'Français',
      lang_english: 'Anglais',

      acc_title: 'Informations du compte',
      acc_info_title: 'Détails du compte & Profil',
      acc_email_label: 'Email',
      acc_role_label: 'Rôle',
      acc_role_candidate: 'Candidat',
      acc_delete_title: 'Supprimer mon compte',
      acc_delete_subtitle: 'Cette action est irréversible. Toutes vos candidatures, documents et données de profil seront définitivement effacés.',
      acc_delete_button: 'Supprimer mon compte',
      acc_delete_confirm: 'Pour confirmer, veuillez taper "SUPPRIMER" ci-dessous ainsi que votre mot de passe actuel.',
      acc_delete_confirm_placeholder: 'Tapez SUPPRIMER pour confirmer',
      acc_delete_password_placeholder: 'Votre mot de passe actuel',
      acc_delete_cancel: 'Annuler',
      acc_delete_final: 'Confirmer la suppression définitive',

      sec_password_minlength: 'Le mot de passe doit contenir au moins 10 caractères.',
      sec_password_success: 'Votre mot de passe a été modifié avec succès.',
      sec_password_policy_desc: 'Le mot de passe doit comporter au moins 10 caractères avec majuscule, minuscule, chiffre et caractère spécial.',

      err_email_required: 'Veuillez entrer une adresse email valide.',
      err_email_invalid: 'Format d\'adresse email invalide.',
      err_password_required: 'Veuillez entrer votre mot de passe pour confirmer.',
      err_current_password_wrong: 'Le mot de passe actuel est incorrect.',
      err_delete_confirm_mismatch: 'Veuillez taper "SUPPRIMER" exactement pour confirmer.',
      err_password_policy: 'Le mot de passe ne respecte pas les critères de sécurité.',
      err_update_failed: 'Une erreur est survenue lors de la mise à jour.',
      unsaved_changes: 'Modifications non enregistrées',
    },
    notifications: {
      title: 'Notifications',
      noNotifications: 'Aucune notification',
    },
    aiAssistant: {
      title: 'Assistant IA',
      askQuestion: 'Posez une question...',
    },
    company: {
      dashboard: {
        loading: 'Chargement de votre espace...',
        profileCompletion: 'Complétion du profil',
        missingElements: 'Éléments manquants',
        profileComplete: 'Profil 100% complété — Vos offres sont prioritaires dans les résultats.',
        editProfile: 'Modifier le profil',
        newOffer: 'Nouvelle offre',
        activeOffers: 'Offres actives',
        online: 'En ligne',
        applications: 'Candidatures',
        total: 'Totales',
        allOffers: 'Toutes offres',
        published: 'Publiées',
        recent: 'Récentes',
        thisWeek: 'Cette semaine',
        receivedApplications: 'Candidatures reçues',
        noApplications: 'Aucune candidature reçue',
        createOffer: 'Créer une offre',
        noActiveOffers: 'Aucune offre active',
        management: 'Gestion des offres',
        statistics: 'Statistiques',
        viewMore: 'Voir plus',
        manageApplications: 'Gérer les candidatures',
        aiAssistant: 'Assistant IA',
        offerWritingHelp: 'Aide à la rédaction d\'offres et synthèse de dossiers de candidats.',
      },
      profile: {
        companyName: 'Nom de l\'entreprise',
        matriculeFiscal: 'Matricule Fiscal (Identifiant unique)',
        description: 'Description / Présentation',
        sector: 'Secteur d\'activité',
        size: 'Taille de l\'entreprise',
        address: 'Adresse / Localisation en Tunisie',
        website: 'Site web',
        email: 'Email',
        phone: 'Téléphone',
        logo: 'Logo',
        uploadLogo: 'Téléverser un logo',
        logoFormats: 'PNG, JPG, GIF jusqu\'à 5MB. Carré ou rectangle.',
        save: 'Sauvegarder',
        profileUpdated: 'Profil mis à jour avec succès !',
        info: 'Informations',
        contact: 'Contact',
        noLogo: 'Pas encore de logo',
        loading: 'Chargement de votre profil...',
        logoUploaded: 'Logo téléversé avec succès !',
        uploadError: 'Erreur lors du téléchargement',
        loadingError: 'Erreur lors du chargement',
        saveError: 'Erreur lors de la sauvegarde',
        descriptionPlaceholder: 'Décrivez votre entreprise, vos valeurs, votre mission en Tunisie...',
        selectSector: 'Sélectionner un secteur',
        selectSize: 'Sélectionner la taille',
        websiteLabel: 'Site web',
        tabInfo: 'Informations',
        tabContact: 'Contact',
        tabLogo: 'Logo',
      },
      verification: {
        title: 'Vérification entreprise',
        description: 'Déposez vos documents officiels (RCA, statuts, certifications) pour obtenir le badge "Entreprise vérifiée".',
        uploadDocument: 'Ajouter un document justificatif',
        documentType: 'Type de pièce justificative',
        rca: 'Registre de Commerce et d\'Artisanat (RCA)',
        statuts: 'Statuts de la société',
        certification: 'Certification professionnelle',
        otherDocument: 'Autre document officiel',
        registeredDocuments: 'Documents enregistrés',
        submitted: 'Déposé le',
        verification: 'En cours de vérification',
        company: {
          verified: 'Entreprise vérifiée & certifiée',
          inVerification: 'Dossier en cours d\'examen',
          uploadedRecently: 'Tous vos documents ont été validés avec succès. Votre badge "Entreprise vérifiée" est visible par les candidats.',
          delayedExamination: 'Vos documents sont en cours d\'examen par notre équipe. Délai moyen : 48h ouvrées.',
        },
        uploadSuccess: 'Document déposé avec succès. Il sera examiné par notre équipe.',
        uploadError: 'Le dépôt du document a échoué. Vérifiez votre connexion et réessayez.',
        selectDocumentType: 'Sélectionnez le type de document et déposez votre fichier (PDF, PNG ou JPEG, max 10MB).',
        dragDropLabel: 'Glissez-déposez votre document ici ou cliquez pour choisir',
        fileHint: 'Formats acceptés : PDF, PNG, JPG (Max 10MB)',
        submitButton: 'Soumettre pour vérification',
        loading: 'Vérification du dossier en cours...',
        registeredCount: 'Documents enregistrés',
        historyDescription: 'Historique des pièces rattachées à votre dossier',
        uploadedOn: 'Déposé le',
        statusValidated: 'Validé',
        statusRejected: 'Rejeté',
        statusInProgress: 'En cours de vérification',
        statusPending: 'En attente',
        privacyNotice: 'Vos données personnelles et justificatifs sont chiffrés et traités conformément aux réglementations sur la protection des données.',
      },
    },
  },

  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      logout: 'Logout',
    },
    nav: {
      dashboard: 'Dashboard',
      applications: 'Applications',
      offers: 'Offers',
      profile: 'Profile',
      settings: 'Settings',
      notifications: 'Notifications',
      verification: 'Verification',
      aiAssistant: 'AI Assistant',
      overview: 'Overview',
      recruitment: 'Recruitment',
      ai: 'Artificial Intelligence',
      system: 'System',
      myProfile: 'My Profile',
      jobOffers: 'Job Offers',
      myApplications: 'My Applications',
      documents: 'Verification & Files',
      recruiterSpace: 'Recruiter Space',
      hrDashboard: 'HR Dashboard',
      companyProfile: 'Company Profile',
      offerManagement: 'Offer Management',
      receivedApplications: 'Received Applications',
      fileFolders: 'File Tracking',
      kbisVerification: 'RNE Verification',
      teamSystem: 'System & Team',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to your candidate space',
      applications: 'My applications',
      offers: 'Offers for you',
    },
    offers: {
      title: 'Job Offers',
      searchPlaceholder: 'Search for an offer...',
      noOffers: 'No offers available',
    },
    applications: {
      title: 'My Applications',
      status: 'Status',
      noApplications: 'No applications',
    },
    profile: {
      title: 'My Profile',
      editProfile: 'Edit profile',
      uploadDocument: 'Upload document',
    },
    verification: {
      title: 'Account Verification',
      pendingVerification: 'Pending verification',
      verified: 'Verified',
    },
    settings: {
      title: 'Account Settings',
      subtitle: 'Manage your preferences and data security',
      notifications: 'Notifications & Alerts',
      confidentiality: 'Confidentiality & Visibility',
      security: 'Security & Access',
      language: 'Language & Preferences',
      account: 'Account Management',

      notif_title: 'Notifications & Alerts',
      notif_subtitle: 'Choose how you want to be notified',
      notif_applications: 'Application updates',
      notif_applications_desc: 'Receive alerts about your applications',
      notif_offers: 'Recommended job offers',
      notif_offers_desc: 'Receive offers that match your profile',
      notif_messages: 'Interview requests',
      notif_messages_desc: 'Receive interview requests immediately',
      notif_push: 'Browser notifications',
      notif_push_desc: 'Receive real-time alerts',

      conf_title: 'Profile Visibility',
      conf_subtitle: 'Control who can see your profile',
      conf_profile: 'Profile visible to recruiters',
      conf_profile_desc: 'Allow recruiters to find your profile',
      conf_cv: 'CV download allowed',
      conf_cv_desc: 'Allow direct download of your CV',

      sec_title: 'Security & Access',
      sec_email_title: 'Change my email',
      sec_email_current: 'Current email',
      sec_email_new: 'New email',
      sec_email_button: 'Update email',
      sec_email_success: 'Email changed successfully. Please log in again.',
      sec_email_password: 'Password',
      sec_email_new_placeholder: 'Enter your new email',
      sec_email_password_placeholder: 'Enter your password to confirm',
      sec_password_title: 'Change my password',
      sec_password_subtitle: 'Change your password regularly to secure your account',
      sec_password_current: 'Current password',
      sec_password_new: 'New password',
      sec_password_confirm: 'Confirm password',
      sec_password_button: 'Change password',
      sec_password_mismatch: 'Passwords do not match',
      sec_password_strength: 'Min. 8 characters, with uppercase, number and special character recommended',
      sec_password_current_placeholder: 'Enter your current password',
      sec_password_new_placeholder: 'Enter a new password (min. 8 characters)',
      sec_password_confirm_placeholder: 'Confirm your new password',

      lang_title: 'Language & Region',
      lang_subtitle: 'Choose your preferred language',
      lang_preferred: 'Preferred language',
      lang_french: 'French',
      lang_english: 'English',

      acc_title: 'Account Information',
      acc_info_title: 'Account Details & Profile',
      acc_email_label: 'Email',
      acc_role_label: 'Role',
      acc_role_candidate: 'Candidate',
      acc_delete_title: 'Delete My Account',
      acc_delete_subtitle: 'This action is irreversible. All your job applications, documents, and profile data will be permanently removed.',
      acc_delete_button: 'Delete Account',
      acc_delete_confirm: 'To confirm, please type "DELETE" or "SUPPRIMER" below along with your current password.',
      acc_delete_confirm_placeholder: 'Type DELETE to confirm',
      acc_delete_password_placeholder: 'Your current password',
      acc_delete_cancel: 'Cancel',
      acc_delete_final: 'Confirm Permanent Deletion',

      sec_password_minlength: 'Password must contain at least 10 characters.',
      sec_password_success: 'Password updated successfully.',
      sec_password_policy_desc: 'Password must be at least 10 characters long with uppercase, lowercase, number, and special character.',

      err_email_required: 'Please enter a valid email address.',
      err_email_invalid: 'Invalid email address format.',
      err_password_required: 'Please enter your password to confirm.',
      err_current_password_wrong: 'Current password is incorrect.',
      err_delete_confirm_mismatch: 'Please type "DELETE" or "SUPPRIMER" to confirm.',
      err_password_policy: 'Password does not meet security requirements.',
      err_update_failed: 'An error occurred while updating.',
      unsaved_changes: 'Unsaved changes',
    },
    notifications: {
      title: 'Notifications',
      noNotifications: 'No notifications',
    },
    aiAssistant: {
      title: 'AI Assistant',
      askQuestion: 'Ask a question...',
    },
    company: {
      dashboard: {
        loading: 'Loading your space...',
        profileCompletion: 'Profile Completion',
        missingElements: 'Missing Elements',
        profileComplete: '100% Complete Profile — Your offers are prioritized in search results.',
        editProfile: 'Edit Profile',
        newOffer: 'New Offer',
        activeOffers: 'Active Offers',
        online: 'Online',
        applications: 'Applications',
        total: 'Total',
        allOffers: 'All Offers',
        published: 'Published',
        recent: 'Recent',
        thisWeek: 'This Week',
        receivedApplications: 'Received Applications',
        noApplications: 'No applications received',
        createOffer: 'Create an Offer',
        noActiveOffers: 'No active offers',
        management: 'Offer Management',
        statistics: 'Statistics',
        viewMore: 'View All',
        manageApplications: 'Manage Applications',
        aiAssistant: 'AI Assistant',
        offerWritingHelp: 'Help writing job offers and summarizing candidate files.',
      },
      profile: {
        companyName: 'Company Name',
        matriculeFiscal: 'Tax ID (Unique Identifier)',
        description: 'Description / Presentation',
        sector: 'Business Sector',
        size: 'Company Size',
        address: 'Address / Location in Tunisia',
        website: 'Website',
        email: 'Email',
        phone: 'Phone',
        logo: 'Logo',
        uploadLogo: 'Upload a Logo',
        logoFormats: 'PNG, JPG, GIF up to 5MB. Square or rectangle.',
        save: 'Save',
        profileUpdated: 'Profile updated successfully!',
        info: 'Information',
        contact: 'Contact',
        noLogo: 'No logo yet',
        loading: 'Loading your profile...',
        logoUploaded: 'Logo uploaded successfully!',
        uploadError: 'Upload error',
        loadingError: 'Loading error',
        saveError: 'Saving error',
        descriptionPlaceholder: 'Describe your company, values, and mission in Tunisia...',
        selectSector: 'Select a sector',
        selectSize: 'Select company size',
        websiteLabel: 'Website',
        tabInfo: 'Information',
        tabContact: 'Contact',
        tabLogo: 'Logo',
      },
      verification: {
        title: 'Company Verification',
        description: 'Submit official documents (RCA, bylaws, certifications) to get the "Verified Company" badge.',
        uploadDocument: 'Add a Supporting Document',
        documentType: 'Type of Document',
        rca: 'Business Register (RCA)',
        statuts: 'Company Bylaws',
        certification: 'Professional Certification',
        otherDocument: 'Other Official Document',
        registeredDocuments: 'Registered Documents',
        submitted: 'Submitted on',
        verification: 'Under Verification',
        company: {
          verified: 'Verified & Certified Company',
          inVerification: 'File Under Review',
          uploadedRecently: 'All your documents have been successfully validated. Your "Verified Company" badge is visible to candidates.',
          delayedExamination: 'Your documents are being reviewed by our team. Average time: 48 business hours.',
        },
        uploadSuccess: 'Document submitted successfully. It will be reviewed by our team.',
        uploadError: 'Document submission failed. Check your connection and try again.',
        selectDocumentType: 'Select the document type and upload your file (PDF, PNG or JPEG, max 10MB).',
        dragDropLabel: 'Drag and drop your document here or click to select',
        fileHint: 'Accepted formats: PDF, PNG, JPG (Max 10MB)',
        submitButton: 'Submit for Verification',
        loading: 'Verifying your file...',
        registeredCount: 'Registered Documents',
        historyDescription: 'History of documents attached to your file',
        uploadedOn: 'Uploaded on',
        statusValidated: 'Validated',
        statusRejected: 'Rejected',
        statusInProgress: 'Under Review',
        statusPending: 'Pending',
        privacyNotice: 'Your personal data and supporting documents are encrypted and processed in compliance with data protection regulations.',
      },
    },
  },
};

export const getTranslation = (locale: Locale): Translations => {
  return translations[locale] || translations.fr;
};
