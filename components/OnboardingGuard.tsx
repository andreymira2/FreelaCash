import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { userProfile, loading } = useData();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-[#C6FF3F] animate-pulse" />
      </div>
    );
  }

  const isProfileComplete = userProfile.name && userProfile.name !== 'Freelancer';

  if (!isProfileComplete) {
    return <Navigate to="/setup-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
