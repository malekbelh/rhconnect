import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirige vers l'onglet vérification RNE intégré dans la page Profil Entreprise.
 */
const CompanyVerificationPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/company/profile?tab=verification', { replace: true });
  }, [navigate]);

  return null;
};

export default CompanyVerificationPage;
