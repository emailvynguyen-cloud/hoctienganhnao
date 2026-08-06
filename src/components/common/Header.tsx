import React, { useState, useEffect } from 'react';
import { UserRole, User, AppNotification } from '../../types';
import { StorageEngine } from '../../lib/storage';
import logoImg from '../../assets/logo.jpg';
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-transparent transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center space-x-3.5 cursor-pointer group shrink-0" onClick={onNavigateHome}>
            <div className="relative shrink-0">
              <img
                src={logoImg}
                alt="Ms. Vy English Logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== window.location.origin + '/logo.jpg' && target.src !== '/logo.jpg') {
                    target.src = '/logo.jpg';
                  } else {
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='25' fill='%23ec4899'/%3E%3Ctext x='50' y='65' font-size='45' font-weight='900' fill='white' text-anchor='middle'%3EVY%3C/text%3E%3C/svg%3E";
                  }
                }}
                className="w-11 h-11 rounded-xl object-cover shadow-2xs group-hover:scale-102 transition duration-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full" />
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                  MS. VY ENGLISH
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-transparent dark:bg-rose-950/40 dark:text-rose-400 uppercase">
                  ONLINE
                </span>
              </div>
              <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 tracking-wide hidden sm:block">
                Hệ Thống Theo Dõi Học Tập & Quản Lý Lớp Học
              </p>
            </div>
          </div>

          {/* Right: Actions, Navigation, Role Switcher & Notifications */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto max-w-full scrollbar-none py-1 shrink-0">

            {/* SUB-VIEW BREADCRUMB & BACK / HOME BUTTONS FOR MANAGER PORTAL */}
            {!activePublicHash && (
              <div className="flex items-center space-x-2">
                {/* HOME BUTTON */}
                <button
                  onClick={onNavigateHome}
                  className="h-10 px-3.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition-all duration-180 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 flex items-center shadow-2xs cursor-pointer"
                  title="Về Trang Chủ Quản Lý"
                >
                  <Home className="w-4 h-4 sm:mr-1.5 text-slate-500" />
                  <span className="hidden sm:inline">Trang Chủ</span>
                </button>

                {/* EXIT GENUINE PUBLIC VIEW IF ACTIVE */}
                {activePublicHash && onExitPublicView && (
                  <button
                    onClick={onExitPublicView}
                    className="h-10 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-sm transition-all duration-180 flex items-center border border-transparent hover:border-amber-200 hover:-translate-y-0.5 cursor-pointer"
                    title="Thoát chế độ xem học viên bí mật"
                  >
                    <Lock className="w-4 h-4 mr-1.5 text-amber-600" />
                    Thoát Link Secret
                  </button>
                )}

                {/* BACK BUTTON (ACTIVE IN SUB-VIEWS) */}
                {canNavigateBack && onNavigateBack && (
                  <button
                    onClick={onNavigateBack}
                    className="h-10 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-medium text-sm transition-all duration-180 flex items-center border border-transparent hover:border-sky-200 hover:-translate-y-0.5 cursor-pointer"
                    title="Quay lại trang trước"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5 text-sky-600" />
                    <span className="hidden sm:inline">Quay Lại</span>
                  </button>
                )}

              </div>
            )}

            {/* PWA INSTALL / ADD TO HOME SCREEN BUTTON */}
            <button
              onClick={() => setIsPwaModalOpen(true)}
              className="h-10 px-3.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-all duration-180 flex items-center shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 cursor-pointer"
              title="Hướng dẫn Thêm App ra Màn Hình Chính Điện Thoại"
            >
              <Smartphone className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline">Thêm Vào </span>
              <span className="hidden sm:inline">Màn Hình </span>Chính
            </button>

            {/* LEADERBOARD BUTTON */}
            <button
              onClick={onOpenLeaderboard}
              className="h-10 px-3.5 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium text-xs sm:text-sm transition-all duration-180 flex items-center space-x-1.5 shrink-0 whitespace-nowrap border border-transparent hover:border-rose-200/80 hover:-translate-y-0.5 cursor-pointer"
              title="Xem Bảng Thành Tích Thi Đua Vinh Danh"
            >
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="tracking-tight text-sm font-medium">
                <span className="hidden sm:inline">THI ĐUA TOP</span>
                <span className="sm:hidden">TOP</span>
              </span>
            </button>

            {/* NOTIFICATION BELL FOR ADMIN / TEACHER PORTAL ONLY (NEVER FOR STUDENT) */}
            {currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'teacher') && !activePublicHash && currentRole !== 'student' && (
              <div className="relative">
                <button
                  onClick={handleToggleNotifDropdown}
                  className="w-10 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition relative flex items-center justify-center cursor-pointer border border-transparent"
                  title="Thông báo bài tập cần feedback"
                >
                  <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-xs w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown (Floating Fixed Popup On Top Of Viewport) */}
                {isNotifDropdownOpen && (
                  <div className="fixed top-20 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[420px] max-w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 z-[9999] animate-fadeIn text-sm max-h-[calc(100vh-6rem)] flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center text-base">
                        <Bell className="w-4.5 h-4.5 mr-2 text-rose-500" /> Thông Báo Bài Tập ({notifications.length})
                      </span>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-transparent shrink-0">
                        ✓ Đã tự động đọc tất cả
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 flex-1">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 relative group ${
                              n.isRead
                                ? 'bg-slate-50/60 dark:bg-slate-800/60 border-transparent opacity-80'
                                : 'bg-rose-50/40 dark:bg-slate-800 border-transparent shadow-2xs hover:bg-rose-50/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 font-semibold text-slate-900 dark:text-white">
                              <span className="leading-snug break-words flex-1 text-sm">{n.title}</span>
                              <span className="text-xs text-slate-500 font-mono shrink-0 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200">{n.completionTime}</span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed break-words">
                              {n.message}
                            </p>

                            <div className="pt-1 flex items-center justify-end">
                              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center">
                                Xem Bài / Chấm Bài →
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic text-center py-6">Chưa có thông báo bài tập mới.</p>
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
                  <div className="flex items-center space-x-2 bg-slate-100/80 dark:bg-slate-800 p-1.5 rounded-xl border border-transparent shadow-2xs">
                    <div className="flex items-center space-x-2 px-2.5">
                      {currentUser.role === 'super_admin' ? (
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : currentUser.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-sky-500 shrink-0" />
                      )}
                      <div className="text-left hidden lg:block">
                        <span className="text-sm font-semibold block text-slate-900 dark:text-slate-100 leading-tight">
                          {currentUser.displayName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
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
                      className="h-9 px-3 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 transition shadow-2xs border border-transparent flex items-center cursor-pointer"
                      title="Đổi Tài Khoản / Đăng Nhập"
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      <span className="hidden sm:inline">Đổi Tài Khoản</span>
                    </button>

                    {/* Super Admin Account Management Button */}
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={onOpenAccountManagement}
                        className="h-9 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-medium text-xs hover:bg-sky-100 transition shadow-2xs border border-transparent flex items-center shrink-0 cursor-pointer"
                        title="Quản Lý & Cấp Mới Tài Khoản Đăng Nhập Nhân Sự"
                      >
                        <Users className="w-3.5 h-3.5 mr-1 text-sky-600 shrink-0" />
                        <span>Quản Lý Tài Khoản Đăng Nhập</span>
                      </button>
                    )}

                    {/* GEMINI API KEY BUTTON - EXCLUSIVELY VISIBLE TO SUPER_ADMIN ONLY */}
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={onOpenGeminiSettings}
                        className="h-9 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium text-xs transition border border-transparent flex items-center shrink-0 cursor-pointer shadow-2xs"
                        title="Cấu hình Gemini API Key cho hệ thống"
                      >
                        <Key className="w-3.5 h-3.5 mr-1 text-rose-500 shrink-0" />
                        <span className="font-medium">Cấu Hình API Key</span>
                      </button>
                    )}

                    {/* Logout Button */}
                    <button
                      onClick={onLogout}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                      title="Đăng Xuất"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onOpenLogin}
                      className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition shadow-2xs flex items-center cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 mr-1.5" /> Đăng Nhập Hệ Thống
                    </button>
                  </div>
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
