import React, { useState, useEffect } from 'react';
import { UserRole, User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from './types';
import { StorageEngine } from './lib/storage';
import { INITIAL_USERS } from './data/mockData';
import { Header } from './components/common/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherPortal } from './components/teacher/TeacherPortal';
import { StudentPortal } from './components/student/StudentPortal';
import { PublicStudentPortal } from './components/public/PublicStudentPortal';
import { LoginModal } from './components/auth/LoginModal';
import { AccountManagementModal } from './components/auth/AccountManagementModal';
import { LeaderboardWidget } from './components/common/LeaderboardWidget';
import { AddSessionModal } from './components/common/AddSessionModal';
import { GeminiSettingsModal } from './components/common/GeminiSettingsModal';
import { Crown, Shield, UserCheck, GraduationCap, Eye, LogIn, Trophy } from 'lucide-react';

const INITIAL_BANK_CONFIG_FALLBACK: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank',
  accountNo: '0355176317',
  accountName: 'MS. VY ENGLISH - MS VY',
  centerLogoUrl: '/logo.jpg',
};

// SYNCHRONOUS DETECTION: Detect if the session is a Genuine Student/Parent Secret-Link Session via URL query parameter (?hash=...)
const getInitialPublicHash = (): string | null => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('hash') || urlParams.get('student');
};

export default function App() {
  // activePublicHash is ONLY set when a genuine Student/Parent opens a secret link directly via browser URL
  const [activePublicHash, setActivePublicHash] = useState<string | null>(getInitialPublicHash);
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageEngine.getCurrentUser());
  const [activeRoleView, setActiveRoleView] = useState<UserRole>('super_admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Sub-View Navigation Handlers for Header (Back / Home)
  const [canNavigateBack, setCanNavigateBack] = useState<boolean>(false);
  const [subViewBackHandler, setSubViewBackHandler] = useState<(() => void) | undefined>(undefined);
  const [subViewHomeHandler, setSubViewHomeHandler] = useState<(() => void) | undefined>(undefined);

  // Login Modal state: Open if no logged-in user AND not in genuine public student link mode
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(() => {
    const hash = getInitialPublicHash();
    if (hash) return false;
    const user = StorageEngine.getCurrentUser();
    return !user;
  });

  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGeminiSettingsOpen, setIsGeminiSettingsOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [addSessionClassId, setAddSessionClassId] = useState<string | undefined>(undefined);

  // Synchronously initialize datasets from StorageEngine
  const [students, setStudents] = useState<Student[]>(() => StorageEngine.getStudents());
  const [classes, setClasses] = useState<Class[]>(() => StorageEngine.getClasses());
  const [sessions, setSessions] = useState<Session[]>(() => StorageEngine.getSessions());
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(() => StorageEngine.getHomeworkTasks());
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>(() => StorageEngine.getHomeworkSubmissions());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageEngine.getInvoices());
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => StorageEngine.getBankConfig() || INITIAL_BANK_CONFIG_FALLBACK);

  // Refresh state function
  const loadData = () => {
    setStudents(StorageEngine.getStudents());
    setClasses(StorageEngine.getClasses());
    setSessions(StorageEngine.getSessions());
    setHomeworkTasks(StorageEngine.getHomeworkTasks());
    setHomeworkSubmissions(StorageEngine.getHomeworkSubmissions());
    setInvoices(StorageEngine.getInvoices());
    setBankConfig(StorageEngine.getBankConfig() || INITIAL_BANK_CONFIG_FALLBACK);
    const user = StorageEngine.getCurrentUser();
    setCurrentUser(user);
  };

  useEffect(() => {
    loadData();

    // Re-check URL query parameters on mount
    const hash = getInitialPublicHash();
    if (hash) {
      setActivePublicHash(hash);
      setIsLoginOpen(false);
    }
  }, []);

  // Dark Mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại dữ liệu mẫu ban đầu của Ms. Vy English?')) {
      StorageEngine.clearAll();
      loadData();
      alert('Đã khôi phục dữ liệu ban đầu thành công!');
    }
  };

  const handleNavigateHome = () => {
    if (subViewHomeHandler) {
      subViewHomeHandler();
    } else {
      setCanNavigateBack(false);
    }
  };

  const handleNavigateBack = () => {
    if (subViewBackHandler) {
      subViewBackHandler();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentUser?.role === 'super_admin' ? activeRoleView : (currentUser?.role || 'student')}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          StorageEngine.setCurrentUser(null);
          setCurrentUser(null);
          setIsLoginOpen(true);
        }}
        onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenGeminiSettings={() => setIsGeminiSettingsOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetData={handleResetData}
        activePublicHash={activePublicHash}
        onExitPublicView={() => {
          setActivePublicHash(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
        onNavigateHome={handleNavigateHome}
        onNavigateBack={handleNavigateBack}
        canNavigateBack={canNavigateBack}
      />

      {/* SUPER ADMIN QUICK ROLE SWITCHER BAR */}
      {currentUser?.role === 'super_admin' && !activePublicHash && (
        <div className="bg-gradient-to-r from-pink-200 via-rose-100 to-sky-100 text-pink-950 py-2 px-4 shadow-xs border-b border-pink-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 font-black">
              <Eye className="w-4 h-4 text-pink-600 animate-pulse" />
              <span>SUPER ADMIN ROLE SWITCHER (Chuyển Nhanh Giao Diện):</span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveRoleView('super_admin');
                  setCanNavigateBack(false);
                }}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition flex items-center ${
                  activeRoleView === 'super_admin'
                    ? 'bg-white text-pink-950 shadow-xs border border-pink-300'
                    : 'bg-white/60 hover:bg-white/90 text-slate-700'
                }`}
              >
                <Crown className="w-3.5 h-3.5 mr-1 text-amber-500" /> Super Admin
              </button>

              <button
                onClick={() => {
                  setActiveRoleView('admin');
                  setCanNavigateBack(false);
                }}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition flex items-center ${
                  activeRoleView === 'admin'
                    ? 'bg-white text-pink-950 shadow-xs border border-pink-300'
                    : 'bg-white/60 hover:bg-white/90 text-slate-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5 mr-1 text-pink-500" /> Admin
              </button>

              <button
                onClick={() => {
                  setActiveRoleView('teacher');
                  setCanNavigateBack(false);
                }}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition flex items-center ${
                  activeRoleView === 'teacher'
                    ? 'bg-white text-sky-950 shadow-xs border border-sky-300'
                    : 'bg-white/60 hover:bg-white/90 text-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1 text-sky-600" /> Giáo Viên
              </button>

              <button
                onClick={() => {
                  setActiveRoleView('student');
                  setCanNavigateBack(false);
                }}
                className={`px-3.5 py-1 rounded-xl font-extrabold text-[11px] transition flex items-center ${
                  activeRoleView === 'student'
                    ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300'
                    : 'bg-white/60 hover:bg-white/90 text-slate-700'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Học Viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* GENUINE PUBLIC STUDENT VIEW (Accessed ONLY via Direct URL Secret Link ?hash=...) */}
        {activePublicHash ? (
          <PublicStudentPortal
            publicHash={activePublicHash}
            students={students}
            classes={classes}
            sessions={sessions}
            homeworkTasks={homeworkTasks}
            homeworkSubmissions={homeworkSubmissions}
            invoices={invoices}
            bankConfig={bankConfig}
            onRefreshData={loadData}
            onExit={() => {
              setActivePublicHash(null);
              window.history.pushState({}, '', window.location.pathname);
            }}
          />
        ) : !currentUser ? (
          /* NOT LOGGED IN LANDING CARD VIEW WITH LOGIN PROMPT */
          <div className="space-y-6 my-8 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border-2 border-pink-100 dark:border-slate-800 text-center max-w-2xl mx-auto shadow-sm space-y-6">
              <img src="/logo.jpg" alt="Ms. Vy English Logo" style={{ width: '96px', height: '96px' }} className="w-24 h-24 rounded-3xl object-cover border-4 border-pink-200 mx-auto shadow-md" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-500 to-sky-500 bg-clip-text text-transparent">
                  MS. VY ENGLISH
                </h1>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  Hệ Thống Theo Dõi Học Tập & Quản Lý Lớp Học Online
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50 dark:bg-slate-800 border border-pink-200 text-xs text-pink-950 font-medium space-y-1.5">
                <p>💡 Vui lòng bấm <strong>"Đăng Nhập Hệ Thống"</strong> bên dưới để chọn vai trò đăng nhập (Super Admin, Admin, Giáo Viên).</p>
                <p>Học viên / Phụ huynh vui lòng sử dụng đường link cá nhân dạng: <code className="font-mono text-pink-600">/?hash=student_hash</code></p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-8 py-3.5 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-sm hover:bg-pink-300 transition shadow-xs flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2 text-pink-700" /> Đăng Nhập Quản Trị / Giáo Viên
                </button>
              </div>
            </div>
          </div>
        ) : currentUser.role === 'super_admin' ? (
          /* SUPER ADMIN MODE (Supports Quick Role Switcher) */
          activeRoleView === 'super_admin' || activeRoleView === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              effectiveRole={activeRoleView}
              students={students}
              classes={classes}
              invoices={invoices}
              sessions={sessions}
              bankConfig={bankConfig}
              onUpdateStudents={loadData}
              onUpdateClasses={loadData}
              onUpdateInvoices={loadData}
              onOpenAddSession={(classId) => {
                setAddSessionClassId(classId);
                setIsAddSessionOpen(true);
              }}
              onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
              onSetSubViewNavigation={(canBack, onBack, onHome) => {
                setCanNavigateBack(canBack);
                setSubViewBackHandler(() => onBack);
                setSubViewHomeHandler(() => onHome);
              }}
            />
          ) : activeRoleView === 'teacher' ? (
            <TeacherPortal
              currentUser={currentUser}
              classes={classes}
              students={students}
              sessions={sessions}
              onRefreshData={loadData}
              onOpenAddSession={(classId) => {
                setAddSessionClassId(classId);
                setIsAddSessionOpen(true);
              }}
              onSetSubViewNavigation={(canBack, onBack, onHome) => {
                setCanNavigateBack(canBack);
                setSubViewBackHandler(() => onBack);
                setSubViewHomeHandler(() => onHome);
              }}
            />
          ) : (
            <StudentPortal
              currentStudent={students[0]}
              classes={classes}
              sessions={sessions}
              homeworkTasks={homeworkTasks}
              homeworkSubmissions={homeworkSubmissions}
              invoices={invoices}
              bankConfig={bankConfig}
              onRefreshData={loadData}
            />
          )
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            effectiveRole="admin"
            students={students}
            classes={classes}
            invoices={invoices}
            sessions={sessions}
            bankConfig={bankConfig}
            onUpdateStudents={loadData}
            onUpdateClasses={loadData}
            onUpdateInvoices={loadData}
            onOpenAddSession={(classId) => {
              setAddSessionClassId(classId);
              setIsAddSessionOpen(true);
            }}
            onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
            onSetSubViewNavigation={(canBack, onBack, onHome) => {
              setCanNavigateBack(canBack);
              setSubViewBackHandler(() => onBack);
              setSubViewHomeHandler(() => onHome);
            }}
          />
        ) : currentUser.role === 'teacher' ? (
          <TeacherPortal
            currentUser={currentUser}
            classes={classes}
            students={students}
            sessions={sessions}
            onRefreshData={loadData}
            onOpenAddSession={(classId) => {
              setAddSessionClassId(classId);
              setIsAddSessionOpen(true);
            }}
            onSetSubViewNavigation={(canBack, onBack, onHome) => {
              setCanNavigateBack(canBack);
              setSubViewBackHandler(() => onBack);
              setSubViewHomeHandler(() => onHome);
            }}
          />
        ) : (
          <StudentPortal
            currentStudent={students[0]}
            classes={classes}
            sessions={sessions}
            homeworkTasks={homeworkTasks}
            homeworkSubmissions={homeworkSubmissions}
            invoices={invoices}
            bankConfig={bankConfig}
            onRefreshData={loadData}
          />
        )}

      </main>

      {/* MODALS */}
      {isLoginOpen && (
        <LoginModal
          users={INITIAL_USERS}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginOpen(false);
            if (user.role === 'super_admin') setActiveRoleView('super_admin');
            if (user.role === 'admin') setActiveRoleView('admin');
            if (user.role === 'teacher') setActiveRoleView('teacher');
            if (user.role === 'student') setActiveRoleView('student');
          }}
          onClose={() => setIsLoginOpen(false)}
        />
      )}

      {isAccountManagementOpen && (
        <AccountManagementModal
          currentUser={currentUser}
          onClose={() => setIsAccountManagementOpen(false)}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardWidget
          students={students}
          classes={classes}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {isGeminiSettingsOpen && (
        <GeminiSettingsModal
          onClose={() => setIsGeminiSettingsOpen(false)}
        />
      )}

      {isAddSessionOpen && (
        <AddSessionModal
          classes={classes}
          students={students}
          defaultClassId={addSessionClassId}
          onClose={() => setIsAddSessionOpen(false)}
          onSessionAdded={loadData}
        />
      )}

    </div>
  );
}
