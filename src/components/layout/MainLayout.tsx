import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from '../../lib/router';
import { Header } from '../common/Header';
import { Sidebar } from './Sidebar';
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      {!activePublicHash && (
        <Sidebar
          currentUser={currentUser}
          currentRole={currentRole}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          onOpenAccountManagement={onOpenAccountManagement}
          onOpenGeminiSettings={onOpenGeminiSettings}
        />
      )}

      {/* 2. MAIN CONTENT AREA (HEADER + OUTLET) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
        {/* TOP HEADER */}
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
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* SUPER ADMIN QUICK ROLE SWITCHER BAR */}
        {currentUser && currentUser.role === 'super_admin' && !activePublicHash && (
          <div className="bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between text-sm font-medium gap-2 shadow-2xs shrink-0">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                Giao Diện Xem Role (Super Admin):
              </span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none shrink-0">
              <button
                onClick={() => navigate('/super-admin')}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center shrink-0 border border-transparent cursor-pointer ${
                  location.pathname.startsWith('/super-admin')
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Crown className="w-3.5 h-3.5 mr-1" /> Super Admin
              </button>

              <button
                onClick={() => navigate('/admin')}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center shrink-0 border border-transparent cursor-pointer ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5 mr-1" /> Admin
              </button>

              <button
                onClick={() => navigate('/teacher')}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center shrink-0 border border-transparent cursor-pointer ${
                  location.pathname.startsWith('/teacher')
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" /> Giáo Viên
              </button>

              <button
                onClick={() => navigate('/student')}
                className={`h-8 px-3 rounded-xl text-xs font-bold transition flex items-center shrink-0 border border-transparent cursor-pointer ${
                  location.pathname.startsWith('/student')
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1" /> Học Viên
              </button>
            </div>
          </div>
        )}

        {/* DYNAMIC ROUTE CONTENT OUTLET */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
