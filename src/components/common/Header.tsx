import React, { useState } from 'react';
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
  Cloud,
  Smartphone,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Flame,
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
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-purple-950/90 border-b border-purple-100 dark:border-purple-900 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="relative group shrink-0">
              <img
                src="/logo.jpg"
                alt="Ms. Vy English Logo"
                style={{ width: '52px', height: '52px', maxWidth: '52px', maxHeight: '52px' }}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200 dark:border-purple-700 shadow-md transform group-hover:scale-105 transition duration-300 shrink-0"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full border-2 border-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                  MS. VY ENGLISH
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-purple-300 hidden sm:block font-medium">
                Hiểu Từ Bản Chất • Nói Được Tự Tin • Theo Dõi Học Tập
              </p>
            </div>
          </div>

          {/* Controls Right */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* PWA INSTALL / ADD TO HOME SCREEN BUTTON */}
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="px-3 py-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-extrabold text-xs transition flex items-center shadow-xs"
              title="Hướng dẫn Thêm App ra Màn Hình Chính Điện Thoại"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1.5 text-purple-700 animate-bounce" />
              <span className="hidden sm:inline">Thêm Vào </span>Màn Hình Chính
            </button>

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

            {/* HIGHLY DECORATED STUNNING LEADERBOARD BUTTON */}
            <button
              onClick={onOpenLeaderboard}
              className="relative group px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-xs transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-pink-500/35 hover:scale-105 flex items-center space-x-1.5 border-2 border-amber-200 overflow-hidden"
              title="Xem Bảng Thành Tích Thi Đua Vinh Danh"
            >
              {/* Shimmer Light Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              
              <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
              </div>
              
              <span className="tracking-wide uppercase text-[11px] drop-shadow-xs">
                👑 THI ĐUA TOP 🏆
              </span>

              <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
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
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm"
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

      {/* PWA INSTALLATION INSTRUCTION MODAL */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-100 p-6 space-y-5 relative text-slate-800 dark:text-white">
            
            <button
              onClick={() => setIsPwaModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <img src="/logo.jpg" alt="Ms. Vy Logo" style={{ width: '64px', height: '64px' }} className="w-16 h-16 rounded-3xl object-cover border-2 border-purple-300 mx-auto shadow-md" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                Hướng Dẫn Cài App MS. VY ENGLISH Ra Màn Hình Chính Điện Thoại
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-300 font-extrabold">
                Sử dụng như ứng dụng App thật trên điện thoại mà không cần vào App Store hay Google Play!
              </p>
            </div>

            {/* IPHONE (IOS SAFARI) GUIDE */}
            <div className="p-4 rounded-2xl bg-pink-50 dark:bg-slate-800 border border-pink-200 space-y-2 text-xs">
              <span className="font-black text-pink-900 dark:text-pink-300 flex items-center uppercase text-[11px]">
                📱 Dành cho iPhone / iPad (Trình duyệt Safari):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <li>Mở đường link ứng dụng bằng trình duyệt **Safari**.</li>
                <li>Bấm vào biểu tượng **Chia sẻ** (hình ô vuông có mũi tên chỉ lên <Share className="w-3.5 h-3.5 inline text-indigo-600" /> ở dưới cùng màn hình).</li>
                <li>Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-pink-600" />)**.</li>
                <li>Bấm **"Thêm" (Add)** ở góc trên bên phải $\rightarrow$ Biểu tượng app **Ms. Vy** sẽ xuất hiện ngay ngoài màn hình điện thoại!</li>
              </ol>
            </div>

            {/* ANDROID (CHROME) GUIDE */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-purple-200 space-y-2 text-xs">
              <span className="font-black text-purple-900 dark:text-purple-300 flex items-center uppercase text-[11px]">
                🤖 Dành cho Android (Samsung, Oppo, Xiaomi - Chrome):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 font-medium">
                <li>Mở ứng dụng bằng trình duyệt **Google Chrome**.</li>
                <li>Bấm vào dấu **3 chấm `⋮`** ở góc trên cùng bên phải.</li>
                <li>Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào Màn hình chính"**.</li>
                <li>Xác nhận **"Cài đặt"** $\rightarrow$ App Ms. Vy sẽ tự động được tải ra màn hình chính!</li>
              </ol>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsPwaModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 shadow-md transition"
              >
                Đã Hiểu - Đóng Hướng Dẫn
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
