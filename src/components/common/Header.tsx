import React, { useState, useEffect } from 'react';
import { UserRole, User, AppNotification } from '../../types';
import { StorageEngine } from '../../lib/storage';
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
  ArrowLeft,
  Home,
  Bell,
  Check,
  ChevronRight,
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
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
  canNavigateBack?: boolean;
  onNotificationClick?: (submissionId: string) => void;
  onSelectNotificationSubmission?: (submissionId: string) => void;
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
  onNavigateHome,
  onNavigateBack,
  canNavigateBack = false,
  onNotificationClick,
  onSelectNotificationSubmission,
}) => {
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load Notifications and auto-refresh periodically
  const refreshNotifs = () => {
    const allNotifs = StorageEngine.getNotifications() || [];
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const isSuperOrAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';
    if (isSuperOrAdmin) {
      setNotifications(allNotifs);
    } else if (currentUser.role === 'teacher') {
      const classes = StorageEngine.getClasses() || [];
      const teacherClassIds = classes
        .filter((c) => c.teacherId === currentUser.uid || c.teacherName === currentUser.displayName)
        .map((c) => c.id);

      const scopedNotifs = allNotifs.filter((n) => teacherClassIds.includes(n.classId));
      setNotifications(scopedNotifs);
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshNotifs();
    const interval = setInterval(refreshNotifs, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleToggleNotifDropdown = () => {
    const nextState = !isNotifDropdownOpen;
    setIsNotifDropdownOpen(nextState);

    // AUTOMATICALLY MARK ALL UNREAD NOTIFICATIONS AS READ WHEN BELL IS CLICKED
    if (nextState && unreadCount > 0) {
      StorageEngine.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    StorageEngine.markNotificationAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsNotifDropdownOpen(false);

    const handler = onNotificationClick || onSelectNotificationSubmission;
    if (handler && notif.submissionId) {
      handler(notif.submissionId);
    }
  };

  const handleMarkAllAsRead = () => {
    StorageEngine.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDismissSingleNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    StorageEngine.markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-pink-100 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5rem] py-2 sm:py-0 gap-2">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={onNavigateHome}>
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="Ms. Vy English Logo"
                style={{ width: '48px', height: '48px' }}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-pink-200 shadow-xs group-hover:scale-105 transition duration-300"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-pink-500 via-rose-400 to-sky-500 bg-clip-text text-transparent">
                  MS. VY ENGLISH
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-900 border border-pink-200 uppercase">
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 tracking-wide hidden sm:block">
                Hệ Thống Theo Dõi Học Tập & Quản Lý Lớp Học
              </p>
            </div>
          </div>

          {/* Right: Actions, Navigation, Role Switcher & Notifications */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 overflow-x-auto max-w-full scrollbar-none py-1 shrink-0">

            {/* SUB-VIEW BREADCRUMB & BACK / HOME BUTTONS FOR MANAGER PORTAL */}
            {!activePublicHash && (
              <div className="flex items-center space-x-1.5">
                {/* HOME BUTTON */}
                <button
                  onClick={onNavigateHome}
                  className="px-3 py-1.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shadow-xs border border-pink-200"
                  title="Về Trang Chủ Quản Lý"
                >
                  <Home className="w-3.5 h-3.5 sm:mr-1 text-pink-600" />
                  <span className="hidden sm:inline">Trang Chủ</span>
                </button>

                {/* EXIT GENUINE PUBLIC VIEW IF ACTIVE */}
                {activePublicHash && onExitPublicView && (
                  <button
                    onClick={onExitPublicView}
                    className="px-3 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs transition flex items-center shadow-xs border border-amber-200"
                    title="Thoát chế độ xem học viên bí mật"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Thoát Link Secret
                  </button>
                )}

                {/* BACK BUTTON (ACTIVE IN SUB-VIEWS) */}
                {canNavigateBack && onNavigateBack && (
                  <button
                    onClick={onNavigateBack}
                    className="px-3.5 py-1.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-950 font-extrabold text-xs transition flex items-center shadow-xs border border-sky-200"
                    title="Quay lại trang trước"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1 text-sky-600" />
                    <span className="hidden sm:inline">Quay Lại</span>
                  </button>
                )}

              </div>
            )}

            {/* PWA INSTALL / ADD TO HOME SCREEN BUTTON */}
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-200 font-extrabold text-[11px] sm:text-xs transition flex items-center shadow-xs shrink-0 whitespace-nowrap"
              title="Hướng dẫn Thêm App ra Màn Hình Chính Điện Thoại"
            >
              <Smartphone className="w-3.5 h-3.5 mr-1 text-emerald-600 animate-bounce shrink-0" />
              <span className="hidden md:inline">Thêm Vào </span>
              <span className="hidden sm:inline">Màn Hình </span>Chính
            </button>

            {/* LEADERBOARD BUTTON */}
            <button
              onClick={onOpenLeaderboard}
              className="relative group px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-pink-200 via-rose-100 to-sky-200 text-pink-950 font-black text-[11px] sm:text-xs transition-all duration-300 shadow-xs hover:shadow-md hover:scale-105 flex items-center space-x-1 border border-pink-300 overflow-hidden shrink-0 whitespace-nowrap"
              title="Xem Bảng Thành Tích Thi Đua Vinh Danh"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/60 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              
              <span className="tracking-tight uppercase text-[10px] sm:text-[11px] font-black">
                <span className="hidden sm:inline">👑 THI ĐUA TOP 🏆</span>
                <span className="sm:hidden">🏆 TOP</span>
              </span>

              <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse hidden sm:inline" />
            </button>

            {/* NOTIFICATION BELL FOR ADMIN / TEACHER PORTAL ONLY (NEVER FOR STUDENT) */}
            {currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'teacher') && !activePublicHash && currentRole !== 'student' && (
              <div className="relative">
                <button
                  onClick={handleToggleNotifDropdown}
                  className="p-2 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-200 transition shadow-xs relative flex items-center justify-center cursor-pointer"
                  title="Thông báo bài tập cần feedback"
                >
                  <Bell className="w-4 h-4 text-pink-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown (Floating Fixed Popup On Top Of Viewport) */}
                {isNotifDropdownOpen && (
                  <div className="fixed top-16 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-pink-300 dark:border-slate-800 p-4 sm:p-5 space-y-3 z-[9999] animate-fadeIn text-xs max-h-[calc(100vh-5rem)] flex flex-col">
                    <div className="flex items-center justify-between border-b border-pink-100 dark:border-slate-800 pb-3 shrink-0">
                      <span className="font-black text-slate-900 dark:text-white flex items-center text-sm">
                        <Bell className="w-4 h-4 mr-2 text-pink-500" /> Thông Báo Bài Tập ({notifications.length})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                        ✓ Đã tự động đọc tất cả
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 flex-1">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 relative group ${
                              n.isRead
                                ? 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 opacity-80'
                                : 'bg-pink-50/95 dark:bg-slate-800 border-pink-300 shadow-2xs hover:bg-pink-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 font-extrabold text-slate-900 dark:text-white">
                              <span className="leading-snug break-words flex-1">{n.title}</span>
                              <span className="text-[10px] text-pink-600 dark:text-pink-300 font-mono shrink-0 bg-pink-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-pink-200">{n.completionTime}</span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed break-words">
                              {n.message}
                            </p>

                            <div className="pt-1 flex items-center justify-end">
                              <span className="text-[10px] font-black text-pink-700 dark:text-pink-400 hover:underline flex items-center">
                                XEM BÀI / CHẤM BÀI →
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-6">Chưa có thông báo bài tập mới.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NO MANAGEMENT BUTTONS FOR STUDENT PORTAL (?hash=...) */}
            {!activePublicHash && (
              <>
                {/* Logged in User Profile Info */}
                {currentUser ? (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-pink-200 shadow-2xs">
                    <div className="flex items-center space-x-2 px-2">
                      {currentUser.role === 'super_admin' ? (
                        <Crown className="w-4 h-4 text-amber-500 animate-bounce" />
                      ) : currentUser.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-pink-600" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-sky-600" />
                      )}
                      <div className="text-left hidden lg:block">
                        <span className="text-xs font-black block text-slate-800 dark:text-slate-100 leading-tight">
                          {currentUser.displayName}
                        </span>
                        <span className="text-[10px] text-pink-600 dark:text-pink-400 uppercase font-extrabold">
                          {currentUser.role === 'super_admin'
                            ? 'Người Điều Hành'
                            : currentUser.role === 'admin'
                            ? 'Quản Trị Viên'
                            : 'Giáo Viên'}
                        </span>
                      </div>
                    </div>

                    {/* Switch Account / Login Modal Opener Button */}
                    <button
                      onClick={onOpenLogin}
                      className="px-2.5 py-1.5 rounded-xl bg-pink-200 text-pink-950 font-extrabold text-xs hover:bg-pink-300 transition shadow-2xs border border-pink-300 flex items-center"
                      title="Đổi Tài Khoản / Đăng Nhập"
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1 text-pink-700" />
                      <span className="hidden sm:inline">Đổi Tài Khoản</span>
                    </button>

                    {/* Super Admin Account Management & Gemini Key Button */}
                    {currentUser.role === 'super_admin' && (
                      <>
                        <button
                          onClick={onOpenAccountManagement}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-200 text-sky-950 font-extrabold text-xs hover:bg-sky-300 transition shadow-2xs border border-sky-300 flex items-center"
                          title="Quản Lý Cấp Tài Khoản Nhân Sự"
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          <span className="hidden sm:inline">Quản Lý</span> Đội Ngũ
                        </button>

                        <button
                          onClick={onOpenGeminiSettings}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-200 text-purple-950 font-extrabold text-xs hover:bg-purple-300 transition shadow-2xs border border-purple-300 flex items-center shrink-0"
                          title="Cấu Hình Gemini AI Key (Quyền Super Admin)"
                        >
                          <Key className="w-3.5 h-3.5 mr-1 text-purple-700" />
                          <span className="hidden sm:inline">Cấu Hình </span>AI Key
                        </button>
                      </>
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
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-sky-400 text-white font-black text-xs hover:from-pink-500 hover:to-sky-500 transition shadow-sm flex items-center"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* PWA MODAL INSTRUCTION */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border-2 border-pink-200 p-6 space-y-5 relative text-slate-800 dark:text-white">
            
            <button
              onClick={() => setIsPwaModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto shadow-xs border border-pink-200">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Thêm Ứng Dụng Ra Màn Hình Chính
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Sử dụng Ms. Vy English tiện lợi như một App di động nguyên bản trên điện thoại iOS & Android!
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-pink-50/50 dark:bg-slate-800 p-4 rounded-2xl border border-pink-100">
              <div className="space-y-1">
                <span className="font-extrabold text-pink-900 dark:text-pink-300 block">📱 Cho iPhone (Safari):</span>
                <p>1. Bấm vào biểu tượng <strong>Chia sẻ (Share) <Share className="w-3.5 h-3.5 inline text-sky-600" /></strong> bên dưới trình duyệt.</p>
                <p>2. Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline text-pink-600" /></strong>.</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-pink-200/60">
                <span className="font-extrabold text-pink-900 dark:text-pink-300 block">🤖 Cho Android (Chrome):</span>
                <p>1. Bấm vào biểu tượng <strong>3 Dấu Chấm (⋮)</strong> ở góc phải trình duyệt.</p>
                <p>2. Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsPwaModalOpen(false)}
                className="w-full py-3 rounded-2xl bg-pink-200 text-pink-950 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs border border-pink-300"
              >
                Đã Hiểu, Cảm Ơn!
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
