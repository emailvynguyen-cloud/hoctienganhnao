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

const INITIAL_BANK_CONFIG_FALLBACK: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank',
  accountNo: '0388999888',
  accountName: 'MS. VY ENGLISH - MS VY',
  centerLogoUrl: '/logo.jpg',
};

export default function App() {
  // Always default to Super Admin if no user logged in, so site opens DIRECTLY into dashboard
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageEngine.getCurrentUser() || INITIAL_USERS[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activePublicHash, setActivePublicHash] = useState<string | null>(null);

  // Modals visibility
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAccountManagementOpen, setIsAccountManagementOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGeminiSettingsOpen, setIsGeminiSettingsOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [addSessionClassId, setAddSessionClassId] = useState<string | undefined>(undefined);

  // Synchronously initialize states from StorageEngine
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
    const user = StorageEngine.getCurrentUser() || INITIAL_USERS[0];
    setCurrentUser(user);
  };

  useEffect(() => {
    loadData();

    // Check URL parameters for Obfuscated Student Public Hash ?hash=... or ?student=...
    const urlParams = new URLSearchParams(window.location.search);
    const hash = urlParams.get('hash') || urlParams.get('student');
    if (hash) {
      setActivePublicHash(hash);
    }
  }, []);

  // Soft Dark Mode Class toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleResetData = () => {
    if (window.confirm('Khôi phục dữ liệu mẫu ban đầu cho toàn bộ hệ thống MS. VY ENGLISH?')) {
      StorageEngine.resetDatabase();
      loadData();
    }
  };

  const handleOpenAddSession = (classId?: string) => {
    setAddSessionClassId(classId);
    setIsAddSessionOpen(true);
  };

  const currentRole: UserRole = currentUser?.role || 'super_admin';
  const currentStudent = students.find((s) => s && s.status === 'active') || students[0];

  return (
    <div className={`min-h-screen bg-purple-50/40 dark:bg-slate-950 text-slate-800 dark:text-purple-100 transition-colors duration-200 flex flex-col font-sans`}>
      
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => {
          StorageEngine.setCurrentUser(null);
          setCurrentUser(null);
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
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* PUBLIC STUDENT VIEW (Accessed via Link) */}
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
        ) : currentRole === 'super_admin' || currentRole === 'admin' ? (
          /* ADMIN & SUPER ADMIN VIEW (DEFAULT DIRECT VIEW) */
          <AdminDashboard
            currentUser={currentUser}
            students={students}
            classes={classes}
            invoices={invoices}
            sessions={sessions}
            bankConfig={bankConfig}
            onUpdateStudents={loadData}
            onUpdateClasses={loadData}
            onUpdateInvoices={loadData}
            onOpenPublicLink={(hash) => setActivePublicHash(hash)}
            onOpenAddSession={handleOpenAddSession}
            onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
          />
        ) : currentRole === 'teacher' ? (
          /* TEACHER VIEW */
          <TeacherPortal
            classes={classes}
            students={students}
            sessions={sessions}
            onRefreshData={loadData}
            onOpenAddSession={handleOpenAddSession}
          />
        ) : (
          /* STUDENT VIEW */
          <StudentPortal
            currentStudent={currentStudent}
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

      {/* Footer */}
      <footer className="border-t border-purple-100 dark:border-purple-900 bg-white dark:bg-purple-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <p className="flex items-center">
            © 2025 - 2026 MS. VY ENGLISH. Hiểu Từ Bản Chất - Nói Được Tự Tin.
          </p>
          <p className="text-purple-600 dark:text-purple-300 font-bold">
            EduSystem Cute Pastel Edition • Custom Obfuscated Student Links
          </p>
        </div>
      </footer>

      {/* MODALS */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadData();
        }}
      />

      <AccountManagementModal
        isOpen={isAccountManagementOpen}
        onClose={() => setIsAccountManagementOpen(false)}
        onRefreshUsers={loadData}
      />

      {isLeaderboardOpen && (
        <LeaderboardWidget
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          students={students}
          sessions={sessions}
        />
      )}

      <AddSessionModal
        isOpen={isAddSessionOpen}
        onClose={() => setIsAddSessionOpen(false)}
        classes={classes}
        students={students}
        initialClassId={addSessionClassId}
        onSessionAdded={loadData}
      />

      <GeminiSettingsModal
        isOpen={isGeminiSettingsOpen}
        onClose={() => setIsGeminiSettingsOpen(false)}
        onSaved={loadData}
      />

    </div>
  );
}
