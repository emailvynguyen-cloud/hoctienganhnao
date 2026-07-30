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
import { CloudSyncEngine } from './lib/cloudSync';
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

  // Targeted submission ID from Notification click
  const [selectedNotificationSubmissionId, setSelectedNotificationSubmissionId] = useState<string | null>(null);

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
  
  // Session Modal & Edit Session State
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [addSessionClassId, setAddSessionClassId] = useState<string | undefined>(undefined);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const handleOpenAddOrEditSession = (classId?: string, editSess?: Session) => {
    setAddSessionClassId(classId);
    setEditingSession(editSess || null);
    setIsAddSessionOpen(true);
  };

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
    setCurrentUser(StorageEngine.getCurrentUser());
  useEffect(() => {
    loadData();

    // Pull initial cloud data on launch & subscribe to real-time updates across all devices
    CloudSyncEngine.pullInitialCloudData().then(() => {
      loadData();
    });

    const unsubscribe = CloudSyncEngine.subscribeToCloudData(() => {
      loadData();
    });

    return () => unsubscribe();
  }, []);

  // Listen to hash changes in URL
  useEffect(() => {
    const handlePopState = () => {
      const hash = getInitialPublicHash();
      setActivePublicHash(hash);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle dark mode toggle
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

  return (
    <div className="min-h-screen bg-pink-50/40 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER BAR */}
      <Header
        currentUser={currentUser}
        activePublicHash={activePublicHash}
        students={students}
        sessions={sessions}
        homeworkSubmissions={homeworkSubmissions}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
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
        <div className="bg-gradient-to-r from-pink-200 via-rose-100 to-sky-100 dark:from-slate-900 dark:to-slate-900 border-b border-pink-300 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-black gap-2 shadow-xs">
          <div className="flex items-center space-x-2 text-pink-950 dark:text-pink-300">
            <Crown className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>👑 SUPER ADMIN ROLE SWITCHER (Chuyển Nhanh Giao Diện):</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveRoleView('super_admin')}
              className={`px-3 py-1 rounded-full transition flex items-center shrink-0 ${
                activeRoleView === 'super_admin'
                  ? 'bg-pink-400 text-white shadow-xs'
                  : 'bg-white/70 dark:bg-slate-800 text-pink-950 hover:bg-pink-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5 mr-1" /> Super Admin
            </button>

            <button
              onClick={() => setActiveRoleView('admin')}
              className={`px-3 py-1 rounded-full transition flex items-center shrink-0 ${
                activeRoleView === 'admin'
                  ? 'bg-rose-400 text-white shadow-xs'
                  : 'bg-white/70 dark:bg-slate-800 text-pink-950 hover:bg-pink-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5 mr-1" /> Admin
            </button>

            <button
              onClick={() => setActiveRoleView('teacher')}
              className={`px-3 py-1 rounded-full transition flex items-center shrink-0 ${
                activeRoleView === 'teacher'
                  ? 'bg-sky-400 text-white shadow-xs'
                  : 'bg-white/70 dark:bg-slate-800 text-pink-950 hover:bg-sky-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Giáo Viên
            </button>

            <button
              onClick={() => setActiveRoleView('student')}
              className={`px-3 py-1 rounded-full transition flex items-center shrink-0 ${
                activeRoleView === 'student'
                  ? 'bg-emerald-400 text-white shadow-xs'
                  : 'bg-white/70 dark:bg-slate-800 text-pink-950 hover:bg-emerald-300'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mr-1" /> Học Viên
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* PUBLIC STUDENT LINK ACCESS */}
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
          /* NOT LOGGED IN HERO VIEW */
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
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 text-white font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" /> Đăng Nhập Hệ Thống Ngay
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
              onOpenAddSession={handleOpenAddOrEditSession}
              onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
              onSetSubViewNavigation={(canBack, onBack, onHome) => {
                setCanNavigateBack(canBack);
                setSubViewBackHandler(() => onBack);
                setSubViewHomeHandler(() => onHome);
              }}
              targetSubmissionId={selectedNotificationSubmissionId}
            />
          ) : activeRoleView === 'teacher' ? (
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
            onOpenAddSession={handleOpenAddOrEditSession}
            onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
            onSetSubViewNavigation={(canBack, onBack, onHome) => {
              setCanNavigateBack(canBack);
              setSubViewBackHandler(() => onBack);
              setSubViewHomeHandler(() => onHome);
            }}
            targetSubmissionId={selectedNotificationSubmissionId}
          />
        ) : currentUser.role === 'teacher' ? (
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
        ) : (
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
        )}

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
          onClose={() => setIsGeminiSettingsOpen(false)}
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
