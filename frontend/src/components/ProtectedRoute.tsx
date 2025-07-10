import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonSpinner } from '@ionic/react';

interface ProtectedRouteProps {
  exact?: boolean;
  path: string;
  children: React.ReactNode;
  requiresComplete?: boolean; // Require completed registration
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  exact, 
  path, 
  children, 
  requiresComplete = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiresComplete && user && !user.is_complete) {
    // Redirect to appropriate signup step
    const nextStep = user.signup_step >= 1 ? '/signup3' : '/signup2';
    return <Redirect to={nextStep} />;
  }

  return (
    <Route exact={exact} path={path}>
      {children}
    </Route>
  );
};

export default ProtectedRoute;
