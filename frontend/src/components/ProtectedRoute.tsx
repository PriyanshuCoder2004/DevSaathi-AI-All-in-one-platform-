import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import FullScreenLoader from './FullScreenLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isInitialLoading } = useAuth();
  const location = useLocation();

  if (isInitialLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
