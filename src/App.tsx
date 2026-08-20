import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from './lib/router';
import { UserRole, User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from './types';
import { StorageEngine } from './lib/storage';
import { CloudSyncEngine } from './lib/cloudSync';
import { GeminiEngine } from './lib/gemini';
import { ScrollToTop } from './components/common/ScrollToTop';
import { NotFound } from './components/common/NotFound';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';

// Shared & Auth Modals
import { LoginModal } from './components/auth/LoginModal';
import { AccountManagementModal } from './components/auth/AccountManagementModal';
import { LeaderboardWidget } from './components/common/LeaderboardWidget';
import { AddSessionModal } from './components/common/AddSessionModal';
import { GeminiSettingsModal } from './components/common/GeminiSettingsModal';
import { PublicStudentPortal } from './components/public/PublicStudentPortal';
import { ClassDetailsView } from './components/admin/ClassDetailsView';
import { PendingTasksDashboard } from './components/admin/PendingTasksDashboard';
import { RealtimeIsolationTest } from './components/admin/RealtimeIsolationTest';
import { PendingTaskService } from './lib/pendingTaskService';
import { FineService } from './lib/fineService';
import { Crown, LogIn, Trophy } from 'lucide-react';

// Lazy Loaded Portals for Code-Splitting
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const TeacherPortal = lazy(() => import('./components/teacher/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const StudentPortal = lazy(() => import('./components/student/StudentPortal').then(m => ({ default: m.StudentPortal })));

const INITIAL_BANK_CONFIG_FALLBACK: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank',
  accountNo: '0355176317',
  accountName: 'MS. VY ENGLISH - MS VY',
  centerLogoUrl: '/logo.jpg',
};

// Fallback Loading Spinner Component for Suspense
const LoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xl animate-bounce shadow-md">
      🌸
    </div>
    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
      Đang tải dữ liệu màn hình...
    </span>
  </div>
);

function extractHashFromUrl(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const searchParams = parsed.searchParams;
    const paramHash = searchParams.get('hash') || searchParams.get('student');
    if (paramHash) return paramHash;
    if (parsed.pathname.startsWith('/s/')) return parsed.pathname.replace('/s/', '');
    if (parsed.pathname.startsWith('/student/')) {
      const path = parsed.pathname.replace('/student/', '');
      if (path && path !== 'achievement' && !path.startsWith('session/') && !path.startsWith('settings')) {
        return path;
      }
    }
  } catch (e) {
    // Ignore invalid URL
  }
  return null;
}

// Role Redirection Helper
const RoleRedirect: React.FC<{ currentUser: User | null; students: Student[] }> = ({ currentUser, students }) => {
  if (!currentUser) {
    const currentStudentId = StorageEngine.getCurrentStudentSession();
    const savedStudentUrl = StorageEngine.getLastStudentPortalUrl();

    if (currentStudentId) {
      const activeStudent = students.find((s) => s && s.id === currentStudentId && s.status !== 'soft_deleted');
      if (activeStudent && activeStudent.studentCodeStatus !== 'DISABLED') {
        const targetUrl = savedStudentUrl || `/student/${activeStudent.publicHash || activeStudent.id}`;
        return <Navigate to={targetUrl} replace />;
      } else {
        // Clear invalid or disabled student session
        StorageEngine.setCurrentStudentSession(null);
        StorageEngine.setLastStudentPortalUrl(null);
      }
    } else if (savedStudentUrl) {
      const candidateHash = extractHashFromUrl(savedStudentUrl);
      if (candidateHash) {
        const activeStudent = students.find((s) => s && (s.publicHash === candidateHash || s.id === candidateHash) && s.status !== 'soft_deleted');
        if (activeStudent && activeStudent.studentCodeStatus !== 'DISABLED') {
          return <Navigate to={savedStudentUrl} replace />;
        }
      }
      StorageEngine.setLastStudentPortalUrl(null);
    }
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'student') return <Navigate to="/student" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  if (currentUser.role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/student" replace />;
};

// Standalone Student Private Layout (NO Sidebar, NO Login Button, NO Admin Navigation; HAS Top Thi Đua)
const StudentPrivateLayout: React.FC<{
  publicHash: string;
  students: Student[];
  classes: Class[];
  sessions: Session[];
  homeworkTasks: HomeworkTask[];
  homeworkSubmissions: HomeworkSubmission[];
  invoices: Invoice[];
  bankConfig: BankConfig;
  loadData: () => void;
  currentUser: User | null;
  onOpenLeaderboard?: () => void;
}> = (props) => {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const handleOpenLeaderboard = () => {
    if (props.onOpenLeaderboard) {
      props.onOpenLeaderboard();
    }
    setIsLeaderboardOpen(true);
  };

  return (
    <div className="min-h-screen bg-pink-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans w-full max-w-full overflow-x-hidden">
      {/* STUDENT PRIVATE HEADER (NO SIDEBAR, NO LOGIN BUTTON, NO ADMIN NAV; HAS TOP THI ĐUA) */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-pink-100 dark:border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
              🌸
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                MS. VY ENGLISH
              </h1>
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">
                Trang Theo Dõi Học Viên Cá Nhân
              </span>
            </div>
          </div>

          {/* STUDENT PRIVATE NAVIGATION: TOP THI ĐUA BUTTON & DISCRETE ADMIN BACK BUTTON */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* 🏆 TOP THI ĐUA BUTTON */}
            <button
              type="button"
              onClick={handleOpenLeaderboard}
              className="h-9 px-3.5 rounded-xl bg-rose-50/90 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-bold text-xs transition-all duration-180 flex items-center space-x-1.5 shrink-0 whitespace-nowrap border border-rose-200/60 dark:border-rose-900/60 hover:-translate-y-0.5 cursor-pointer shadow-2xs"
              title="Xem Bảng Thành Tích Thi Đua Vinh Danh"
            >
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="tracking-tight text-xs font-black uppercase">
                <span className="hidden sm:inline">THI ĐUA TOP</span>
                <span className="sm:hidden">TOP</span>
              </span>
            </button>

            {/* DISCRETE BACK TO DASHBOARD BUTTON (ONLY IF LOGGED IN AS ADMIN/SUPER_ADMIN/TEACHER) */}
            {props.currentUser && ['super_admin', 'admin', 'teacher'].includes(props.currentUser.role) && (
              <button
                type="button"
                onClick={() => {
                  if (props.currentUser?.role === 'super_admin') window.location.href = '/super-admin';
                  else if (props.currentUser?.role === 'admin') window.location.href = '/admin';
                  else if (props.currentUser?.role === 'teacher') window.location.href = '/teacher';
                }}
                className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 shrink-0"
              >
                <span>⬅ Quay lại Dashboard Quản Lý</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* STUDENT PORTAL CONTENT */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        <PublicStudentPortal
          publicHash={props.publicHash}
          students={props.students}
          classes={props.classes}
          sessions={props.sessions}
          homeworkTasks={props.homeworkTasks}
          homeworkSubmissions={props.homeworkSubmissions}
          invoices={props.invoices}
          bankConfig={props.bankConfig}
          onRefreshData={props.loadData}
          onExit={() => {
            StorageEngine.setCurrentStudentSession(null);
            StorageEngine.setLastStudentPortalUrl(null);
            if (props.currentUser) {
              if (props.currentUser.role === 'super_admin') window.location.href = '/super-admin';
              else if (props.currentUser.role === 'admin') window.location.href = '/admin';
              else if (props.currentUser.role === 'teacher') window.location.href = '/teacher';
              else window.location.href = '/login';
            } else {
              window.location.href = '/login';
            }
          }}
        />
      </main>

      {/* LEADERBOARD MODAL FOR STUDENT PRIVATE VIEW */}
      {isLeaderboardOpen && (
        <LeaderboardWidget
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          students={props.students}
          sessions={props.sessions}
          homeworkSubmissions={props.homeworkSubmissions}
        />
      )}
    </div>
  );
};

// Root Route Handler (Fallback for path="/" if no student secret link is in search params)
const RootRouteHandler: React.FC<{
  currentUser: User | null;
  students: Student[];
}> = (props) => {
  return <RoleRedirect currentUser={props.currentUser} students={props.students} />;
};

// Secret Link Handler (/s/:hash and ?hash=...)
const SecretLinkWrapper: React.FC<{
  students: Student[];
  classes: Class[];
  sessions: Session[];
  homeworkTasks: HomeworkTask[];
  homeworkSubmissions: HomeworkSubmission[];
  invoices: Invoice[];
  bankConfig: BankConfig;
  onRefreshData: () => void;
  currentUser?: User | null;
}> = (props) => {
  const { hash } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const activeHash = hash || searchParams.get('hash') || searchParams.get('student') || '';

  if (!activeHash) {
    return <Navigate to="/login" replace />;
  }

  return (
    <StudentPrivateLayout
      publicHash={activeHash}
      students={props.students}
      classes={props.classes}
      sessions={props.sessions}
      homeworkTasks={props.homeworkTasks}
      homeworkSubmissions={props.homeworkSubmissions}
      invoices={props.invoices}
      bankConfig={props.bankConfig}
      loadData={props.onRefreshData}
      currentUser={props.currentUser || null}
    />
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageEngine.getCurrentUser());
  const [activeRoleView, setActiveRoleView] = useState<UserRole>('super_admin');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [selectedNotificationSubmissionId, setSelectedNotificationSubmissionId] = useState<string | null>(null);

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
  const [syncTick, setSyncTick] = useState<number>(0);

  const loadData = () => {
    const loadedStudents = StorageEngine.getStudents();
    const loadedClasses = StorageEngine.getClasses();
    const loadedSessions = StorageEngine.getSessions();
    const dismissedIds = StorageEngine.getDismissedPendingTaskIds() || [];

    setStudents([...loadedStudents]);
    setClasses([...loadedClasses]);
    setSessions([...loadedSessions]);
    setHomeworkTasks([...StorageEngine.getHomeworkTasks()]);
    setHomeworkSubmissions([...StorageEngine.getHomeworkSubmissions()]);
    setInvoices([...StorageEngine.getInvoices()]);
    setBankConfig(StorageEngine.getBankConfig() || INITIAL_BANK_CONFIG_FALLBACK);
    setCurrentUser(StorageEngine.getCurrentUser());
    setSyncTick((prev) => prev + 1);

    // One-time sync derived pending tasks & fine records to direct Supabase tables
    try {
      PendingTaskService.syncDerivedPendingTasks(loadedClasses, loadedSessions, loadedStudents, dismissedIds);
    } catch (e) {}
  };

  useEffect(() => {
    CloudSyncEngine.pullInitialCloudData()
      .then(() => {
        loadData();
      })
      .finally(() => {
        setIsCloudLoading(false);
      });

    const unsubscribeCloud = CloudSyncEngine.subscribeToCloudData(() => {
      console.log('[SYNC][STATE] Cloud sync event received in App -> triggering loadData');
      loadData();
    });

    const unsubscribeStorage = StorageEngine.onDataChange(() => {
      console.log('[SYNC][STATE] Storage memory change received in App -> triggering loadData');
      loadData();
    });

    const handleFocus = () => {
      CloudSyncEngine.pullInitialCloudData().then(() => {
        loadData();
      });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeCloud();
      unsubscribeStorage();
      window.removeEventListener('focus', handleFocus);
    };
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
    StorageEngine.setLastStudentPortalUrl(null);
    setCurrentUser(null);
    navigate('/login');
  };

  // CHECK IF CURRENT URL IS A STUDENT SECRET/PRIVATE LINK (/s/:hash, /student/:hash, or ?student=:hash)
  const searchParams = new URLSearchParams(location.search);
  const studentHashParam = searchParams.get('hash') || searchParams.get('student');
  const isSecretPath = location.pathname.startsWith('/s/');
  const secretPathHash = isSecretPath ? location.pathname.replace('/s/', '') : null;
  const isStudentIdPath = location.pathname.startsWith('/student/') &&
    location.pathname !== '/student/achievement' &&
    !location.pathname.startsWith('/student/session/') &&
    !location.pathname.startsWith('/student/settings');
  const studentIdPathHash = isStudentIdPath ? location.pathname.replace('/student/', '') : null;

  const activeStudentSecretHash = secretPathHash || studentIdPathHash || (location.pathname === '/' ? studentHashParam : null);

  useEffect(() => {
    if (activeStudentSecretHash) {
      const matchedStd = students.find((s) => s && (s.publicHash === activeStudentSecretHash || s.id === activeStudentSecretHash));
      if (matchedStd) {
        const currentUrl = location.pathname + location.search;
        StorageEngine.setLastStudentPortalUrl(currentUrl);
      }
    }
  }, [activeStudentSecretHash, location.pathname, location.search, students]);

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

  if (activeStudentSecretHash) {
    return (
      <StudentPrivateLayout
        publicHash={activeStudentSecretHash}
        students={students}
        classes={classes}
        sessions={sessions}
        homeworkTasks={homeworkTasks}
        homeworkSubmissions={homeworkSubmissions}
        invoices={invoices}
        bankConfig={bankConfig}
        loadData={loadData}
        currentUser={currentUser}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />
    );
  }

  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* MAIN NESTED LAYOUT WRAPPER */}
          <Route
            element={
              <MainLayout
                currentUser={currentUser}
                currentRole={activeRoleView}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                onOpenLogin={() => navigate('/login')}
                onLogout={handleLogout}
                onOpenAccountManagement={() => setIsAccountManagementOpen(true)}
                onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
                onOpenGeminiSettings={() => setIsGeminiSettingsOpen(true)}
                onResetData={loadData}
                syncTick={syncTick}
              />
            }
          >
            {/* PUBLIC ROUTE: ROOT & ROLE REDIRECT */}
            <Route path="/" element={<RootRouteHandler currentUser={currentUser} students={students} />} />

            {/* REALTIME ISOLATION TEST ROUTE */}
            <Route path="/realtime-test" element={<RealtimeIsolationTest />} />

            {/* PUBLIC ROUTE: LOGIN */}
            <Route
              path="/login"
              element={
                <LoginModal
                  isOpen={true}
                  canClose={!!currentUser}
                  onClose={() => {
                    if (currentUser) {
                      if (currentUser.role === 'student') navigate('/student');
                      else if (currentUser.role === 'teacher') navigate('/teacher');
                      else if (currentUser.role === 'admin') navigate('/admin');
                      else if (currentUser.role === 'super_admin') navigate('/super-admin');
                      else navigate('/student');
                    }
                  }}
                  onLoginSuccess={(user) => {
                    StorageEngine.setCurrentUser(user);
                    setCurrentUser(user);
                    if (user.role === 'student') navigate('/student');
                    else if (user.role === 'teacher') navigate('/teacher');
                    else if (user.role === 'admin') navigate('/admin');
                    else if (user.role === 'super_admin') navigate('/super-admin');
                    else navigate('/student');
                  }}
                />
              }
            />

            {/* PUBLIC ROUTE: SECRET LINK (/s/:hash and /student/:hash) */}
            <Route
              path="/s/:hash"
              element={
                <SecretLinkWrapper
                  students={students}
                  classes={classes}
                  sessions={sessions}
                  homeworkTasks={homeworkTasks}
                  homeworkSubmissions={homeworkSubmissions}
                  invoices={invoices}
                  bankConfig={bankConfig}
                  onRefreshData={loadData}
                />
              }
            />
            <Route
              path="/student/:hash"
              element={
                <SecretLinkWrapper
                  students={students}
                  classes={classes}
                  sessions={sessions}
                  homeworkTasks={homeworkTasks}
                  homeworkSubmissions={homeworkSubmissions}
                  invoices={invoices}
                  bankConfig={bankConfig}
                  onRefreshData={loadData}
                />
              }
            />

            {/* STUDENT ROUTES */}
            <Route
              path="/student"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'super_admin']}>
                  <StudentPortal
                    currentStudent={students.find((s) => s.email === currentUser?.email) || students[0]}
                    classes={classes}
                    sessions={sessions}
                    homeworkTasks={homeworkTasks}
                    homeworkSubmissions={homeworkSubmissions}
                    invoices={invoices}
                    bankConfig={bankConfig}
                    onRefreshData={loadData}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/session/:sessionId"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'super_admin']}>
                  <StudentPortal
                    currentStudent={students.find((s) => s.email === currentUser?.email) || students[0]}
                    classes={classes}
                    sessions={sessions}
                    homeworkTasks={homeworkTasks}
                    homeworkSubmissions={homeworkSubmissions}
                    invoices={invoices}
                    bankConfig={bankConfig}
                    onRefreshData={loadData}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/achievement"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['student', 'super_admin']}>
                  <StudentPortal
                    currentStudent={students.find((s) => s.email === currentUser?.email) || students[0]}
                    classes={classes}
                    sessions={sessions}
                    homeworkTasks={homeworkTasks}
                    homeworkSubmissions={homeworkSubmissions}
                    invoices={invoices}
                    bankConfig={bankConfig}
                    onRefreshData={loadData}
                  />
                </ProtectedRoute>
              }
            />

            {/* TEACHER ROUTES */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['teacher', 'super_admin']}>
                  <TeacherPortal
                    currentUser={currentUser}
                    classes={classes}
                    students={students}
                    sessions={sessions}
                    onRefreshData={loadData}
                    onOpenAddSession={handleOpenAddOrEditSession}
                    targetSubmissionId={selectedNotificationSubmissionId}
                    syncTick={syncTick}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/class/:classId"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['teacher', 'super_admin']}>
                  <TeacherPortal
                    currentUser={currentUser}
                    classes={classes}
                    students={students}
                    sessions={sessions}
                    onRefreshData={loadData}
                    onOpenAddSession={handleOpenAddOrEditSession}
                    syncTick={syncTick}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/session/:sessionId"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['teacher', 'super_admin']}>
                  <TeacherPortal
                    currentUser={currentUser}
                    classes={classes}
                    students={students}
                    sessions={sessions}
                    onRefreshData={loadData}
                    onOpenAddSession={handleOpenAddOrEditSession}
                    syncTick={syncTick}
                  />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'super_admin']}>
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
                    targetSubmissionId={selectedNotificationSubmissionId}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/class/:classId"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'super_admin']}>
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
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['admin', 'super_admin']}>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <PendingTasksDashboard
                      classes={classes}
                      sessions={sessions}
                      students={students}
                      currentUser={currentUser}
                      onOpenAddSession={handleOpenAddOrEditSession}
                    />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* SUPER ADMIN ROUTES */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['super_admin']}>
                  <AdminDashboard
                    currentUser={currentUser}
                    effectiveRole="super_admin"
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
                    targetSubmissionId={selectedNotificationSubmissionId}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/accounts"
              element={
                <ProtectedRoute currentUser={currentUser} allowedRoles={['super_admin']}>
                  <AccountManagementModal
                    isOpen={true}
                    onClose={() => navigate('/super-admin')}
                    onRefreshUsers={loadData}
                  />
                </ProtectedRoute>
              }
            />

            {/* SHARED ROUTES */}
            <Route
              path="/leaderboard"
              element={
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <LeaderboardWidget
                    isOpen={true}
                    onClose={() => navigate(-1)}
                    students={students}
                    sessions={sessions}
                    homeworkSubmissions={homeworkSubmissions}
                    isEmbedded={true}
                  />
                </div>
              }
            />
            <Route
              path="/hall-of-fame"
              element={
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <LeaderboardWidget
                    isOpen={true}
                    onClose={() => navigate(-1)}
                    students={students}
                    sessions={sessions}
                    homeworkSubmissions={homeworkSubmissions}
                    isEmbedded={true}
                    initialTab="hall_of_fame"
                  />
                </div>
              }
            />

            {/* 404 NOT FOUND */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      {/* SHARED MODALS */}
      {isAccountManagementOpen && (
        <AccountManagementModal
          isOpen={isAccountManagementOpen}
          onClose={() => setIsAccountManagementOpen(false)}
          onRefreshUsers={loadData}
        />
      )}

      {isLeaderboardOpen && (
        <LeaderboardWidget
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          students={students}
          sessions={sessions}
          homeworkSubmissions={homeworkSubmissions}
        />
      )}

      {isGeminiSettingsOpen && (
        <GeminiSettingsModal
          isOpen={isGeminiSettingsOpen}
          onClose={() => setIsGeminiSettingsOpen(false)}
        />
      )}

      {isAddSessionOpen && (
        <AddSessionModal
          isOpen={isAddSessionOpen}
          onClose={() => {
            setIsAddSessionOpen(false);
            setEditingSession(null);
          }}
          classes={classes}
          students={students}
          sessions={sessions}
          onSessionAdded={loadData}
          defaultClassId={addSessionClassId}
          editingSession={editingSession}
        />
      )}
    </>
  );
}
