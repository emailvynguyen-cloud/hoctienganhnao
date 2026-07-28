import React, { useState } from 'react';
import { Student, Class, Invoice, BankConfig, Session, User } from '../../types';
import { MonthlyRevenueWidget } from './MonthlyRevenueWidget';
import { HomeworkGradingWidget } from './HomeworkGradingWidget';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from './ClassDetailsView';
import { StorageEngine } from '../../lib/storage';
import { formatVND } from '../../lib/vietqr';
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
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  students: Student[];
  classes: Class[];
  invoices: Invoice[];
  sessions: Session[];
  bankConfig: BankConfig;
  onUpdateStudents: () => void;
  onUpdateClasses: () => void;
  onUpdateInvoices: () => void;
  onOpenPublicLink: (hash: string) => void;
  onOpenAddSession: (classId?: string) => void;
  onOpenAccountManagement: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  students,
  classes,
  invoices,
  sessions,
  bankConfig,
  onUpdateStudents,
  onUpdateClasses,
  onUpdateInvoices,
  onOpenPublicLink,
  onOpenAddSession,
  onOpenAccountManagement,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState<'timetable' | 'grading' | 'teachers' | 'revenue' | 'classes' | 'students' | 'invoices'>('timetable');

  // Dedicated Class Details Inspection View
  const [inspectedClass, setInspectedClass] = useState<Class | null>(null);

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
  const [newStudentClassId, setNewStudentClassId] = useState(classes[0]?.id || '');
  const [newTuitionPrice, setNewTuitionPrice] = useState(2000000);
  const [newSessionCount, setNewSessionCount] = useState(8);

  // Filtered Lists with Null Safeguards
  const safeClasses = classes || [];
  const safeStudents = students || [];

  const filteredClasses = safeClasses.filter((c) =>
    (c.className || '').toLowerCase().includes((classSearchQuery || '').toLowerCase()) ||
    (c.code || '').toLowerCase().includes((classSearchQuery || '').toLowerCase()) ||
    (c.teacherName || '').toLowerCase().includes((classSearchQuery || '').toLowerCase())
  );

  const filteredStudents = safeStudents.filter((s) => s && s.status !== 'soft_deleted').filter((s) =>
    (s.name || '').toLowerCase().includes((studentSearchQuery || '').toLowerCase()) ||
    (s.phone || '').includes(studentSearchQuery || '') ||
    (s.email || '').toLowerCase().includes((studentSearchQuery || '').toLowerCase())
  );

  const teachersList = StorageEngine.getUsers().filter((u) => u && (u.role === 'teacher' || u.role === 'super_admin'));

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Chỉ có Super Admin mới có quyền tạo lớp!');
      return;
    }

    if (!newClassName || !newClassCode) return;

    StorageEngine.addClass({
      className: newClassName,
      code: newClassCode,
      teacherId: 'u_teacher_01',
      teacherName: newTeacherName,
      schedule: newSchedule,
      room: 'Phòng Online / Zoom Premium',
      courseName: newCourseName,
      zoomLink: newZoomLink,
      startSessionNumber: newStartSessionNumber || 1,
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
      avatar: '/ryan.jpg',
    });

    alert('Đã thêm học viên mới vào lớp thành công!');
    setIsAddStudentOpen(false);
    onUpdateStudents();
  };

  // IF INSPECTING A SPECIFIC CLASS DEDICATED PAGE VIEW
  if (inspectedClass) {
    return (
      <ClassDetailsView
        selectedClass={inspectedClass}
        students={safeStudents}
        sessions={sessions}
        homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
        onBack={() => setInspectedClass(null)}
        onOpenAddSession={onOpenAddSession}
        onOpenPublicStudentLink={onOpenPublicLink}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Role Notice Banner */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between text-xs font-bold shadow-sm ${
        isSuperAdmin
          ? 'bg-amber-500 text-white border-amber-400'
          : 'bg-purple-600 text-white border-purple-500'
      }`}>
        <div className="flex items-center space-x-2">
          {isSuperAdmin ? <Crown className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span>
            {isSuperAdmin
              ? 'Bạn đang ở phân hệ SUPER ADMIN (Điều Hành Cao Nhất): Toàn quyền quản lý lớp, giáo viên, học viên, học phí & xem Doanh thu tháng.'
              : 'Bạn đang ở phân hệ QUẢN TRỊ VIÊN (Admin): Theo dõi lớp/học viên, Thêm buổi học & Chấm bài tập về nhà.'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'timetable'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          Thời Khóa Biểu Tuần
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'grading'
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chấm Bài Tập Về Nhà
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
              activeTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Quản Lý Giáo Viên
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === 'revenue'
                ? 'bg-emerald-600 text-white shadow-sm'
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
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          Tất Cả Lớp Học ({safeClasses.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'students'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
        >
          Danh Sách Học Viên ({safeStudents.filter(s => s && s.status !== 'soft_deleted').length})
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50'
          }`}
          >
            Hóa Đơn Học Phí
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

      {/* TAB 2: HOMEWORK GRADING QUEUE (Admin & Super Admin) */}
      {activeTab === 'grading' && (
        <HomeworkGradingWidget
          students={safeStudents}
          onRefreshData={onUpdateStudents}
        />
      )}

      {/* TAB 3: TEACHERS MANAGEMENT (Super Admin Only) */}
      {activeTab === 'teachers' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-indigo-600" /> Quản Lý Đội Ngũ Giáo Viên & Lịch Dạy
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tạo tài khoản giáo viên mới, gán lớp phụ trách và theo dõi tiến độ thời khóa biểu
              </p>
            </div>

            <button
              onClick={onOpenAccountManagement}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition shadow-sm flex items-center"
            >
              + Cấp Tài Khoản Giáo Viên Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachersList.map((t) => {
              const assignedClasses = safeClasses.filter((c) => c && (c.teacherName === t.displayName || c.teacherId === t.uid));

              return (
                <div key={t.uid} className="p-5 rounded-3xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center space-x-3">
                    <img src={t.avatarUrl || '/logo.jpg'} alt={t.displayName} className="w-12 h-12 rounded-2xl object-cover border border-indigo-200" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">{t.displayName}</h4>
                      <p className="text-xs text-slate-500 font-mono">Email: {t.email} • SĐT: {t.phoneNumber || '0912345678'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-100 text-xs text-slate-600 space-y-1">
                    <span className="font-extrabold text-indigo-900 uppercase block">Lớp Được Phụ Trách ({assignedClasses.length} lớp):</span>
                    {assignedClasses.length > 0 ? (
                      assignedClasses.map((cls) => (
                        <p key={cls.id} className="font-medium flex items-center">
                          • {cls.className} ({cls.schedule})
                        </p>
                      ))
                    ) : (
                      <p className="italic text-slate-400">Chưa được gán lớp nào</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY REVENUE (Super Admin Only) */}
      {activeTab === 'revenue' && isSuperAdmin && (
        <MonthlyRevenueWidget />
      )}

      {/* TAB 5: CLASSES LIST (Clicking Any Class Opens Full Dedicated Class Details Page) */}
      {activeTab === 'classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" /> Quản Lý Tất Cả Lớp Học
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bấm vào bất kỳ lớp học nào bên dưới để mở trang thông tin lớp & danh sách buổi học
              </p>
            </div>

            {/* SEARCH BAR FOR CLASSES */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm kiếm lớp học, mã lớp, giáo viên..."
                value={classSearchQuery}
                onChange={(e) => setClassSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-medium bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddClassOpen(!isAddClassOpen)}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm flex items-center shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Tạo Lớp Mới
              </button>
            )}
          </div>

          {/* Add Class Form (INCLUDES START SESSION NUMBER OPTION) */}
          {isAddClassOpen && isSuperAdmin && (
            <form onSubmit={handleCreateClass} className="p-5 rounded-3xl bg-purple-50/90 border border-purple-200 space-y-4 animate-fadeIn text-xs shadow-sm">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <h4 className="font-black text-purple-950 uppercase tracking-wider">Tạo Lớp Học Mới Vừa Chuyển Nền Tảng</h4>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  Hỗ trợ lớp chuyển từ hệ thống cũ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên lớp học *</label>
                  <input
                    type="text"
                    placeholder="e.g. IELTS Intensive 6.5+"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã lớp học *</label>
                  <input
                    type="text"
                    placeholder="e.g. VY-IELTS-65"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                    required
                  />
                </div>

                {/* OPTION BẮT ĐẦU TỪ BUỔI SỐ MẤY */}
                <div className="sm:col-span-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <label className="block font-extrabold text-amber-900 text-xs uppercase">
                    ⭐ Buổi Học Bắt Đầu Của Lớp (Tùy chọn cho lớp chuyển nền tảng):
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1 (mặc định) hoặc 12, 15, 20..."
                      value={newStartSessionNumber}
                      onChange={(e) => setNewStartSessionNumber(Number(e.target.value))}
                      className="w-48 p-2.5 rounded-xl border border-amber-300 bg-white font-black text-amber-900 text-xs"
                    />
                    <span className="text-xs text-amber-800 font-medium">
                      Buổi học đầu tiên ghi nhận cho lớp này sẽ là <strong>Buổi #{newStartSessionNumber || 1}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giáo viên phụ trách</label>
                  <input
                    type="text"
                    placeholder="Tên giáo viên phụ trách"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lịch học hàng tuần</label>
                  <input
                    type="text"
                    placeholder="e.g. T2 - T4 - T6 (18:00 - 19:30)"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên giáo trình</label>
                  <input
                    type="text"
                    placeholder="Giáo trình học"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link phòng học Zoom (nếu có)</label>
                  <input
                    type="url"
                    placeholder="Link Zoom học trực tuyến"
                    value={newZoomLink}
                    onChange={(e) => setNewZoomLink(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-extrabold shadow-md"
                >
                  Lưu & Tạo Lớp
                </button>
              </div>
            </form>
          )}

          {/* Classes Grid - CLICKING ANY CLASS OPENS DEDICATED CLASS PAGE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setInspectedClass(cls)}
                className="p-5 rounded-3xl border border-purple-100 bg-purple-50/40 space-y-3 hover:border-purple-400 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition underline decoration-purple-300">
                    {cls.className}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                    {cls.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600"><strong>Giáo viên:</strong> {cls.teacherName}</p>
                <p className="text-xs text-slate-600"><strong>Lịch học:</strong> {cls.schedule}</p>
                <p className="text-xs text-slate-600"><strong>Bắt đầu từ buổi #:</strong> {cls.startSessionNumber || 1}</p>

                {cls.zoomLink && (
                  <a href={cls.zoomLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-600 font-bold underline block truncate">
                    🔗 Link Zoom: {cls.zoomLink}
                  </a>
                )}

                <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition flex items-center">
                    Mở Xem Chi Tiết Lớp Học & Bài Học →
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddSession(cls.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition flex items-center"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Thêm Buổi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STUDENTS LIST (With Search Bar) */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" /> Quản Lý Danh Sách Học Viên
            </h3>

            {/* SEARCH BAR FOR STUDENTS */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm tên học viên, SĐT, email..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-purple-200 text-xs font-medium bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddStudentOpen(!isAddStudentOpen)}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 transition shadow-sm flex items-center shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" /> Thêm Học Viên Vào Lớp
              </button>
            )}
          </div>

          {/* Add Student Form */}
          {isAddStudentOpen && isSuperAdmin && (
            <form onSubmit={handleCreateStudent} className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 space-y-3 animate-fadeIn text-xs">
              <h4 className="font-black text-purple-900 uppercase">Thêm Học Viên Mới</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tên học viên *"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                  required
                />
                <input
                  type="text"
                  placeholder="Số điện thoại *"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                  required
                />
                <input
                  type="email"
                  placeholder="Email học viên"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-medium"
                />
                <select
                  value={newStudentClassId}
                  onChange={(e) => setNewStudentClassId(e.target.value)}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-bold"
                >
                  {safeClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.className}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Giá gói học phí (e.g. 2000000)"
                  value={newTuitionPrice}
                  onChange={(e) => setNewTuitionPrice(Number(e.target.value))}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-mono"
                />
                <input
                  type="number"
                  placeholder="Số buổi của gói (e.g. 8)"
                  value={newSessionCount}
                  onChange={(e) => setNewSessionCount(Number(e.target.value))}
                  className="p-2.5 rounded-xl border border-purple-200 bg-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-extrabold shadow-md"
                >
                  Lưu & Tạo Học Viên
                </button>
              </div>
            </form>
          )}

          {/* Students List */}
          <div className="space-y-3">
            {filteredStudents.map((std) => (
              <div key={std.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img src={std.avatar || '/logo.jpg'} alt={std.name} className="w-12 h-12 rounded-2xl object-cover border border-purple-200" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{std.name}</h4>
                    <p className="text-xs text-slate-500">SĐT: {std.phone || ''} • Gói: {formatVND(std.tuitionPackagePrice || 2000000)} / {std.packageSessionCount || 8} buổi</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenPublicLink(std.publicHash)}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-100 text-pink-800 font-bold text-xs hover:bg-pink-200 transition flex items-center"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" /> Mở Link Xem Học Tập
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: INVOICES */}
      {activeTab === 'invoices' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-emerald-600" /> Quản Lý Hóa Đơn Học Phí
          </h3>

          <div className="space-y-3">
            {(invoices || []).map((inv) => (
              <div key={inv.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{inv.code} • {inv.studentName}</h4>
                  <p className="text-xs text-slate-500 font-mono">Số tiền: {formatVND(inv.amount || 0)} • {inv.sessionsPurchased || 0} buổi</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inv.status === 'paid' ? '✓ Đã Thanh Toán' : 'Chưa Thanh Toán'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
