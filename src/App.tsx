import React, { useState, useEffect } from 'react';
import { UserRole, User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from './types';
import { StorageEngine } from './lib/storage';
import { CloudSyncEngine } from './lib/cloudSync';
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
import { GeminiEngine } from './lib/gemini';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Crown, Shield, UserCheck, GraduationCap, Eye, LogIn, Trophy } from 'lucide-react';

const INITIAL_BANK_CONFIG_FALLBACK: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank',
  accountNo: '0355176317',
  accountName: 'MS. VY ENGLISH - MS VY',
  centerLogoUrl: '/logo.jpg',
};

const getInitialPublicHash = (): string | null => {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('hash') || urlParams.get('student');
};

export default function App() {
  const [activePublicHash, setActivePublicHash] = useState<string | null>(getInitialPublicHash);
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageEngine.getCurrentUser());
  const [activeRoleView, setActiveRoleView] = useState<UserRole>('super_admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [canNavigateBack, setCanNavigateBack] = useState<boolean>(false);
  const [subViewBackHandler, setSubViewBackHandler] = useState<(() => void) | undefined>(undefined);
  const [subViewHomeHandler, setSubViewHomeHandler] = useState<(() => void) | undefined>(undefined);

  const [selectedNotificationSubmissionId, setSelectedNotificationSubmissionId] = useState<string | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(() => {
    const hash = getInitialPublicHash();
    if (hash) return false;
    const user = StorageEngine.getCurrentUser();
    return !user;
  });

  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGeminiSettingsOpen, setIsGeminiSettingsOpen] = useState<boolean>(() => {
    return !GeminiEngine.getApiKey();
  });
  
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [addSessionClassId, setAddSessionClassId] = useState<string | undefined>(undefined);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const handleOpenAddOrEditSession = (classId?: string, editSess?: Session) => {
    setAddSessionClassId(classId);
    setEditingSession(editSess || null);
    setIsAddSessionOpen(true);
  };

  const [students, setStudents] = useState<Student[]>(() => StorageEngine.getStudents());
  const [classes, setClasses] = useState<Class[]>(() => StorageEngine.getClasses());
  const [sessions, setSessions] = useState<Session[]>(() => StorageEngine.getSessions());
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(() => StorageEngine.getHomeworkTasks());
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>(() => StorageEngine.getHomeworkSubmissions());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageEngine.getInvoices());
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => StorageEngine.getBankConfig() || INITIAL_BANK_CONFIG_FALLBACK);

  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(true);

  const loadData = () => {
    setStudents(StorageEngine.getStudents());
    setClasses(StorageEngine.getClasses());
    setSessions(StorageEngine.getSessions());
    setHomeworkTasks(StorageEngine.getHomeworkTasks());
    setHomeworkSubmissions(StorageEngine.getHomeworkSubmissions());
    setInvoices(StorageEngine.getInvoices());
    setBankConfig(StorageEngine.getBankConfig() || INITIAL_BANK_CONFIG_FALLBACK);
    setCurrentUser(StorageEngine.getCurrentUser());
  };

  useEffect(() => {
    // CLOUD-FIRST INITIAL LOAD: Always pull fresh cloud payload before unlocking UI
    CloudSyncEngine.pullInitialCloudData()
      .then(() => {
        loadData();
      })
      .finally(() => {
        setIsCloudLoading(false);
      });

    const unsubscribe = CloudSyncEngine.subscribeToCloudData((cloudPayload) => {
      console.log("SUPER ADMIN RECEIVED REALTIME", cloudPayload);
      loadData();
    });

    const handleFocus = () => {
      CloudSyncEngine.pullInitialCloudData().then(() => {
        loadData();
      });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = getInitialPublicHash();
      setActivePublicHash(hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    StorageEngine.setCurrentUser(null);
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  if (isCloudLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center space-y-4 text-slate-800 dark:text-white z-50">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-black text-2xl shadow-xl animate-bounce">
          🌸
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-black tracking-tight text-pink-950 dark:text-pink-300">
            THEO DÕI HỌC TẬP ONLINE - MS. VY ENGLISH
          </h2>
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mr-2"></span>
            Đang đồng bộ dữ liệu thời gian thực từ Đám Mây Cloud...
          </p>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    if (activePublicHash) {
      return (
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
      );
    }

    if (!currentUser) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border-2 border-pink-200 dark:border-slate-800 max-w-lg text-center space-y-6 shadow-md relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto shadow-xs border border-pink-200">
              <Crown className="w-10 h-10 animate-bounce text-pink-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                MS. VY ENGLISH - HỆ THỐNG QUẢN LÝ
              </h2>
              <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                Chào mừng bạn đến với nền tảng theo dõi học tập và quản lý lớp học online.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center cursor-pointer"
              >
                <LogIn className="w-4 h-4 mr-2" /> Đăng Nhập Hệ Thống Ngay
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentUser.role === 'super_admin') {
      if (activeRoleView === 'super_admin' || activeRoleView === 'admin') {
        return (
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
            onOpenAddSession={handleOpenAddOrEditSession}
            onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
            onSetSubViewNavigation={(canBack, onBack, onHome) => {
              setCanNavigateBack(canBack);
              setSubViewBackHandler(() => onBack);
              setSubViewHomeHandler(() => onHome);
            }}
            targetSubmissionId={selectedNotificationSubmissionId}
          />
        );
      }

      if (activeRoleView === 'teacher') {
        return (
          <ErrorBoundary
            fallbackTitle="Lỗi Hiển Thị Giao Diện Teacher Portal"
            onResetView={() => setActiveRoleView('super_admin')}
          >
            <TeacherPortal
              currentUser={currentUser}
              classes={classes}
              students={students}
              sessions={sessions}
              onRefreshData={loadData}
              onOpenAddSession={handleOpenAddOrEditSession}
              onSetSubViewNavigation={(canBack, onBack, onHome) => {
                setCanNavigateBack(canBack);
                setSubViewBackHandler(() => onBack);
                setSubViewHomeHandler(() => onHome);
              }}
              targetSubmissionId={selectedNotificationSubmissionId}
            />
          </ErrorBoundary>
        );
      }

      return (
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
      );
    }

    if (currentUser.role === 'admin') {
      return (
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
          onOpenAddSession={handleOpenAddOrEditSession}
          onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
          onSetSubViewNavigation={(canBack, onBack, onHome) => {
            setCanNavigateBack(canBack);
            setSubViewBackHandler(() => onBack);
            setSubViewHomeHandler(() => onHome);
          }}
          targetSubmissionId={selectedNotificationSubmissionId}
        />
      );
    }

    if (currentUser.role === 'teacher') {
      return (
        <TeacherPortal
          currentUser={currentUser}
          classes={classes}
          students={students}
          sessions={sessions}
          onRefreshData={loadData}
          onOpenAddSession={handleOpenAddOrEditSession}
          onSetSubViewNavigation={(canBack, onBack, onHome) => {
            setCanNavigateBack(canBack);
            setSubViewBackHandler(() => onBack);
            setSubViewHomeHandler(() => onHome);
          }}
          targetSubmissionId={selectedNotificationSubmissionId}
        />
      );
    }

    return (
      <StudentPortal
        currentStudent={students.find((s) => s.email === currentUser.email) || students[0]}
        classes={classes}
        sessions={sessions}
        homeworkTasks={homeworkTasks}
        homeworkSubmissions={homeworkSubmissions}
        invoices={invoices}
        bankConfig={bankConfig}
        onRefreshData={loadData}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* HEADER BAR */}
      <Header
        currentUser={currentUser}
        currentRole={activeRoleView}
        activePublicHash={activePublicHash}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenGeminiSettings={() => setIsGeminiSettingsOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetData={loadData}
        canNavigateBack={canNavigateBack}
        onNavigateBack={() => {
          if (subViewBackHandler) subViewBackHandler();
        }}
        onNavigateHome={() => {
          if (subViewHomeHandler) subViewHomeHandler();
        }}
        onNotificationClick={(submissionId) => {
          setSelectedNotificationSubmissionId(submissionId);
          setActiveRoleView('super_admin');
        }}
      />

      {/* SUPER ADMIN QUICK ROLE SWITCHER BAR */}
      {currentUser && currentUser.role === 'super_admin' && !activePublicHash && (
        <div className="bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between text-sm font-medium gap-3">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Chuyển Giao Diện Xem (Super Admin Role Switcher):</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveRoleView('super_admin')}
              className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                activeRoleView === 'super_admin'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Crown className="w-4 h-4 mr-1.5" /> Super Admin
            </button>

            <button
              onClick={() => setActiveRoleView('admin')}
              className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                activeRoleView === 'admin'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-4 h-4 mr-1.5" /> Admin
            </button>

            <button
              onClick={() => setActiveRoleView('teacher')}
              className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                activeRoleView === 'teacher'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4 mr-1.5" /> Giáo Viên
            </button>

            <button
              onClick={() => setActiveRoleView('student')}
              className={`h-10 px-4 rounded-xl text-sm font-medium transition-all duration-150 flex items-center shrink-0 border border-transparent cursor-pointer ${
                activeRoleView === 'student'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 mr-1.5" /> Học Viên
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {renderMainContent()}
      </main>

      {/* MANDATORY SYSTEM LOGIN MODAL (EXCEPT PUBLIC STUDENT SECRET LINK) */}
      {(isLoginOpen || (!currentUser && !activePublicHash)) && (
        <LoginModal
          isOpen={true}
          canClose={!!currentUser}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginOpen(false);
            if (user.role === 'super_admin') setActiveRoleView('super_admin');
            if (user.role === 'admin') setActiveRoleView('admin');
            if (user.role === 'teacher') setActiveRoleView('teacher');
            if (user.role === 'student') setActiveRoleView('student');
          }}
        />
      )}

      {isAccountManagementOpen && (
        <AccountManagementModal
          isOpen={isAccountManagementOpen}
          onClose={() => setIsAccountManagementOpen(false)}
          onRefreshUsers={loadData}
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
          isOpen={isGeminiSettingsOpen}
          onClose={() => setIsGeminiSettingsOpen(false)}
          onSaved={() => setIsGeminiSettingsOpen(false)}
        />
      )}

      {isAddSessionOpen && (
        <AddSessionModal
          isOpen={isAddSessionOpen}
          classes={classes}
          students={students}
          initialClassId={addSessionClassId}
          defaultClassId={addSessionClassId}
          editingSession={editingSession}
          onClose={() => {
            setIsAddSessionOpen(false);
            setEditingSession(null);
          }}
          onSessionAdded={loadData}
        />
      )}

    </div>
  );
}
