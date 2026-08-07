import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import { User, UserRole } from '../../types';
import { Crown, Shield, UserCheck, GraduationCap } from 'lucide-react';

interface MainLayoutProps {
  currentUser: User | null;
  currentRole: UserRole;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAccountManagement: () => void;
  onOpenLeaderboard: () => void;
  onOpenGeminiSettings: () => void;
  onResetData?: () => void;
  activePublicHash?: string | null;
  onExitPublicView?: () => void;
  canNavigateBack?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUser,
  currentRole,
  isDarkMode,
  setIsDarkMode,
  onOpenLogin,
  onLogout,
  onOpenAccountManagement,
  onOpenLeaderboard,
  onOpenGeminiSettings,
  onResetData,
  activePublicHash,
  onExitPublicView,
  canNavigateBack,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateHome = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role === 'student') navigate('/student');
    else if (currentUser.role === 'teacher') navigate('/teacher');
    else if (currentUser.role === 'admin') navigate('/admin');
    else if (currentUser.role === 'super_admin') navigate('/super-admin');
    else navigate('/student');
  };

  const handleNavigateBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* 1. PERSISTENT GLOBAL HEADER BAR */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onOpenLogin={onOpenLogin}
        onLogout={onLogout}
        onOpenAccountManagement={onOpenAccountManagement}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenGeminiSettings={onOpenGeminiSettings}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetData={onResetData}
        activePublicHash={activePublicHash}
        onExitPublicView={onExitPublicView}
        onNavigateHome={handleNavigateHome}
        onNavigateBack={handleNavigateBack}
        canNavigateBack={canNavigateBack || location.pathname !== '/'}
      />

      {/* 2. SUPER ADMIN QUICK ROLE SWITCHER BAR (PERSISTENT ACROSS ROUTES) */}
      {currentUser && currentUser.role === 'super_admin' && !activePublicHash && (
        <div className="bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-sm font-medium gap-3 shadow-2xs">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Chuyển Giao Diện Xem (Super Admin Role Switcher):
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none shrink-0">
            <button
              onClick={() => navigate('/super-admin')}
              className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                location.pathname.startsWith('/super-admin')
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Crown className="w-3.5 h-3.5 mr-1.5" /> Super Admin
            </button>

            <button
              onClick={() => navigate('/admin')}
              className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                location.pathname.startsWith('/admin')
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Admin
            </button>

            <button
              onClick={() => navigate('/teacher')}
              className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                location.pathname.startsWith('/teacher')
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Giáo Viên
            </button>

            <button
              onClick={() => navigate('/student')}
              className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                location.pathname.startsWith('/student')
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Học Viên
            </button>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC NESTED CONTENT OUTLET */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        <Outlet />
      </main>
    </div>
  );
};
