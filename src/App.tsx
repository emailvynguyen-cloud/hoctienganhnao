import React, { useState, useEffect } from 'react';
import { UserRole, User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from './types';
import { StorageEngine } from './lib/storage';
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
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageEngine.getCurrentUser());
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
    setBankConfig(StorageEngine.getBankConfig());
    setCurrentUser(StorageEngine.getCurrentUser());
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
  const currentStudent = students.find((s) => s.status === 'active') || students[0];

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
        ) : !currentUser ? (
          /* NOT LOGGED IN DEFAULT VIEW */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border-2 border-purple-100 dark:border-purple-800 text-center max-w-2xl mx-auto shadow-xl space-y-6">
              <img src="/logo.jpg" alt="Ms. Vy English Logo" className="w-24 h-24 rounded-3xl object-cover border-4 border-purple-200 mx-auto shadow-md" />
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Hệ Thống Theo Dõi Học Tập Online - MS. VY ENGLISH
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  Vui lòng đăng nhập với tài khoản Quản lý / Giáo viên hoặc sử dụng đường link học viên cá nhân được cung cấp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/20 w-full sm:w-auto"
                >
                  Đăng Nhập Quản Lý / Giáo Viên
                </button>

                <button
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-amber-100 text-amber-900 font-extrabold text-xs hover:bg-amber-200 transition border border-amber-200 w-full sm:w-auto"
                >
                  🏆 Xem Bảng Thành Tích Thi Đua
                </button>
              </div>
            </div>
          </div>
        ) : currentRole === 'super_admin' || currentRole === 'admin' ? (
          /* ADMIN & SUPER ADMIN VIEW */
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
