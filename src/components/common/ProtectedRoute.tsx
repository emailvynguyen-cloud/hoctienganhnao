import React from 'react';
import { User, UserRole } from '../../types';
import { LoginModal } from '../auth/LoginModal';
import { StorageEngine } from '../../lib/storage';

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
  if (!currentUser) {
    return (
      <LoginModal
        isOpen={true}
        canClose={false}
        onClose={() => {}}
        onLoginSuccess={(user) => {
          StorageEngine.setCurrentUser(user);
          window.location.reload();
        }}
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(currentUser.role);
    if (!hasPermission) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
          <h2 className="text-lg font-black text-rose-600">Quyền Truy Cập Bị Hạn Chế</h2>
          <p className="text-xs text-slate-500 font-medium">
            Tài khoản của bạn ({currentUser.role}) không có quyền truy cập trang này.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};
