import React, { useState, useEffect } from 'react';
import { Student, Class, Invoice, BankConfig, Session, User, UserRole } from '../../types';
import { MonthlyRevenueWidget } from './MonthlyRevenueWidget';
import { HomeworkGradingWidget } from './HomeworkGradingWidget';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from './ClassDetailsView';
import { StudentPortal } from '../student/StudentPortal';
import { ReceiptGeneratorModal } from './ReceiptGeneratorModal';
import { StorageEngine } from '../../lib/storage';
import { formatVND } from '../../lib/vietqr';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import {
  Users,
  BookOpen,
  Plus,
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
  ArrowLeft,
  Home,
  Eye,
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
  onOpenAddSession: (classId?: string) => void;
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

  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
    }
  }, [targetSubmissionId]);

  // Dedicated Inspection Sub-Views (Keeps Manager Portal Context Intact)
  const [inspectedClass, setInspectedClass] = useState<Class | null>(null);
  const [inspectedStudent, setInspectedStudent] = useState<Student | null>(null);

  // Selected Student for Receipt Generator Tool
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

  // Search Queries
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Form Modals State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // New Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('Teacher Alex Smith');
  const [newSchedule, setNewSchedule] = useState('T2 - T4 - T6 (18:00 - 19:30)');
  const [newCourseName, setNewCourseName] = useState('IELTS Breakthrough');
  const [newZoomLink, setNewZoomLink] = useState('');
  const [newStartSessionNumber, setNewStartSessionNumber] = useState(1);

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

  // Handle Sub-View Navigation Updates to Parent Header
  useEffect(() => {
    if (onSetSubViewNavigation) {
      if (inspectedStudent) {
        onSetSubViewNavigation(true, () => setInspectedStudent(null), () => {
          setInspectedStudent(null);
          setInspectedClass(null);
          setActiveTab('timetable');
        });
      } else if (inspectedClass) {
        onSetSubViewNavigation(true, () => setInspectedClass(null), () => {
          setInspectedClass(null);
          setActiveTab('timetable');
        });
      } else {
        onSetSubViewNavigation(false);
      }
    }
  }, [inspectedStudent, inspectedClass, onSetSubViewNavigation]);

  // Filtered lists
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

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ có Super Admin mới có quyền khởi tạo lớp học mới!');
      return;
    }

    if (!newClassName || !newClassCode) return;

    StorageEngine.addClass({
      className: newClassName,
      code: newClassCode,
      teacherName: newTeacherName,
      schedule: newSchedule,
      courseName: newCourseName,
      zoomLink: newZoomLink,
      startSessionNumber: Number(newStartSessionNumber) || 1,
      resourceLinks: [],
    });

    alert(`Đã tạo lớp học thành công! Các buổi học sẽ bắt đầu tính từ Buổi #${newStartSessionNumber || 1}`);
    setIsAddClassOpen(false);
    onUpdateClasses();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ có Super Admin mới có quyền thêm học viên vào lớp!');
      return;
    }

    if (!newStudentName || !newStudentPhone) return;

    StorageEngine.addStudent({
      name: newStudentName,
      email: newStudentEmail || `${newStudentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      phone: newStudentPhone,
      classIds: [newStudentClassId],
      remainingSessions: newSessionCount,
      totalPaidSessions: newSessionCount,
      tuitionPackagePrice: newTuitionPrice,
      packageSessionCount: newSessionCount,
      avatar: KAKAOTALK_SVG_AVATARS.ryan,
    });

    alert('Đã thêm học viên mới vào lớp thành công!');
    setIsAddStudentOpen(false);
    onUpdateStudents();
  };

  // IF INSPECTING A STUDENT LEARNING PAGE (MANAGER PORTAL CONTEXT INTACT)
  if (inspectedStudent) {
    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK / HOME NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedStudent(null)}
            className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Trang Quản Lý
          </button>

          <div className="text-center">
            <span className="text-xs font-black text-pink-950 dark:text-slate-200 block">
              Đang Xem Trang Học Tập Học Viên: <strong className="text-pink-600 underline">{inspectedStudent.name}</strong>
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              (Bạn vẫn đang ở Quyền {isSuperAdmin ? 'Super Admin' : 'Admin'} Management Portal)
            </span>
          </div>

          <button
            onClick={() => {
              setInspectedStudent(null);
              setInspectedClass(null);
              setActiveTab('timetable');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home Quản Lý
          </button>
        </div>

        <StudentPortal
          currentStudent={inspectedStudent}
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
  if (inspectedClass) {
    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK / HOME NAVIGATION BAR */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedClass(null)}
            className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Quản Lý
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
            Đang Xem Chi Tiết Lớp: {inspectedClass.className}
          </span>
          <button
            onClick={() => {
              setInspectedClass(null);
              setActiveTab('timetable');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home Quản Lý
          </button>
        </div>

        <ClassDetailsView
          selectedClass={inspectedClass}
          students={safeStudents}
          sessions={sessions}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          onBack={() => setInspectedClass(null)}
          onOpenAddSession={onOpenAddSession}
          onOpenPublicStudentLink={(hash) => {
            const foundStd = safeStudents.find((s) => s.publicHash === hash);
            if (foundStd) {
              setInspectedStudent(foundStd);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Role Notice Banner */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between text-xs font-bold shadow-xs ${
        isSuperAdmin
          ? 'bg-gradient-to-r from-pink-200 via-amber-100 to-sky-100 text-pink-950 border-pink-300'
          : 'bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 text-pink-950 border-pink-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isSuperAdmin ? <Crown className="w-5 h-5 text-amber-600" /> : <ShieldAlert className="w-5 h-5 text-pink-600" />}
          <span>
            {isSuperAdmin
              ? 'Bạn đang ở phân hệ SUPER ADMIN (Điều Hành Cao Nhất): Toàn quyền quản lý lớp, giáo viên, học viên, học phí & xem Doanh thu tháng.'
              : 'Bạn đang ở phân hệ QUẢN TRỊ VIÊN (Admin): Theo dõi lịch học, danh sách lớp học, học viên & Chấm bài tập về nhà.'}
          </span>
        </div>
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
          Thời Khóa Biểu Tuần
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
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'teachers'
              ? 'bg-sky-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 mr-1" /> Quản Lý Giáo Viên
        </button>

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

      {/* TAB 1: WEEKLY TIMETABLE */}
      {activeTab === 'timetable' && (
        <WeeklyTimetable
          classes={safeClasses}
          students={safeStudents}
          sessions={sessions}
          onOpenAddSession={onOpenAddSession}
        />
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

      {/* TAB 3: TEACHERS MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-sky-600" /> Quản Lý Đội Ngũ Giáo Viên & Lớp Học Phụ Trách
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bấm vào từng lớp học của giáo viên bên dưới để truy cập trực tiếp trang thông tin & buổi học
              </p>
            </div>

            {/* ADD TEACHER BUTTON - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
              <button
                onClick={onOpenAccountManagement}
                className="px-4 py-2.5 rounded-2xl bg-sky-200 text-sky-950 font-extrabold text-xs hover:bg-sky-300 border border-sky-300 transition shadow-xs flex items-center shrink-0"
              >
                + Cấp Tài Khoản Giáo Viên Mới
              </button>
            )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-pink-500" /> Danh Sách Các Lớp Học
            </h3>

            {/* SEARCH BAR FOR CLASSES */}
            <div className="relative w-full sm:w-72">
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
                className="px-4 py-2.5 rounded-2xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition shadow-xs flex items-center shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Thêm Lớp Học Mới
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setInspectedClass(cls)}
                className="p-5 rounded-3xl border border-pink-100 bg-pink-50/30 hover:bg-pink-100/50 hover:border-pink-300 transition cursor-pointer space-y-3 group shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase">
                    {cls.code}
                  </span>
                  <span className="text-xs font-extrabold text-slate-600">{cls.schedule}</span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 transition underline decoration-pink-300">
                    {cls.className}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">GV: {cls.teacherName}</p>
                </div>

                <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition flex items-center">
                    Mở Xem Chi Tiết Lớp Học & Bài Học →
                  </span>
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
                    onClick={() => setInspectedStudent(std)}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-200 text-pink-950 border border-pink-300 font-extrabold text-xs hover:bg-pink-300 transition flex items-center shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Mở Xem Trang Học Tập
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
