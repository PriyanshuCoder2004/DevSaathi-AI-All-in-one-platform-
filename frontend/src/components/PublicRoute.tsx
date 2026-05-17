import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullScreenLoader from './FullScreenLoader';
import { ROUTES } from '../constants/routes';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialLoading } = useAuth();

  if (isInitialLoading) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    // If logged in, redirect to dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
