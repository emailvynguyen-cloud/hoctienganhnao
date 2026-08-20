import React from 'react';
import { useLocation, useNavigate } from '../../lib/router';
import { User, UserRole } from '../../types';
import {
  Home,
  BookOpen,
  FileText,
  Trophy,
  Crown,
  Award,
  Settings,
  Users,
  UserCheck,
  GraduationCap,
  DollarSign,
  Calendar,
  CheckSquare,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Shield,
  CreditCard,
  Key,
  AlertTriangle
} from 'lucide-react';
import { StorageEngine } from '../../lib/storage';
import { calculateGlobalPendingTasks, isTaskForTeacher } from '../../lib/pendingTasksEngine';
import { PendingTaskService } from '../../lib/pendingTaskService';

interface SidebarProps {
  currentUser: User | null;
  currentRole: UserRole;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onOpenAccountManagement: () => void;
  onOpenGeminiSettings: () => void;
  syncTick?: number;
}

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  onClick?: () => void;
}

interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  currentUser,
  currentRole,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onOpenAccountManagement,
  onOpenGeminiSettings,
  syncTick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const role = currentUser?.role || 'student';

  const [rtTaskCount, setRtTaskCount] = React.useState<number>(0);

  React.useEffect(() => {
    if (role !== 'teacher') return;
    const teacherId = currentUser?.uid || currentUser?.displayName || '';
    const unsubscribe = PendingTaskService.subscribePendingTasks((tasks) => {
      setRtTaskCount(tasks.filter((t) => t.status === 'pending').length);
    }, teacherId);
    return () => unsubscribe();
  }, [role, currentUser]);

  const teacherPendingTasksCount = React.useMemo(() => {
    if (role !== 'teacher') return 0;
    try {
      const classes = StorageEngine.getClasses();
      const sessions = StorageEngine.getSessions();
      const students = StorageEngine.getStudents();
      const dismissed = StorageEngine.getDismissedPendingTaskIds();
      const tasks = calculateGlobalPendingTasks(classes, sessions, students, dismissed);

      const calculated = tasks.filter((t) => {
        if (t.type === 'missing_quizlet') return false;
        return isTaskForTeacher(t, currentUser, classes);
      }).length;

      return Math.max(calculated, rtTaskCount);
    } catch {
      return rtTaskCount;
    }
  }, [role, currentUser, syncTick, rtTaskCount]);

  // BUILD ROLE-SPECIFIC MENU GROUPS (MEMOIZED)
  const menuGroups = React.useMemo((): MenuGroup[] => {
    if (role === 'student') {
      return [
        {
          groupTitle: 'HỌC TẬP',
          items: [
            { id: 'std_home', title: 'Trang Chủ', path: '/student', icon: Home },
            { id: 'std_learning_hub', title: 'Ôn Tập & Học Tập', path: '/student?tab=learning_hub', icon: BookOpen },
            { id: 'std_sessions', title: 'Buổi Học', path: '/student', icon: Calendar },
            { id: 'std_homework', title: 'Bài Tập', path: '/student', icon: FileText },
          ],
        },
        {
          groupTitle: 'THÀNH TÍCH',
          items: [
            { id: 'std_leaderboard', title: 'Bảng Xếp Hạng', path: '/leaderboard', icon: Trophy },
            { id: 'std_hall_of_fame', title: 'Đại Sảnh Danh Vọng', path: '/hall-of-fame', icon: Crown },
            { id: 'std_achievement', title: 'Thành Tựu & Badge', path: '/student/achievement', icon: Award },
          ],
        },
        {
          groupTitle: 'HỆ THỐNG',
          items: [
            { id: 'std_settings', title: 'Cài Đặt Học Viên', path: '/student/settings', icon: Settings },
          ],
        },
      ];
    }

    if (role === 'teacher') {
      return [
        {
          groupTitle: 'GIẢNG DẠY',
          items: [
            { id: 'tch_home', title: 'Dashboard', path: '/teacher?tab=today', icon: Home },
            {
              id: 'tch_pending_tasks',
              title: 'Công Việc Cần Xử Lý',
              path: '/teacher?tab=pending_tasks',
              icon: AlertTriangle,
              badge: teacherPendingTasksCount,
            },
            { id: 'tch_grading', title: 'Chấm Bài Tập (Feedback)', path: '/teacher?tab=grading', icon: CheckSquare },
            { id: 'tch_learning_hub', title: 'Learning Hub (Ôn Luyện)', path: '/teacher?tab=learning_hub', icon: BookOpen },
            { id: 'tch_classes', title: 'Lớp Học Phụ Trách', path: '/teacher?tab=all_classes', icon: Users },
            { id: 'tch_sessions', title: 'Buổi Học / Lịch Tuần', path: '/teacher?tab=schedule', icon: Calendar },
          ],
        },
        {
          groupTitle: 'THỐNG KÊ & NỘI QUY',
          items: [
            { id: 'tch_revenue', title: 'Doanh Thu Lương Dạy', path: '/teacher?tab=revenue', icon: DollarSign },
            { id: 'tch_rules', title: 'Nội Quy Giáo Viên', path: '/teacher?tab=rules', icon: BookOpen },
          ],
        },
      ];
    }

    if (role === 'admin') {
      return [
        {
          groupTitle: 'QUẢN LÝ',
          items: [
            { id: 'adm_home', title: 'Dashboard Admin', path: '/admin?tab=pending_tasks', icon: Home },
            { id: 'adm_grading', title: 'Chấm Bài Tập (Feedback)', path: '/admin?tab=grading', icon: CheckSquare },
            { id: 'adm_learning_hub', title: 'Learning Hub (Ôn Luyện)', path: '/admin?tab=learning_hub', icon: BookOpen },
            { id: 'adm_tasks', title: 'Công Việc Cần Xử Lý', path: '/admin?tab=pending_tasks', icon: CheckSquare },
            { id: 'adm_classes', title: 'Quản Lý Lớp Học', path: '/admin?tab=classes', icon: BookOpen },
            { id: 'adm_students', title: 'Quản Lý Học Viên', path: '/admin?tab=students', icon: GraduationCap },
            { id: 'adm_teachers', title: 'Đội Ngũ Giáo Viên', path: '/admin?tab=teachers', icon: UserCheck },
          ],
        },
        {
          groupTitle: 'THỐNG KÊ',
          items: [
            { id: 'adm_stats', title: 'Thống Kê Hệ Thống', path: '/admin?tab=pending_tasks', icon: BarChart2 },
          ],
        },
        {
          groupTitle: 'HỆ THỐNG',
          items: [
            { id: 'adm_rules', title: 'Quản Lý Nội Quy', path: '/admin?tab=class_rules', icon: BookOpen },
            { id: 'adm_settings', title: 'Cài Đặt', path: '/admin?tab=pending_tasks', icon: Settings },
          ],
        },
      ];
    }

    // SUPER ADMIN
    return [
      {
        groupTitle: 'QUẢN LÝ TRUNG TÂM',
        items: [
          { id: 'sa_home', title: 'Dashboard Super Admin', path: '/super-admin?tab=pending_tasks', icon: Home },
          { id: 'sa_grading', title: 'Chấm Bài Tập (Feedback)', path: '/super-admin?tab=grading', icon: CheckSquare },
          { id: 'sa_learning_hub', title: 'Learning Hub (Ôn Luyện)', path: '/super-admin?tab=learning_hub', icon: BookOpen },
          { id: 'sa_tasks', title: 'Công Việc Cần Xử Lý', path: '/super-admin?tab=pending_tasks', icon: CheckSquare },
          { id: 'sa_classes', title: 'Quản Lý Lớp Học', path: '/super-admin?tab=classes', icon: BookOpen },
          { id: 'sa_students', title: 'Quản Lý Học Viên', path: '/super-admin?tab=students', icon: GraduationCap },
          { id: 'sa_teachers', title: 'Đội Ngũ Giáo Viên', path: '/super-admin?tab=teachers', icon: UserCheck },
        ],
      },
      {
        groupTitle: 'TÀI CHÍNH & THU NHẬP',
        items: [
          { id: 'sa_revenue', title: 'Báo Cáo Doanh Thu', path: '/super-admin?tab=revenue', icon: DollarSign },
          { id: 'sa_salary', title: 'Lương & Học Phí VietQR', path: '/super-admin?tab=invoices', icon: CreditCard },
        ],
      },
      {
        groupTitle: 'THÀNH TÍCH & THI ĐUA',
        items: [
          { id: 'sa_leaderboard', title: 'Bảng Xếp Hạng Top', path: '/leaderboard', icon: Trophy },
          { id: 'sa_hall_of_fame', title: 'Đại Sảnh Danh Vọng', path: '/hall-of-fame', icon: Crown },
        ],
      },
      {
        groupTitle: 'HỆ THỐNG & NHÂN SỰ',
        items: [
          { id: 'sa_rules', title: 'Quản Lý Nội Quy', path: '/super-admin?tab=class_rules', icon: BookOpen },
          { id: 'sa_student_codes', title: 'Quản Lý Mã Học Viên', path: '/super-admin?tab=student_codes', icon: Key },
          { id: 'sa_accounts', title: 'Quản Lý Tài Khoản', path: '/super-admin/accounts', icon: Users, onClick: onOpenAccountManagement },
          { id: 'sa_settings', title: 'Cài Đặt Gemini API', path: '/super-admin/settings', icon: Settings, onClick: onOpenGeminiSettings },
        ],
      },
    ];
  }, [role, onOpenAccountManagement, onOpenGeminiSettings]);

  const isPathActive = React.useCallback((path: string) => {
    const currentUrl = location.pathname + location.search;
    if (path === currentUrl) return true;
    if (path === '/super-admin?tab=pending_tasks' && location.pathname === '/super-admin' && (!location.search || location.search.includes('pending_tasks'))) return true;
    if (path === '/admin?tab=pending_tasks' && location.pathname === '/admin' && (!location.search || location.search.includes('pending_tasks'))) return true;
    if (path === '/teacher?tab=today' && location.pathname === '/teacher' && (!location.search || location.search.includes('today'))) return true;
    if (path.includes('?tab=')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path || (path !== '/student' && path !== '/teacher' && path !== '/admin' && path !== '/super-admin' && location.pathname.startsWith(path));
  }, [location.pathname, location.search]);

  const handleMenuItemClick = React.useCallback((item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    window.dispatchEvent(new Event('navigation_tab_change'));
    setIsMobileOpen(false);
  }, [navigate, setIsMobileOpen]);

  return (
    <>
      {/* 1. MOBILE BACKDROP OVERLAY (<768px) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity animate-fadeIn"
        />
      )}

      {/* 2. SIDEBAR CONTAINER */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800
          flex flex-col transition-[width,transform] duration-200 ease-in-out will-change-[width,transform] shrink-0 select-none shadow-xs
          ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* SIDEBAR HEADER / BRAND LOGO */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer overflow-hidden py-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              🌸
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="truncate">
                <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                  MS. VY ENGLISH
                </h1>
                <span className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-widest block">
                  Online Platform
                </span>
              </div>
            )}
          </div>

          {/* DESKTOP TOGGLE COLLAPSE BUTTON */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* MOBILE CLOSE BUTTON */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION BODY */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-none">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {/* GROUP TITLE */}
              {(!isCollapsed || isMobileOpen) ? (
                <span className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1.5">
                  {group.groupTitle}
                </span>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {/* MENU ITEMS */}
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const active = isPathActive(item.path);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item)}
                    title={isCollapsed && !isMobileOpen ? item.title : undefined}
                    className={`
                      w-full h-11 px-3 rounded-xl text-xs sm:text-sm transition-all duration-150
                      flex items-center group relative cursor-pointer border-l-3
                      ${
                        active
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold'
                          : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                      }
                      ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start space-x-3'}
                    `}
                  >
                    <IconComponent
                      className={`
                        w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110
                        ${active ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}
                      `}
                    />

                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate flex-1 text-left tracking-tight">
                        {item.title}
                      </span>
                    )}

                    {item.badge !== undefined && (!isCollapsed || isMobileOpen) && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors ${
                          Number(item.badge) > 0
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* TOOLTIP ON COLLAPSED HOVER */}
                    {isCollapsed && !isMobileOpen && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                        {item.title}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* SIDEBAR FOOTER / CURRENT USER INFO SUMMARY */}
        {currentUser && (!isCollapsed || isMobileOpen) && (
          <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-400 to-amber-400 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate flex-1">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                  {currentUser.displayName}
                </h4>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
});
