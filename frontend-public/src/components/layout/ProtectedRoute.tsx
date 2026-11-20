import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'CANDIDATE' | 'COMPANY' | 'ADMIN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { accessToken, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || (user?.roles && user.roles[0]);

  if (requireRole && user) {
    let hasRole = false;
    
    if (requireRole === 'CANDIDATE') {
      hasRole = userRole === 'CANDIDATE' || (Array.isArray(user?.roles) && user.roles.includes('CANDIDATE'));
    } else if (requireRole === 'COMPANY') {
      // COMPANY routes accept both COMPANY and RECRUITER roles
      hasRole = userRole === 'COMPANY' || userRole === 'RECRUITER' || 
                (Array.isArray(user?.roles) && (user.roles.includes('COMPANY') || user.roles.includes('RECRUITER')));
    } else if (requireRole === 'ADMIN') {
      hasRole = userRole === 'ADMIN' || (Array.isArray(user?.roles) && user.roles.includes('ADMIN'));
    }

    if (!hasRole) {
      if (userRole === 'CANDIDATE') {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      if (userRole === 'COMPANY' || userRole === 'RECRUITER') {
        return <Navigate to="/company/dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
