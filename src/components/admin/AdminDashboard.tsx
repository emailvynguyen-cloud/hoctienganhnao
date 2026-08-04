import React, { useState, useEffect } from 'react';
import { Student, Class, Invoice, BankConfig, Session, User, UserRole } from '../../types';
import { MonthlyRevenueWidget } from './MonthlyRevenueWidget';
import { HomeworkGradingWidget } from './HomeworkGradingWidget';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from './ClassDetailsView';
import { AiStudioPortal } from './AiStudioPortal';
import { StudentPortal } from '../student/StudentPortal';
import { ReceiptGeneratorModal } from './ReceiptGeneratorModal';
import { StorageEngine } from '../../lib/storage';
import { formatVND } from '../../lib/vietqr';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { EditClassModal } from './EditClassModal';
import { EditStudentModal } from './EditStudentModal';
import {
  Users,
  BookOpen,
  Plus,
  X,
  Edit2,
  Trash2,
  DollarSign,
  QrCode,
  Share2,
  Lock,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
  Crown,
  Search,
  MessageSquare,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Home,
  Eye,
  Video,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  effectiveRole?: UserRole;
  students: Student[];
  classes: Class[];
  invoices: Invoice[];
  sessions: Session[];
  bankConfig: BankConfig;
  onUpdateStudents: () => void;
  onUpdateClasses: () => void;
  onUpdateInvoices: () => void;
  onOpenAddSession: (classId?: string, editingSession?: Session) => void;
  onOpenAccountManagement: () => void;
  onSetSubViewNavigation?: (canBack: boolean, onBack?: () => void, onHome?: () => void) => void;
  targetSubmissionId?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  effectiveRole,
  students,
  classes,
  invoices,
  sessions,
  bankConfig,
  onUpdateStudents,
  onUpdateClasses,
  onUpdateInvoices,
  onOpenAddSession,
  onOpenAccountManagement,
  onSetSubViewNavigation,
  targetSubmissionId,
}) => {
  // Respect effectiveRole from Super Admin Quick Role Switcher bar
  const isSuperAdmin = currentUser?.role === 'super_admin' && effectiveRole !== 'admin';

  const [activeTab, setActiveTab] = useState<'timetable' | 'grading' | 'teachers' | 'revenue' | 'classes' | 'students' | 'invoices'>('timetable');

  // Expanded Teacher in Teachers Management Tab
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
    }
  }, [targetSubmissionId]);

  // Dedicated Inspection Sub-Views (Keeps Manager Portal Context Intact & Syncs 100% with Props)
  const [inspectedClassId, setInspectedClassId] = useState<string | null>(null);
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);

  const activeInspectedStudent = inspectedStudentId
    ? (students || []).find((s) => s && s.id === inspectedStudentId) || null
    : null;

  const activeInspectedClass = inspectedClassId
    ? (classes || []).find((c) => c && c.id === inspectedClassId) || null
    : null;

  // Selected Student for Receipt Generator Tool
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

  // Search Queries
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Form Modals State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Custom Delete Confirm Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemType: 'class' | 'student' | 'teacher';
    itemName: string;
    itemDetail?: string;
    targetId?: string;
  }>({
    isOpen: false,
    itemType: 'class',
    itemName: '',
  });

  // Super Admin Edit Modals State
  const [editingClassModal, setEditingClassModal] = useState<Class | null>(null);
  const [editingStudentModal, setEditingStudentModal] = useState<Student | null>(null);
  const [classStatusFilter, setClassStatusFilter] = useState<'active' | 'archived'>('active');

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('Ms. Vy');
  const [newSchedule, setNewSchedule] = useState('T2 - T4 - T6 (18:00 - 19:30)');
  const [newCourseName, setNewCourseName] = useState('IELTS Breakthrough');
  const [newZoomLink, setNewZoomLink] = useState('');
  const [newStartSessionNumber, setNewStartSessionNumber] = useState(1);
  const [newTeacherPayRate, setNewTeacherPayRate] = useState(150000);

  // New Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  const [newSessionCount, setNewSessionCount] = useState(8);
  const [newTuitionPrice, setNewTuitionPrice] = useState(2000000);

  const safeStudents = students || [];
  const safeClasses = classes || [];

  useEffect(() => {
    if (safeClasses.length > 0 && !newStudentClassId) {
      setNewStudentClassId(safeClasses[0].id);
    }
  }, [safeClasses, newStudentClassId]);

  // AUTO SWITCH TO GRADING TAB WHEN NOTIFICATION IS CLICKED
  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
      setInspectedClassId(null);
      setInspectedStudentId(null);
    }
  }, [targetSubmissionId]);

  // Handle Sub-View Navigation Updates to Parent Header
  useEffect(() => {
    if (onSetSubViewNavigation) {
      if (activeInspectedStudent) {
        onSetSubViewNavigation(true, () => setInspectedStudentId(null), () => {
          setInspectedStudentId(null);
          setInspectedClassId(null);
          setActiveTab('timetable');
        });
      } else if (activeInspectedClass) {
        onSetSubViewNavigation(true, () => setInspectedClassId(null), () => {
          setInspectedClassId(null);
          setActiveTab('timetable');
        });
      } else {
        onSetSubViewNavigation(false);
      }
    }
  }, [activeInspectedStudent, activeInspectedClass, onSetSubViewNavigation]);

  // HELPER: Detect if teacher is Ms. Vy
  const isMsVyTeacher = (teacherName?: string, teacherId?: string) => {
    if (!teacherName && !teacherId) return false;
    const nameLower = (teacherName || '').toLowerCase();
    return (
      nameLower.includes('vy') ||
      teacherId === 'u_super_admin' ||
      teacherId === currentUser?.uid ||
      nameLower.includes('điều hành')
    );
  };

  // TIMETABLE CLASSES: ALWAYS filter strictly ONLY Ms. Vy's own classes for Ms. Vy's timetable!
  const msVyTimetableClasses = safeClasses.filter((cls) => isMsVyTeacher(cls.teacherName, cls.teacherId));

  // OTHER TEACHERS LIST (EXCLUDING MS. VY)
  const allUsers = StorageEngine.getUsers() || [];
  const registeredTeacherUsers = allUsers.filter((u) => u.role === 'teacher' && !isMsVyTeacher(u.displayName, u.uid));

  // Also collect any teachers referenced in classes who might not be in registeredTeacherUsers
  const otherTeachersMap = new Map<string, { id: string; name: string; email?: string; phone?: string; avatarUrl?: string }>();

  registeredTeacherUsers.forEach((u) => {
    otherTeachersMap.set(u.uid, {
      id: u.uid,
      name: u.displayName,
      email: u.email,
      phone: u.phoneNumber,
      avatarUrl: u.avatarUrl,
    });
  });

  safeClasses.forEach((cls) => {
    if (cls.teacherName && !isMsVyTeacher(cls.teacherName, cls.teacherId)) {
      const key = cls.teacherId || cls.teacherName;
      if (!otherTeachersMap.has(key)) {
        otherTeachersMap.set(key, {
          id: key,
          name: cls.teacherName,
          email: `${cls.teacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@msvyenglish.edu.vn`,
        });
      }
    }
  });

  const otherTeachersList = Array.from(otherTeachersMap.values());

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ có Super Admin mới có quyền khởi tạo lớp học mới!');
      return;
    }

    if (!newClassName || !newClassCode) {
      alert('Vui lòng nhập đầy đủ Tên lớp và Mã lớp!');
      return;
    }

    const selectedTeacherObj = otherTeachersList.find((t) => t.name === newTeacherName);
    const teacherId = newTeacherName.includes('Vy') ? 'u_super_admin' : (selectedTeacherObj?.id || 'u_admin');

    StorageEngine.addClass({
      className: newClassName,
      code: newClassCode,
      teacherName: newTeacherName || 'Ms. Vy',
      teacherId,
      schedule: newSchedule || 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 19:30)',
      courseName: newCourseName || 'Tiếng Anh Giao Tiếp',
      zoomLink: newZoomLink,
      startSessionNumber: Number(newStartSessionNumber) || 1,
      teacherPayRatePerSession: Number(newTeacherPayRate) || 150000,
      resourceLinks: [],
    });

    alert(`Đã tạo lớp học thành công! Các buổi học sẽ bắt đầu tính từ Buổi #${newStartSessionNumber || 1}`);
    setNewClassName('');
    setNewClassCode('');
    setIsAddClassOpen(false);
    onUpdateClasses();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ có Super Admin mới có quyền thêm học viên vào lớp!');
      return;
    }

    if (!newStudentName) {
      alert('Vui lòng điền Họ và tên học viên!');
      return;
    }

    const assignedClassId = newStudentClassId || (safeClasses[0] ? safeClasses[0].id : 'cls_default');

    StorageEngine.addStudent({
      name: newStudentName,
      email: newStudentEmail || `${newStudentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      phone: newStudentPhone,
      classIds: [assignedClassId],
      remainingSessions: newSessionCount || 8,
      totalPaidSessions: newSessionCount || 8,
      tuitionPackagePrice: newTuitionPrice || 2000000,
      packageSessionCount: newSessionCount || 8,
      avatar: KAKAOTALK_SVG_AVATARS.ryan,
    });

    alert(`Đã thêm học viên "${newStudentName}" vào lớp thành công!`);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    setIsAddStudentOpen(false);
    onUpdateStudents();
  };

  // IF INSPECTING A STUDENT LEARNING PAGE (MANAGER PORTAL CONTEXT INTACT)
  if (activeInspectedStudent) {
    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK / HOME NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedStudentId(null)}
            className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Trang Quản Lý
          </button>

          <div className="text-center">
            <span className="text-xs font-black text-pink-950 dark:text-slate-200 block">
              Đang Xem Trang Học Tập Học Viên: <strong className="text-pink-600 underline">{activeInspectedStudent.name}</strong>
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              (Bạn vẫn đang ở Quyền {isSuperAdmin ? 'Super Admin' : 'Admin'} Management Portal)
            </span>
          </div>

          <button
            onClick={() => {
              setInspectedStudentId(null);
              setInspectedClassId(null);
              setActiveTab('timetable');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home Quản Lý
          </button>
        </div>

        <StudentPortal
          currentStudent={activeInspectedStudent}
          classes={safeClasses}
          sessions={sessions}
          homeworkTasks={StorageEngine.getHomeworkTasks()}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          invoices={invoices}
          bankConfig={bankConfig}
          onRefreshData={onUpdateStudents}
        />
      </div>
    );
  }

  // IF INSPECTING A CLASS DETAILS VIEW (MANAGER PORTAL CONTEXT INTACT)
  if (activeInspectedClass) {
    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK / HOME NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedClassId(null)}
            className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Quản Lý
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
            Đang Xem Chi Tiết Lớp: {activeInspectedClass.className}
          </span>
          <button
            onClick={() => {
              setInspectedClassId(null);
              setActiveTab('timetable');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home Quản Lý
          </button>
        </div>

        <ClassDetailsView
          selectedClass={activeInspectedClass}
          students={safeStudents}
          sessions={sessions}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          currentUser={currentUser}
          onBack={() => setInspectedClassId(null)}
          onOpenAddSession={onOpenAddSession}
          onOpenEditSession={(session) => onOpenAddSession(session.classId, session)}
          onOpenPublicStudentLink={(hash) => {
            const foundStd = safeStudents.find((s) => s.publicHash === hash);
            if (foundStd) {
              setInspectedStudentId(foundStd.id);
            }
          }}
          onDeleteClass={(classId) => {
            StorageEngine.deleteClass(classId);
            onUpdateClasses();
            onUpdateStudents();
            setInspectedClassId(null);
          }}
          onRemoveStudentFromClass={(studentId, classId) => {
            StorageEngine.removeStudentFromClass(studentId, classId);
            onUpdateStudents();
          }}
        />
      </div>
    );
  }

  const filteredClasses = safeClasses.filter((c) =>
    (c.className || '').toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    (c.teacherName || '').toLowerCase().includes(classSearchQuery.toLowerCase())
  );

  const filteredStudents = safeStudents.filter((s) => s && s.status !== 'soft_deleted' && (
    (s.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    (s.phone || '').includes(studentSearchQuery) ||
    (s.email || '').toLowerCase().includes(studentSearchQuery.toLowerCase())
  ));

  return (
    <div className="space-y-6">
      
      {/* Role Notice Banner */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between text-xs font-bold shadow-xs ${
        isSuperAdmin
          ? 'bg-gradient-to-r from-pink-200 via-amber-100 to-sky-100 text-pink-950 border-pink-300'
          : 'bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 text-pink-950 border-pink-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isSuperAdmin ? <Crown className="w-5 h-5 text-amber-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-pink-600 shrink-0" />}
          <span>
            {isSuperAdmin
              ? 'Bạn đang ở phân hệ SUPER ADMIN (Điều Hành Cao Nhất): Quản lý thời khóa biểu Ms. Vy, theo dõi đội ngũ giáo viên, học viên, học phí & doanh thu.'
              : 'Bạn đang ở phân hệ QUẢN TRỊ VIÊN (Admin): Theo dõi lịch học, danh sách lớp học, học viên & Chấm bài tập về nhà.'}
          </span>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => StorageEngine.downloadDatabaseBackupFile()}
            className="px-3.5 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-md flex items-center shrink-0 border border-emerald-500 cursor-pointer"
            title="Tải về file sao lưu toàn bộ dữ liệu thực (.json) lưu trữ an toàn trên máy tính"
          >
            💾 Sao Lưu Dữ Liệu Thực (.json)
          </button>
        )}
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-pink-100 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'timetable'
              ? 'bg-pink-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          Thời Khóa Biểu Tuần {isSuperAdmin ? '(Ms. Vy)' : ''}
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'grading'
              ? 'bg-rose-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chấm Bài Tập Về Nhà
        </button>

        <button
          onClick={() => setActiveTab('ai_studio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'ai_studio'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" /> 🤖 AI Studio Dạy Học
        </button>

        {/* TEACHERS MANAGEMENT TAB - SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
              activeTab === 'teachers'
                ? 'bg-sky-400 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Quản Lý Giáo Viên ({otherTeachersList.length})
          </button>
        )}

        {/* REVENUE TAB - SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === 'revenue'
                ? 'bg-emerald-400 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
          }`}
          >
            Doanh Thu Tháng
          </button>
        )}

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'classes'
              ? 'bg-pink-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          Tất Cả Lớp Học ({safeClasses.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'students'
              ? 'bg-pink-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          Danh Sách Học Viên ({safeStudents.filter(s => s && s.status !== 'soft_deleted').length})
        </button>

        {/* INVOICE & TUITION MANAGEMENT TAB - SUPER ADMIN ONLY */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-sky-400 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50'
          }`}
          >
            Quản Lý Học Phí & VietQR
          </button>
        )}
      </div>

      {/* TAB 1: WEEKLY TIMETABLE (SUPER ADMIN SHOWS ONLY MS. VY'S CLASSES TO KEEP IT CLEAN & LEAN) */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {isSuperAdmin && (
            <div className="p-3.5 rounded-2xl bg-pink-100/80 text-pink-950 border border-pink-200 text-xs font-bold flex items-center justify-between shadow-2xs">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-pink-500 animate-pulse" />
                Lịch dạy cá nhân của <strong className="ml-1">Ms. Vy</strong>
              </span>
              <button
                onClick={() => setActiveTab('teachers')}
                className="px-3 py-1 rounded-xl bg-white text-sky-950 border border-sky-300 font-extrabold text-[11px] hover:bg-sky-50 transition"
              >
                Xem Lớp Của Các Giáo Viên Khác →
              </button>
            </div>
          )}

          <WeeklyTimetable
            classes={msVyTimetableClasses}
            students={safeStudents}
            sessions={sessions}
            onOpenAddSession={onOpenAddSession}
          />
        </div>
      )}

      {/* TAB 2: HOMEWORK GRADING QUEUE */}
      {activeTab === 'grading' && (
        <HomeworkGradingWidget
          currentUser={currentUser}
          students={safeStudents}
          classes={safeClasses}
          onRefreshData={onUpdateStudents}
          targetSubmissionId={targetSubmissionId}
        />
      )}

      {/* TAB 3: TEACHERS MANAGEMENT - SUPER ADMIN ONLY (EXCLUDES MS. VY, SHOWS OTHER TEACHERS & THEIR CLASSES ON CLICK) */}
      {activeTab === 'teachers' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-sky-600" /> Quản Lý Đội Ngũ Giáo Viên Trung Tâm ({otherTeachersList.length} Giáo Viên)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bấm vào tên từng giáo viên bên dưới để xem danh sách toàn bộ các lớp học hiện có của người đó
              </p>
            </div>

            {/* ADD TEACHER BUTTON - SUPER ADMIN ONLY */}
            <button
              onClick={onOpenAccountManagement}
              className="px-4 py-2.5 rounded-2xl bg-sky-200 text-sky-950 font-extrabold text-xs hover:bg-sky-300 border border-sky-300 transition shadow-xs flex items-center shrink-0"
            >
              + Cấp Tài Khoản Giáo Viên Mới
            </button>
          </div>

          {/* OTHER TEACHERS LIST & EXPANDABLE CLASSES */}
          <div className="space-y-4">
            {otherTeachersList.map((teacher) => {
              const teacherClasses = safeClasses.filter(
                (c) => c.teacherId === teacher.id || (c.teacherName && c.teacherName.toLowerCase().includes(teacher.name.toLowerCase()))
              );

              const isExpanded = selectedTeacherId === teacher.id;

              return (
                <div
                  key={teacher.id}
                  className="rounded-3xl border border-sky-100 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-800/40 overflow-hidden shadow-2xs transition"
                >
                  {/* Teacher Card Header */}
                  <div
                    onClick={() => setSelectedTeacherId(isExpanded ? null : teacher.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-sky-100/50 transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-sky-200 text-sky-950 flex items-center justify-center font-black text-lg shrink-0 border border-sky-300">
                        👩‍🏫
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-base text-slate-900 dark:text-white">
                            {teacher.name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-200 text-sky-950">
                            Giáo viên active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Email: {teacher.email} • SĐT: {teacher.phone || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 justify-between sm:justify-end">
                      <span className="px-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 text-sky-950 dark:text-sky-300 font-extrabold text-xs border border-sky-200">
                        {teacherClasses.length} Lớp Phụ Trách
                      </span>

                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalState({
                              isOpen: true,
                              itemType: 'teacher',
                              itemName: teacher.name,
                              itemDetail: `Email: ${teacher.email || 'N/A'} • Đang phụ trách: ${teacherClasses.length} lớp`,
                              targetId: teacher.id,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white font-bold text-xs transition flex items-center shrink-0 cursor-pointer"
                          title="Quyền Super Admin: Xóa tài khoản giáo viên này"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa Giáo Viên
                        </button>
                      )}

                      <button className="px-3.5 py-1.5 rounded-xl bg-sky-200 text-sky-950 font-bold text-xs flex items-center">
                        {isExpanded ? (
                          <>
                            Thu Gọn <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Xem Lớp Học ({teacherClasses.length}) <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Teacher Classes List */}
                  {isExpanded && (
                    <div className="p-5 bg-white dark:bg-slate-900 border-t border-sky-100 dark:border-slate-800 space-y-3 animate-fadeIn">
                      <span className="text-xs font-extrabold text-sky-950 dark:text-sky-300 uppercase tracking-wider block">
                        📚 Danh Sách Các Lớp Học Của {teacher.name} ({teacherClasses.length} Lớp):
                      </span>

                      {teacherClasses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {teacherClasses.map((cls) => (
                            <div
                              key={cls.id}
                              className="p-4 rounded-2xl border border-sky-100 bg-sky-50/30 hover:border-sky-300 transition space-y-2.5"
                            >
                              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-400 text-white uppercase">
                                  {cls.code}
                                </span>
                                <span className="text-xs font-bold text-slate-600">{cls.schedule}</span>
                              </div>

                              <div>
                                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                                  {cls.className}
                                </h5>
                                <p className="text-[11px] text-slate-500 mt-0.5">Giáo trình: {cls.courseName}</p>
                              </div>

                              <div className="pt-2 border-t border-sky-100 flex items-center justify-between gap-1.5">
                                <button
                                  onClick={() => setInspectedClass(cls)}
                                  className="text-xs font-extrabold text-sky-700 hover:underline flex items-center"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Chi Tiết Lớp →
                                </button>

                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => onOpenAddSession(cls.id)}
                                    className="px-3 py-1 rounded-xl bg-pink-400 text-white font-bold text-xs hover:bg-pink-500 transition flex items-center"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Thêm Buổi
                                  </button>

                                  {isSuperAdmin && (
                                    <button
                                      onClick={() => {
                                        setDeleteModalState({
                                          isOpen: true,
                                          itemType: 'class',
                                          itemName: cls.className,
                                          itemDetail: `Mã lớp: ${cls.code} • Giáo viên: ${cls.teacherName}`,
                                          targetId: cls.id,
                                        });
                                      }}
                                      className="p-1.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition text-xs font-bold cursor-pointer"
                                      title="Quyền Super Admin: Xóa lớp học"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Giáo viên này chưa được phân công lớp học nào.</p>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE REPORT - SUPER ADMIN ONLY */}
      {activeTab === 'revenue' && isSuperAdmin && (
        <MonthlyRevenueWidget />
      )}

      {/* TAB 5: CLASSES LIST */}
      {activeTab === 'classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-pink-500" /> Danh Sách Các Lớp Học
              </h3>

              {/* ACTIVE VS ARCHIVED TOGGLE */}
              <div className="flex items-center p-1 bg-pink-50 dark:bg-slate-800 rounded-2xl border border-pink-100 dark:border-slate-700 text-xs font-extrabold">
                <button
                  onClick={() => setClassStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    classStatusFilter === 'active'
                      ? 'bg-pink-400 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-pink-600'
                  }`}
                >
                  🟢 Đang Hoạt Động ({safeClasses.filter(c => c && c.status !== 'archived').length})
                </button>
                <button
                  onClick={() => setClassStatusFilter('archived')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    classStatusFilter === 'archived'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                  }`}
                >
                  📦 Đã Lưu Trữ / Bảo Lưu ({safeClasses.filter(c => c && c.status === 'archived').length})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* SEARCH BAR FOR CLASSES */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Tìm tên lớp, mã lớp, giáo viên..."
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl border border-pink-200 text-xs font-medium bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => setIsAddClassOpen(!isAddClassOpen)}
                  className="px-4 py-2 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs flex items-center shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" /> Thêm Lớp Học Mới
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeClasses
              .filter((cls) => cls && (classStatusFilter === 'archived' ? cls.status === 'archived' : cls.status !== 'archived'))
              .filter((cls) => (
                (cls.className || '').toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                (cls.code || '').toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                (cls.teacherName || '').toLowerCase().includes(classSearchQuery.toLowerCase())
              ))
              .map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setInspectedClassId(cls.id)}
                  className="p-5 rounded-3xl border border-pink-100 bg-pink-50/30 hover:bg-pink-100/50 hover:border-pink-300 transition cursor-pointer space-y-3 group shadow-xs relative"
                >
                  <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase">
                        {cls.code}
                      </span>
                      {cls.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                          📦 Đã Lưu Trữ
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-slate-600">{cls.schedule}</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 transition underline decoration-pink-300">
                      {cls.className}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">GV phụ trách: {cls.teacherName}</p>
                  </div>

                  <div className="pt-2 border-t border-pink-100 flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition flex items-center">
                      Mở Xem Chi Tiết →
                    </span>

                    <div className="flex items-center space-x-1">
                      {isSuperAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingClassModal(cls);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-100 text-sky-900 hover:bg-sky-200 transition text-xs font-bold flex items-center cursor-pointer"
                          title="Quyền Super Admin: Chỉnh sửa thông tin lớp học"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1 text-sky-700" /> Sửa Lớp
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddSession(cls.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-pink-400 text-white font-bold text-xs hover:bg-pink-500 transition flex items-center"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> Thêm Buổi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: STUDENTS LIST (USES RESOLVED KAKAOTALK SVG AVATARS) */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-pink-500" /> Quản Lý Danh Sách Học Viên
            </h3>

            {/* SEARCH BAR FOR STUDENTS */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-pink-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm tên học viên, SĐT, email..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-pink-200 text-xs font-medium bg-pink-50/50 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddStudentOpen(!isAddStudentOpen)}
                className="px-4 py-2.5 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs flex items-center shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Thêm Học Viên Vào Lớp
              </button>
            )}
          </div>

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.map((std) => (
              <div key={std.id} className="p-4 rounded-2xl border border-pink-100 bg-pink-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={resolveAvatarUrl(std.avatar)}
                    alt={std.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className="w-12 h-12 rounded-2xl object-cover border border-pink-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{std.name}</h4>
                    <p className="text-xs text-slate-500">SĐT: {std.phone || ''} • Gói: {formatVND(std.tuitionPackagePrice || 2000000)} / {std.packageSessionCount || 8} buổi</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setInspectedStudentId(std.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Mở Xem Trang Học Tập
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareUrl = `${window.location.origin}/?student=${std.publicHash}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert(`Đã sao chép link trang học tập công khai của em ${std.name} vào bộ nhớ tạm!\n\nLink: ${shareUrl}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-xs hover:bg-emerald-200 transition shadow-xs flex items-center shrink-0 cursor-pointer"
                    title="Sao chép đường link xem trang học tập dành cho Phụ huynh / Học viên"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Copy Link Share
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setEditingStudentModal(std)}
                      className="px-3 py-1.5 rounded-xl bg-sky-100 text-sky-950 border border-sky-300 font-extrabold text-xs hover:bg-sky-200 transition shadow-xs flex items-center shrink-0 cursor-pointer"
                      title="Quyền Super Admin: Sửa thông tin & điều chỉnh gói học phí hiện tại"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 text-sky-700" /> Sửa Học Viên / Học Phí
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setDeleteModalState({
                          isOpen: true,
                          itemType: 'student',
                          itemName: std.name,
                          itemDetail: `SĐT: ${std.phone || 'Chưa có'} • Số buổi còn lại: ${std.remainingSessions} buổi`,
                          targetId: std.id,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white font-extrabold text-xs transition shadow-xs flex items-center cursor-pointer"
                      title="Quyền Super Admin: Xóa học viên vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa Vĩnh Viễn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: INVOICES & TUITION VIETQR MANAGEMENT - SUPER ADMIN ONLY */}
      {activeTab === 'invoices' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          
          {/* Header & Quick Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-100 via-blue-50 to-pink-100 text-sky-950 border-2 border-sky-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-sky-600 animate-pulse" />
                <h3 className="text-lg font-black text-sky-950 dark:text-white">
                  Quản Lý Học Phí & Mã VietQR Tự Động (MBBank 0355176317)
                </h3>
              </div>
              <p className="text-xs text-sky-900 font-medium">
                Tài khoản thụ hưởng: <strong>{bankConfig.bankName} - {bankConfig.accountNo} ({bankConfig.accountName})</strong>
              </p>
            </div>

            <button
              onClick={() => {
                if (safeStudents.length > 0) {
                  setSelectedStudentForReceipt(safeStudents[0]);
                } else {
                  alert('Chưa có học viên nào trong hệ thống!');
                }
              }}
              className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md transition flex items-center shrink-0"
            >
              <DollarSign className="w-4 h-4 mr-1.5" /> + Tạo Phiếu Thu / Mã VietQR Mới
            </button>
          </div>

          {/* PENDING INVOICES LIST (CHỜ PHỤ HUYNH NỘP HỌC PHÍ) */}
          {(() => {
            const pendingInvoices = (invoices || []).filter((inv) => inv && inv.status === 'pending');
            if (pendingInvoices.length === 0) return null;

            return (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border-2 border-amber-300 dark:border-amber-700 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200/80 pb-2.5 gap-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                    <h4 className="font-black text-sm text-amber-950 dark:text-amber-300 uppercase tracking-wider">
                      ⏳ DANH SÁCH PHIẾU THU ĐANG CHỜ THU HỌC PHÍ ({pendingInvoices.length} PHIẾU CHỜ)
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold text-amber-900 bg-amber-200 px-3 py-1 rounded-full border border-amber-300">
                    Bấm "Tick Đã Thu Tiền" để tự động cộng buổi vào tài khoản
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pendingInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div>
                          <span className="font-mono font-black text-xs text-pink-600 block">{inv.code}</span>
                          <h5 className="font-black text-sm text-slate-900 dark:text-white">{inv.studentName}</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          Chờ Thu Học Phí
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số tiền cần thu:</span>
                          <span className="font-black text-emerald-600">{formatVND(inv.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số buổi mua thêm:</span>
                          <span className="font-extrabold text-purple-700">+{inv.sessionsPurchased} Buổi</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                          <span>SĐT: {inv.studentPhone || 'N/A'}</span>
                          <span>Ngày tạo: {inv.createdDate}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận đã nhận ${formatVND(inv.amount)} từ em ${inv.studentName}? Hệ thống sẽ cộng thêm +${inv.sessionsPurchased} buổi học vào tài khoản!`)) {
                              const result = StorageEngine.markInvoiceAsPaid(inv.id);
                              if (result && typeof result === 'object' && result.success) {
                                confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
                                alert(`Thành công! Đã thu ${formatVND(inv.amount)} và tự động cộng +${inv.sessionsPurchased} buổi học cho em ${inv.studentName}!`);
                                onUpdateInvoices();
                                onUpdateStudents();
                              }
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs transition shadow-xs flex items-center shrink-0 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" /> ☑️ Tick Đã Thu Tiền (+{inv.sessionsPurchased} Buổi)
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn hủy phiếu thu #${inv.code} của em ${inv.studentName}?`)) {
                              StorageEngine.deleteInvoice(inv.id);
                              onUpdateInvoices();
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition"
                          title="Hủy bỏ phiếu thu này"
                        >
                          Hủy Phiếu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Student Tuition Fee Status Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
                💳 Danh Sách Theo Dõi Học Phí Học Viên ({safeStudents.filter(s => s && s.status !== 'soft_deleted').length} Học Viên)
              </h4>
              <span className="text-xs font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-full border border-pink-200">
                Click "Tạo Phiếu Thu / VietQR" để gửi cho Phụ huynh
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeStudents.filter(s => s && s.status !== 'soft_deleted').map((std) => {
                const stdClass = safeClasses.find((c) => std.classIds && std.classIds.includes(c.id)) || safeClasses[0];

                return (
                  <div
                    key={std.id}
                    className="p-5 rounded-3xl border border-pink-100 bg-pink-50/30 dark:bg-slate-800/40 hover:bg-pink-100/40 transition space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={resolveAvatarUrl(std.avatar)}
                          alt={std.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                          }}
                          className="w-8 h-8 rounded-xl object-cover border border-pink-200"
                        />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">{std.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-200 text-pink-950">
                        {std.remainingSessions} Buổi Còn
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium space-y-1">
                      <p><strong>Lớp:</strong> {stdClass?.className || 'Ms. Vy English'}</p>
                      <p><strong>SĐT:</strong> {std.phone || 'Chưa có'}</p>
                      <p><strong>Gói học phí:</strong> <span className="font-bold text-pink-600">{formatVND(std.tuitionPackagePrice || 2000000)} / {std.packageSessionCount || 8} buổi</span></p>
                    </div>

                    <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedStudentForReceipt(std)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-200 hover:bg-sky-300 text-sky-950 font-extrabold text-xs transition border border-sky-300 shadow-2xs flex items-center"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1 text-sky-700" /> Tạo Phiếu Thu / VietQR
                      </button>

                      <button
                        onClick={() => setInspectedStudentId(std.id)}
                        className="text-xs font-bold text-pink-600 hover:underline"
                      >
                        Xem Học Tập →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 8: AI STUDIO PORTAL FOR ADMIN / SUPER ADMIN */}
      {activeTab === 'ai_studio' && (
        <AiStudioPortal currentUser={currentUser} />
      )}

      {/* RECEIPT GENERATOR MODAL FOR SUPER ADMIN */}
      {selectedStudentForReceipt && (
        <ReceiptGeneratorModal
          isOpen={!!selectedStudentForReceipt}
          onClose={() => setSelectedStudentForReceipt(null)}
          student={selectedStudentForReceipt}
          classes={safeClasses}
          bankConfig={bankConfig}
          onRefreshData={() => {
            onUpdateInvoices();
            onUpdateStudents();
          }}
        />
      )}

      {/* ADD NEW CLASS MODAL (SUPER ADMIN ONLY) */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto my-auto shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsAddClassOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-black">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Khởi Tạo Lớp Học Mới</h3>
                <p className="text-xs text-slate-500 font-medium">Nhập thông tin tên lớp, mã lớp, lịch học & giáo viên phụ trách</p>
              </div>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Tên Lớp Học (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: IELTS Masterclass 01"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Mã Lớp Học (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: IELTS-MC01"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Giáo Viên Phụ Trách (*)</label>
                  <select
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white font-extrabold cursor-pointer"
                  >
                    <option value="Ms. Vy">👑 Ms. Vy (Super Admin / Điều Hành)</option>
                    {otherTeachersList.map((t) => (
                      <option key={t.id} value={t.name}>
                        👩‍🏫 {t.name} ({t.email || 'Giáo viên'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Giáo Trình Học</label>
                  <input
                    type="text"
                    placeholder="IELTS Breakthrough"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {!newTeacherName.toLowerCase().includes('vy') && (
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 space-y-1">
                  <label className="text-sky-900 dark:text-sky-300 font-black block text-xs">
                    💰 Bậc Lương Cho Từng Buổi Dạy Của Giáo Viên (VNĐ / Buổi Học) (*)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={newTeacherPayRate}
                    onChange={(e) => setNewTeacherPayRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-sky-300 bg-white dark:bg-slate-900 font-mono font-black text-slate-900 dark:text-white text-xs"
                    placeholder="Nhập bậc lương, ví dụ: 150000"
                  />
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold block">
                    Bậc lương này sẽ dùng để tự động tính tổng thu nhập/lương trên trang điều khiển của giáo viên {newTeacherName}.
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Lịch Học Hàng Tuần (Khung 24 giờ, ví dụ: 18:00 - 19:30)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: T3 (18:00 - 19:30), T5 (18:00 - 19:30), T7 (18:00 - 19:30)"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white text-xs font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 font-medium block">
                  💡 Định dạng chuẩn: <strong>T3 (18:00 - 19:30), T5 (18:00 - 19:30)</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Buổi Bắt Đầu Tính Số</label>
                  <input
                    type="number"
                    min="1"
                    value={newStartSessionNumber}
                    onChange={(e) => setNewStartSessionNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Link Zoom Học Online (Tùy chọn)</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={newZoomLink}
                    onChange={(e) => setNewZoomLink(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-400 hover:bg-pink-500 text-white font-black shadow-md transition"
                >
                  ➕ Xác Nhận Tạo Lớp Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW STUDENT MODAL (SUPER ADMIN ONLY) */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-pink-300 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsAddStudentOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Thêm Học Viên Mới Vào Lớp</h3>
                <p className="text-xs text-slate-500 font-medium">Nhập thông tin tên, SĐT, chọn lớp & gói số buổi đăng ký</p>
              </div>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Họ Và Tên Học Viên (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Số Điện Thoại (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="0912345678 (Tùy chọn)"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Xếp Vào Lớp Học (*)</label>
                <select
                  value={newStudentClassId}
                  onChange={(e) => setNewStudentClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                >
                  {safeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.code}) - GV: {cls.teacherName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Số Buổi Học Đăng Ký</label>
                  <input
                    type="number"
                    min="1"
                    value={newSessionCount}
                    onChange={(e) => setNewSessionCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Tổng Học Phí Gói (VNĐ)</label>
                  <input
                    type="number"
                    step="100000"
                    value={newTuitionPrice}
                    onChange={(e) => setNewTuitionPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-extrabold block">Email (Tùy chọn)</label>
                <input
                  type="email"
                  placeholder="hocvien@gmail.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-black shadow-md transition"
                >
                  ➕ Thêm Học Viên Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL FOR SUPER ADMIN */}
      {editingClassModal && (
        <EditClassModal
          isOpen={!!editingClassModal}
          onClose={() => setEditingClassModal(null)}
          targetClass={editingClassModal}
          otherTeachersList={otherTeachersList}
          onRefreshData={onUpdateClasses}
        />
      )}

      {/* EDIT STUDENT & TUITION PACKAGE MODAL FOR SUPER ADMIN */}
      {editingStudentModal && (
        <EditStudentModal
          isOpen={!!editingStudentModal}
          onClose={() => setEditingStudentModal(null)}
          student={editingStudentModal}
          classes={safeClasses}
          onRefreshData={onUpdateStudents}
        />
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL FOR SUPER ADMIN */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        itemType={deleteModalState.itemType}
        itemName={deleteModalState.itemName}
        itemDetail={deleteModalState.itemDetail}
        onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
        onConfirm={() => {
          if (!deleteModalState.targetId) return;
          if (deleteModalState.itemType === 'teacher') {
            StorageEngine.deleteTeacher(deleteModalState.targetId);
            onUpdateClasses();
          } else if (deleteModalState.itemType === 'class') {
            StorageEngine.deleteClass(deleteModalState.targetId);
            onUpdateClasses();
            onUpdateStudents();
          } else if (deleteModalState.itemType === 'student') {
            StorageEngine.deleteStudentPermanently(deleteModalState.targetId);
            onUpdateStudents();
          }
        }}
      />

    </div>
  );
};
