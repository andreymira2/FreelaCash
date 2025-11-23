
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const isCompleted = localStorage.getItem('freelacash_profile_completed');
  const location = useLocation();

  if (!isCompleted) {
    // Redirect to setup profile, passing state if we want to know where they came from (optional)
    return <Navigate to="/setup-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
