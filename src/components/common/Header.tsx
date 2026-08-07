import React, { useState, useEffect, useMemo } from 'react';
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
  Menu,
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
  onResetData?: () => void;
  activePublicHash?: string | null;
  onExitPublicView?: () => void;
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
  canNavigateBack?: boolean;
  onNotificationClick?: (submissionId: string) => void;
  onSelectNotificationSubmission?: (submissionId: string) => void;
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
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
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const [isPwaPermanentlyHidden, setIsPwaPermanentlyHidden] = useState(() => {
    try {
      return localStorage.getItem('msvy_hide_pwa_prompt') === 'true';
    } catch (e) {
      return false;
    }
  });

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  const handleNeverShowPwaAgain = () => {
    try {
      localStorage.setItem('msvy_hide_pwa_prompt', 'true');
    } catch (e) {}
    setIsPwaPermanentlyHidden(true);
    setIsPwaModalOpen(false);
  };

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load Notifications and auto-refresh periodically with strict role scoping
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
      const scopedClasses = StorageEngine.getScopedClasses(currentUser, classes);
      const teacherClassIds = new Set([
        ...scopedClasses.map((c) => c.id),
        ...classes
          .filter((c) => c && (c.teacherId === currentUser.uid || (c.teacherName && c.teacherName.toLowerCase() === (currentUser.displayName || '').toLowerCase())))
          .map((c) => c.id),
      ]);

      const scopedNotifs = allNotifs.filter(
        (n) => n && (teacherClassIds.has(n.classId) || n.teacherId === currentUser.uid)
      );
      setNotifications(scopedNotifs);
    } else if (currentUser.role === 'student') {
      const studentId = currentUser.studentId || currentUser.uid;
      const scopedNotifs = allNotifs.filter(
        (n) => n && (n.studentId === studentId || n.recipientId === studentId)
      );
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-slate-800/80 transition-colors duration-200 shadow-2xs max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-[80px] flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap min-w-0 max-w-full">
        
        {/* Left: Hamburger & Brand Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                onOpenMobileSidebar?.();
              } else {
                onToggleSidebar?.();
              }
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Mở / Thu gọn Menu điều hướng"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>

          <div className="flex items-center space-x-3.5 cursor-pointer group shrink-0 py-0.5" onClick={onNavigateHome}>
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

          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                MS. VY ENGLISH
              </span>
              <span className="h-6 px-2.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-transparent dark:bg-rose-950/40 dark:text-rose-400 uppercase inline-flex items-center justify-center">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Right: Actions, Navigation, Role Switcher & Notifications */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 py-0.5 max-w-full overflow-x-auto scrollbar-none shrink-0">

          {/* SUB-VIEW BREADCRUMB & BACK / HOME BUTTONS FOR MANAGER PORTAL */}
          {!activePublicHash && (
            <div className="flex items-center space-x-2 shrink-0">
              {/* HOME BUTTON */}
              <button
                onClick={onNavigateHome}
                className="h-10 px-3.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition-all duration-180 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-0.5 flex items-center shadow-2xs cursor-pointer shrink-0"
                title="Về Trang Chủ Quản Lý"
              >
                <Home className="w-4 h-4 sm:mr-1.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Trang Chủ</span>
              </button>

              {/* EXIT GENUINE PUBLIC VIEW IF ACTIVE */}
              {activePublicHash && onExitPublicView && (
                <button
                  onClick={onExitPublicView}
                  className="h-10 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-xs sm:text-sm transition-all duration-180 flex items-center border border-transparent hover:border-amber-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
                  title="Thoát chế độ xem học viên bí mật"
                >
                  <Lock className="w-4 h-4 mr-1.5 text-amber-600 shrink-0" />
                  <span>Thoát Link Secret</span>
                </button>
              )}

              {/* BACK BUTTON (ACTIVE IN SUB-VIEWS) */}
              {canNavigateBack && onNavigateBack && (
                <button
                  onClick={onNavigateBack}
                  className="h-10 px-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-medium text-xs sm:text-sm transition-all duration-180 flex items-center border border-transparent hover:border-sky-200 hover:-translate-y-0.5 cursor-pointer shrink-0"
                  title="Quay lại trang trước"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5 text-sky-600 shrink-0" />
                  <span className="hidden sm:inline">Quay Lại</span>
                </button>
              )}

            </div>
          )}



          {/* LEADERBOARD BUTTON */}
          <button
            onClick={onOpenLeaderboard}
            className="h-10 px-3.5 rounded-xl bg-rose-50/90 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-medium text-xs sm:text-sm transition-all duration-180 flex items-center space-x-1.5 shrink-0 whitespace-nowrap border border-transparent hover:border-rose-200/80 hover:-translate-y-0.5 cursor-pointer"
            title="Xem Bảng Thành Tích Thi Đua Vinh Danh"
          >
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="tracking-tight text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">THI ĐUA TOP</span>
              <span className="sm:hidden">TOP</span>
            </span>
          </button>

          {/* NOTIFICATION BELL FOR ADMIN / TEACHER PORTAL ONLY (NEVER FOR STUDENT) */}
          {currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'teacher') && !activePublicHash && currentRole !== 'student' && (
            <div className="relative shrink-0">
              <button
                onClick={handleToggleNotifDropdown}
                className="w-10 h-10 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition relative flex items-center justify-center cursor-pointer border border-transparent shadow-2xs"
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
              {/* Logged in User Profile Info & Action Pill */}
              {currentUser ? (
                <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl border border-transparent shadow-2xs shrink-0">
                  
                  {/* Account Name & Role Tag */}
                  <div className="flex items-center space-x-2 px-3 py-1 text-left leading-tight whitespace-nowrap">
                    {currentUser.role === 'super_admin' ? (
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : currentUser.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-sky-500 shrink-0" />
                    )}
                    <div className="whitespace-nowrap">
                      <span className="text-sm font-semibold block text-slate-900 dark:text-slate-100 leading-tight">
                        {currentUser.displayName}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                        {currentUser.role === 'super_admin'
                          ? 'Điều Hành Cao Nhất'
                          : currentUser.role === 'admin'
                          ? 'Quản Trị Viên'
                          : 'Giáo Viên'}
                      </span>
                    </div>
                  </div>

                  {/* Switch Account / Login Modal Opener Button */}
                  <button
                    onClick={onOpenLogin}
                    className="h-9 px-3 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-medium text-xs transition shadow-2xs border border-transparent flex items-center shrink-0 cursor-pointer"
                    title="Đổi Tài Khoản / Đăng Nhập"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
                    <span className="hidden sm:inline">Đổi Tài Khoản</span>
                  </button>

                  {/* Super Admin Account Management Button */}
                  {currentUser.role === 'super_admin' && (
                    <button
                      onClick={onOpenAccountManagement}
                      className="h-9 px-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-900 dark:text-sky-300 font-medium text-xs transition shadow-2xs border border-transparent flex items-center shrink-0 cursor-pointer"
                      title="Quản Lý & Cấp Mới Tài Khoản Đăng Nhập Nhân Sự"
                    >
                      <Users className="w-3.5 h-3.5 mr-1 text-sky-600 shrink-0" />
                      <span className="hidden md:inline">Quản Lý Tài Khoản</span>
                      <span className="md:hidden">Quản Lý</span>
                    </button>
                  )}

                  {/* GEMINI API KEY BUTTON - EXCLUSIVELY VISIBLE TO SUPER_ADMIN ONLY */}
                  {currentUser.role === 'super_admin' && (
                    <button
                      onClick={onOpenGeminiSettings}
                      className="h-9 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-medium text-xs transition border border-transparent flex items-center shrink-0 cursor-pointer shadow-2xs"
                      title="Cấu hình Gemini API Key cho hệ thống"
                    >
                      <Key className="w-3.5 h-3.5 mr-1 text-rose-500 shrink-0" />
                      <span className="font-medium hidden md:inline">Cấu Hình API Key</span>
                      <span className="font-medium md:hidden">API Key</span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition shrink-0 cursor-pointer"
                    title="Đăng Xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={onOpenLogin}
                    className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition shadow-2xs flex items-center cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 mr-1.5 shrink-0" /> Đăng Nhập Hệ Thống
                  </button>
                </div>
              )}
            </>
          )}

          {/* MOBILE HAMBURGER MENU TOGGLE BUTTON (VISIBLE ON MOBILE ONLY) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Mở menu hệ thống"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-md animate-fadeIn">
          {currentUser && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {currentUser.role === 'super_admin' ? (
                  <Crown className="w-4 h-4 text-amber-500" />
                ) : currentUser.role === 'admin' ? (
                  <Shield className="w-4 h-4 text-rose-500" />
                ) : (
                  <UserCheck className="w-4 h-4 text-sky-500" />
                )}
                <span className="font-bold text-slate-900 dark:text-white">{currentUser.displayName}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-[10px] uppercase">
                {currentUser.role}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onNavigateHome?.();
                setIsMobileMenuOpen(false);
              }}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <Home className="w-4 h-4 text-sky-500" />
              <span>Trang Chủ</span>
            </button>

            <button
              onClick={() => {
                onOpenLeaderboard();
                setIsMobileMenuOpen(false);
              }}
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Thi Đua TOP</span>
            </button>

            {currentUser?.role === 'super_admin' && (
              <button
                onClick={() => {
                  onOpenAccountManagement();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-300 font-bold text-xs flex items-center justify-center space-x-1.5 col-span-2"
              >
                <Users className="w-4 h-4 text-sky-600" />
                <span>Quản Lý Tài Khoản Đăng Nhập</span>
              </button>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 col-span-2"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{isDarkMode ? 'Chế độ Sáng (Light Mode)' : 'Chế độ Tối (Dark Mode)'}</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 col-span-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 col-span-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Hệ Thống</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PWA FLOATING ACTION BUTTON (FAB) AT BOTTOM-RIGHT */}
      {!isPwaPermanentlyHidden && !isStandalone && (
        <div className="fixed bottom-6 right-6 z-40 animate-scaleIn">
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer border border-rose-500/50"
            title="Thêm Veronica English vào màn hình chính"
            aria-label="Thêm vào màn hình chính"
          >
            <Smartphone className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* PWA BOTTOM SHEET / MODAL INSTRUCTION */}
      {isPwaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-2 sm:border-2 border-rose-200 dark:border-slate-700 p-6 space-y-5 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsPwaModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Illustrative Icon & Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs border border-rose-200 dark:border-rose-900 shrink-0">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Thêm Veronica English vào màn hình chính
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                Cài đặt website như một ứng dụng để truy cập nhanh hơn và có trải nghiệm tốt hơn.
              </p>
            </div>

            {/* Step by Step Platform Guidance */}
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              
              {/* Android Chrome */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center">
                  📱 Android (Chrome)
                </span>
                <p className="text-slate-600 dark:text-slate-400 font-normal leading-normal">
                  1. Nhấn biểu tượng <strong>ba chấm (⋮)</strong> ở góc trên bên phải Chrome.
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-normal leading-normal">
                  2. Chọn <strong>"Thêm vào màn hình chính"</strong> (Add to Home Screen) hoặc <strong>"Cài đặt ứng dụng"</strong>.
                </p>
              </div>

              {/* iPhone Safari */}
              <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center">
                  🍎 iPhone / iPad (Safari)
                </span>
                <p className="text-slate-600 dark:text-slate-400 font-normal leading-normal">
                  1. Nhấn nút <strong>Chia sẻ (Share) <Share className="w-3.5 h-3.5 inline text-sky-600" /></strong> ở thanh công cụ dưới Safari.
                </p>
                <p className="text-slate-600 dark:text-slate-400 font-normal leading-normal">
                  2. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline text-rose-600" /></strong>.
                </p>
              </div>

            </div>

            {/* Action Buttons: "Đã hiểu" & "Không hiển thị lại" */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleNeverShowPwaAgain}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs transition cursor-pointer border border-transparent"
              >
                Không hiển thị lại
              </button>
              <button
                onClick={() => setIsPwaModalOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition shadow-2xs cursor-pointer border border-rose-500/50"
              >
                Đã hiểu
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
