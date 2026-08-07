import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../../types';

interface ProtectedRouteProps {
  currentUser: User | null;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  allowedRoles,
  children,
}) => {
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(currentUser.role);
    if (!hasPermission) {
      if (currentUser.role === 'student') return <Navigate to="/student" replace />;
      if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
      if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
      if (currentUser.role === 'super_admin') return <Navigate to="/super-admin" replace />;
      return <Navigate to="/student" replace />;
    }
  }

  return <>{children}</>;
};
