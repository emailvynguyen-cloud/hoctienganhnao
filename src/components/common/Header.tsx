import React from 'react';
import { UserRole, User } from '../../types';
import {
  Shield,
  GraduationCap,
  UserCheck,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Lock,
  LogOut,
  LogIn,
  Crown,
  Users,
  Trophy,
  Key,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  currentRole: UserRole;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAccountManagement: () => void;
  onOpenLeaderboard: () => void;
  onOpenGeminiSettings: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetData: () => void;
  activePublicHash?: string | null;
  onExitPublicView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onOpenLogin,
  onLogout,
  onOpenAccountManagement,
  onOpenLeaderboard,
  onOpenGeminiSettings,
  isDarkMode,
  setIsDarkMode,
  onResetData,
  activePublicHash,
  onExitPublicView,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-purple-950/90 border-b border-purple-100 dark:border-purple-900 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <img
                src="/logo.jpg"
                alt="Ms. Vy English Logo"
                className="w-13 h-13 rounded-2xl object-cover border-2 border-purple-200 dark:border-purple-700 shadow-md transform group-hover:scale-105 transition duration-300"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full border-2 border-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                  MS. VY ENGLISH
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border border-pink-200">
                  <Sparkles className="w-3 h-3 mr-1" /> ONLINE TRACKER
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-purple-300 hidden sm:block font-medium">
                Hiểu Từ Bản Chất • Nói Được Tự Tin • Theo Dõi Học Tập
              </p>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Gemini API Key Settings Button with Red Subtext */}
            <button
              onClick={onOpenGeminiSettings}
              className="px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition text-left flex flex-col items-start shadow-sm"
              title="Thiết lập Google Gemini API Key"
            >
              <div className="flex items-center text-rose-700 font-extrabold text-xs">
                <Key className="w-3.5 h-3.5 mr-1 text-rose-600" />
                <span>Settings (API Key)</span>
              </div>
              <span className="text-[9px] font-black text-rose-600 animate-pulse">
                Lấy API key để sử dụng app
              </span>
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={onOpenLeaderboard}
              className="px-3 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs transition flex items-center shadow-sm border border-amber-200"
              title="Xem Bảng Thành Tích Thi Đua"
            >
              <Trophy className="w-4 h-4 mr-1.5 text-amber-600 animate-bounce" />
              <span className="hidden md:inline">Thi Đua</span> Top
            </button>

            {/* If in Public Student Link View */}
            {activePublicHash ? (
              <button
                onClick={onExitPublicView}
                className="px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:from-purple-600 hover:to-pink-600 transition flex items-center"
              >
                ← Quay Về Trang Quản Lý
              </button>
            ) : (
              <>
                {/* Logged in User Profile Info */}
                {currentUser ? (
                  <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/40 p-1.5 rounded-2xl border border-purple-200/80 dark:border-purple-800">
                    <div className="flex items-center space-x-2 px-2">
                      {currentUser.role === 'super_admin' ? (
                        <Crown className="w-4 h-4 text-amber-500" />
                      ) : currentUser.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                      )}
                      <div className="text-left hidden lg:block">
                        <span className="text-xs font-black block text-slate-800 dark:text-purple-100 leading-tight">
                          {currentUser.displayName}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-300 uppercase font-extrabold">
                          {currentUser.role === 'super_admin'
                            ? 'Người Điều Hành'
                            : currentUser.role === 'admin'
                            ? 'Quản Trị Viên'
                            : 'Giáo Viên'}
                        </span>
                      </div>
                    </div>

                    {/* Super Admin Account Management Button */}
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={onOpenAccountManagement}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition flex items-center shadow-sm"
                        title="Quản Lý Cấp Tài Khoản Nhân Sự"
                      >
                        <Users className="w-3.5 h-3.5 mr-1" />
                        <span className="hidden sm:inline">Quản Lý</span> Đội Ngũ
                      </button>
                    )}

                    {/* Logout Button */}
                    <button
                      onClick={onLogout}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Đăng Xuất"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onOpenLogin}
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs hover:from-purple-700 hover:to-indigo-700 transition shadow-md flex items-center"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
                  </button>
                )}
              </>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-2xl text-slate-500 hover:bg-purple-100 dark:hover:bg-purple-900 transition"
              title="Chuyển chế độ Sáng / Tối"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-purple-600" />}
            </button>

            {/* Reset Database */}
            <button
              onClick={onResetData}
              className="p-2 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Reset Dữ Liệu Mẫu Ban Đầu"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
