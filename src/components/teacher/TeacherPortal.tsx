import React, { useState, useEffect } from 'react';
import { Class, Student, Session, User as UserType } from '../../types';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from '../admin/ClassDetailsView';
import { StudentPortal } from '../student/StudentPortal';
import { HomeworkGradingWidget } from '../admin/HomeworkGradingWidget';
import { AiStudioPortal } from '../admin/AiStudioPortal';
import { StorageEngine } from '../../lib/storage';
import {
  Calendar,
  Clock,
  Video,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  Users,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Flame,
  X,
  User,
  Coffee,
  Heart,
  ShieldAlert,
  Home,
  ArrowLeft,
  Eye,
  MessageSquare,
  Bell,
  PlayCircle,
  Smile,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';
import { formatVND } from '../../lib/vietqr';

interface TeacherPortalProps {
  currentUser?: UserType | null;
  classes: Class[];
  students: Student[];
  sessions: Session[];
  onRefreshData: () => void;
  onOpenAddSession: (classId?: string, editingSession?: Session) => void;
  onSetSubViewNavigation?: (canBack: boolean, onBack?: () => void, onHome?: () => void) => void;
  targetSubmissionId?: string | null;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  classes,
  students,
  sessions,
  onRefreshData,
  onOpenAddSession,
  onSetSubViewNavigation,
  targetSubmissionId,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'grading' | 'schedule' | 'all_classes' | 'revenue'>('today');
  const [selectedClassForRevenueDetails, setSelectedClassForRevenueDetails] = useState<Class | null>(null);
  const [isAllSessionsRevenueModalOpen, setIsAllSessionsRevenueModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
    }
  }, [targetSubmissionId]);

  // Sub-View Inspection State (Keeps Teacher Portal Context Intact & Syncs 100% with Props)
  const [inspectedClassId, setInspectedClassId] = useState<string | null>(null);
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);

  const activeInspectedStudent = inspectedStudentId
    ? (students || []).find((s) => s && s.id === inspectedStudentId) || null
    : null;

  const activeInspectedClass = inspectedClassId
    ? (classes || []).find((c) => c && c.id === inspectedClassId) || null
    : null;

  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  // HELPER: Month calculation for Teacher Revenue (Current month & Previous month ONLY)
  const getTeacherMonthOptions = () => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonthNum = now.getMonth() + 1;
    const currKey = `${currYear}-${currMonthNum < 10 ? '0' : ''}${currMonthNum}`;
    const currLabel = `${currMonthNum < 10 ? '0' : ''}${currMonthNum}/${currYear}`;

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonthNum = prevDate.getMonth() + 1;
    const prevKey = `${prevYear}-${prevMonthNum < 10 ? '0' : ''}${prevMonthNum}`;
    const prevLabel = `${prevMonthNum < 10 ? '0' : ''}${prevMonthNum}/${prevYear}`;

    return { currKey, currLabel, prevKey, prevLabel };
  };

  const monthOptions = getTeacherMonthOptions();
  const [teacherSelectedMonth, setTeacherSelectedMonth] = useState<string>(monthOptions.currKey);

  // ENTERPRISE SCOPE-BASED ACCESS CONTROL FOR TEACHER PORTAL
  const scopedClasses = StorageEngine.getScopedClasses(currentUser || null, classes || []);
  const scopedStudents = StorageEngine.getScopedStudents(currentUser || null, students || [], classes || []);

  // Use scopedClasses and scopedStudents to enforce scope boundaries
  const myClasses = scopedClasses;
  const myStudents = scopedStudents;

  const isMsVyTeacher = (name?: string, id?: string) => !name || name.toLowerCase().includes('vy') || id === 'u_super_admin';

  const allUsers = StorageEngine.getUsers() || [];
  const otherTeachersList = allUsers.filter((u) => u && u.role === 'teacher');

  const [selectedTeacherPreviewId, setSelectedTeacherPreviewId] = useState<string>('u_super_admin');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const assignedClasses = (classes || []).filter((c) => {
    if (!c || c.status === 'archived') return false;

    if (isSuperAdmin) {
      if (selectedTeacherPreviewId === 'all') return true;
      if (selectedTeacherPreviewId === 'u_super_admin') {
        return isMsVyTeacher(c.teacherName, c.teacherId);
      }
      const matchedTeacherObj = otherTeachersList.find((t) => t.uid === selectedTeacherPreviewId);
      const matchedTeacherName = matchedTeacherObj ? matchedTeacherObj.displayName : '';
      return c.teacherId === selectedTeacherPreviewId || (matchedTeacherName && c.teacherName?.toLowerCase() === matchedTeacherName.toLowerCase());
    }

    // Other teachers (e.g. Ms. Ngọc): strictly match their teacherId or teacherName
    return (
      c.teacherId === currentUser?.uid ||
      (c.teacherName && c.teacherName.toLowerCase() === (currentUser?.displayName || '').toLowerCase())
    );
  });

  // REAL-TIME VIETNAM TIME (ICT / GMT+7) CALCULATION
  const getCurrentVietnamTime = () => {
    const now = new Date();
    try {
      const vnDateStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
      const vnDate = new Date(vnDateStr);
      const hours = vnDate.getHours();
      const minutes = vnDate.getMinutes();
      return {
        hours,
        minutes,
        totalMinutes: hours * 60 + minutes,
        dayIndex: vnDate.getDay(), // 0: Sunday, 1: Monday, ...
      };
    } catch (e) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return {
        hours,
        minutes,
        totalMinutes: hours * 60 + minutes,
        dayIndex: now.getDay(),
      };
    }
  };

  // Helper to parse HH:mm start and end times from class schedule string
  const parseClassTimeRange = (scheduleStr?: string) => {
    if (!scheduleStr) return null;
    const times = scheduleStr.match(/\b(\d{1,2})[:h](\d{2})\b/gi);
    if (!times || times.length < 2) return null;

    const parseTimeStr = (tStr: string) => {
      const clean = tStr.toLowerCase().replace('h', ':');
      const [h, m] = clean.split(':').map((n) => parseInt(n, 10));
      return h * 60 + m;
    };

    const startMinutes = parseTimeStr(times[0]);
    const endMinutes = parseTimeStr(times[1]);

    if (isNaN(startMinutes) || isNaN(endMinutes)) return null;

    return { startMinutes, endMinutes };
  };

  const vnTime = getCurrentVietnamTime();
  const dayKeyMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const todayDayKey = dayKeyMap[vnTime.dayIndex] || 'T2';

  // Find class that is TRULY in session right now in Vietnam Time
  const activeTodayClass = assignedClasses.find((c) => {
    if (!c || !c.schedule) return false;
    const sched = c.schedule.toUpperCase();

    // 1. Check if class is scheduled for today's day of week
    let isToday = false;
    if (todayDayKey === 'T2') isToday = sched.includes('T2') || sched.includes('THỨ 2');
    else if (todayDayKey === 'T3') isToday = sched.includes('T3') || sched.includes('THỨ 3');
    else if (todayDayKey === 'T4') isToday = sched.includes('T4') || sched.includes('THỨ 4');
    else if (todayDayKey === 'T5') isToday = sched.includes('T5') || sched.includes('THỨ 5');
    else if (todayDayKey === 'T6') isToday = sched.includes('T6') || sched.includes('THỨ 6');
    else if (todayDayKey === 'T7') isToday = sched.includes('T7') || sched.includes('THỨ 7');
    else if (todayDayKey === 'CN') isToday = sched.includes('CN') || sched.includes('CHỦ NHẬT');

    if (!isToday) return false;

    // 2. Check if current Vietnam time falls within the class time range
    const timeRange = parseClassTimeRange(c.schedule);
    if (!timeRange) {
      // IF NO TIME RANGE PARSED, DO NOT MARK AS ACTIVE ALL DAY!
      return false;
    }

    const earlyBuffer = 15; // 15 mins before start time
    const lateBuffer = 10;  // 10 mins after end time

    return (
      vnTime.totalMinutes >= (timeRange.startMinutes - earlyBuffer) &&
      vnTime.totalMinutes <= (timeRange.endMinutes + lateBuffer)
    );
  }) || null;

  // Notify parent Header about Sub-View Navigation state
  // AUTO SWITCH TO GRADING TAB WHEN NOTIFICATION IS CLICKED
  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
      setInspectedClassId(null);
      setInspectedStudentId(null);
    }
  }, [targetSubmissionId]);

  useEffect(() => {
    if (onSetSubViewNavigation) {
      if (activeInspectedStudent) {
        onSetSubViewNavigation(
          true,
          () => setInspectedStudentId(null),
          () => {
            setInspectedStudentId(null);
            setInspectedClassId(null);
            setActiveTab('today');
          }
        );
      } else if (activeInspectedClass) {
        onSetSubViewNavigation(
          true,
          () => setInspectedClassId(null),
          () => {
            setInspectedClassId(null);
            setActiveTab('today');
          }
        );
      } else {
        onSetSubViewNavigation(false);
      }
    }
  }, [activeInspectedStudent, activeInspectedClass, onSetSubViewNavigation]);

  // IF INSPECTING A STUDENT LEARNING PAGE FROM TEACHER PORTAL (TEACHER PORTAL CONTEXT INTACT)
  if (activeInspectedStudent) {
    const isEnrolledInTeacherClass = isSuperOrAdmin || assignedClasses.some(
      (c) => activeInspectedStudent.classIds && activeInspectedStudent.classIds.includes(c.id)
    );

    if (!isEnrolledInTeacherClass) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-rose-950">Quyền Truy Cập Bị Giới Hạn</h3>
          <p className="text-xs text-rose-800 font-medium">
            Học viên này không thuộc các lớp học do bạn trực tiếp giảng dạy. Vui lòng quay về bảng điều khiển Giáo Viên.
          </p>
          <button
            onClick={() => setInspectedStudentId(null)}
            className="px-6 py-2.5 rounded-2xl bg-pink-400 text-white font-extrabold text-xs hover:bg-pink-500 shadow-xs"
          >
            ← Quay Về Bảng Giáo Viên
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK BUTTON FOR TEACHER */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedStudentId(null)}
            className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Giáo Viên
          </button>

          <div className="text-center">
            <span className="text-xs font-black text-pink-950 dark:text-slate-200 block">
              Đang Xem Trang Học Tập Học Viên: <strong className="text-pink-600 underline">{activeInspectedStudent.name}</strong>
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              (Bạn vẫn đang ở Teacher Management Portal Context)
            </span>
          </div>

          <button
            onClick={() => {
              setInspectedStudentId(null);
              setInspectedClassId(null);
              setActiveTab('today');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home
          </button>
        </div>

        <StudentPortal
          currentStudent={activeInspectedStudent}
          classes={assignedClasses}
          sessions={sessions}
          homeworkTasks={StorageEngine.getHomeworkTasks()}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          invoices={[]}
          bankConfig={StorageEngine.getBankConfig()!}
          onRefreshData={onRefreshData}
        />
      </div>
    );
  }

  // IF INSPECTING A SPECIFIC CLASS DEDICATED PAGE VIEW
  if (activeInspectedClass) {
    const isAssigned = isSuperOrAdmin || assignedClasses.some((c) => c.id === activeInspectedClass.id);

    if (!isAssigned) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-rose-950">Quyền Truy Cập Bị Giới Hạn</h3>
          <p className="text-xs text-rose-800 font-medium">
            Bạn không có quyền quản lý hoặc xem dữ liệu của lớp học này. Vui lòng quay về trang chủ Giáo Viên của bạn.
          </p>
          <button
            onClick={() => setInspectedClassId(null)}
            className="px-6 py-2.5 rounded-2xl bg-pink-400 text-white font-extrabold text-xs hover:bg-pink-500 shadow-xs"
          >
            ← Quay Về Trang Chủ Giáo Viên
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* SUB-VIEW BREADCRUMB & BACK BUTTON FOR TEACHER */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-pink-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setInspectedClassId(null)}
            className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Giáo Viên
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
            Đang Xem Chi Tiết Lớp: {activeInspectedClass.className}
          </span>
          <button
            onClick={() => {
              setInspectedClassId(null);
              setActiveTab('today');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center shrink-0"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home
          </button>
        </div>

        <ClassDetailsView
          selectedClass={activeInspectedClass}
          students={students}
          sessions={sessions}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          onBack={() => setInspectedClassId(null)}
          onOpenAddSession={onOpenAddSession}
          onOpenEditSession={(session) => onOpenAddSession(session.classId, session)}
          onOpenPublicStudentLink={(hash) => {
            const foundStd = students.find((s) => s.publicHash === hash);
            if (foundStd) {
              setInspectedStudentId(foundStd.id);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Super Admin Teacher Preview Switcher */}
      {isSuperAdmin && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-100 via-pink-100 to-sky-100 dark:from-slate-800 dark:to-slate-800/90 border-2 border-pink-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs text-pink-950 dark:text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-pink-400 text-white font-black shrink-0 shadow-xs">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-sm block">
                👀 Chế Độ Xem Giao Diện Giáo Viên (Super Admin Preview Mode)
              </span>
              <p className="text-[11px] text-pink-900 dark:text-pink-300 font-medium">
                Bạn đang trải nghiệm giao diện Teacher Portal với tư cách Super Admin. Có thể chuyển đổi giáo viên bên cạnh để kiểm tra chi tiết.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <label className="font-extrabold text-xs text-slate-700 dark:text-slate-200">Chọn xem giáo viên:</label>
            <select
              value={selectedTeacherPreviewId}
              onChange={(e) => setSelectedTeacherPreviewId(e.target.value)}
              className="px-3.5 py-2 rounded-xl border-2 border-pink-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-extrabold text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="u_super_admin">👑 Ms. Vy (Lớp Cá Nhân Ms. Vy)</option>
              <option value="all">🌐 Tất Cả Các Lớp Trong Trung Tâm</option>
              {otherTeachersList.map((t) => (
                <option key={t.uid} value={t.uid}>
                  👩‍🏫 {t.displayName} ({t.email || 'Giáo viên'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Teacher Portal Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-pink-100 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'today'
              ? 'bg-pink-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          Lịch Dạy Hôm Nay
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'grading'
              ? 'bg-rose-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          <Bell className="w-3.5 h-3.5 mr-1" /> Bài Tập Cần Feedback
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-sky-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50'
          }`}
        >
          Thời Khóa Biểu Tuần
        </button>

        <button
          onClick={() => setActiveTab('all_classes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
            activeTab === 'all_classes'
              ? 'bg-pink-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
          }`}
        >
          Lớp Phụ Trách ({assignedClasses.length})
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition shrink-0 flex items-center ${
            activeTab === 'revenue'
              ? 'bg-emerald-400 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 mr-1" /> Doanh Thu Lương Dạy
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
      </div>

      {/* TAB 1: TODAY'S CLASSES & SESSIONS */}
      {activeTab === 'today' && (
        <div className="space-y-6">

          {/* REAL-TIME TOP BANNER: ACTIVE CLASS (IN VIETNAM TIME) vs "Hiện không có lớp, nghỉ ngơi đi nhé công chúa" */}
          {activeTodayClass ? (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-100 via-teal-50 to-sky-100 text-emerald-950 shadow-sm border-2 border-emerald-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white uppercase tracking-wider animate-pulse flex items-center">
                      <PlayCircle className="w-3.5 h-3.5 mr-1" /> Lớp Học Đang Bắt Đầu Hôm Nay
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      Mã lớp: {activeTodayClass.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                    {activeTodayClass.className}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-900 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Lịch dạy: <strong>{activeTodayClass.schedule}</strong> • Giáo trình: {activeTodayClass.courseName}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeTodayClass.zoomLink ? (
                    <a
                      href={activeTodayClass.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center cursor-pointer"
                    >
                      <Video className="w-4 h-4 mr-2 animate-bounce" /> Vào Lớp Học Zoom Ngay →
                    </a>
                  ) : (
                    <button
                      onClick={() => setInspectedClassId(activeTodayClass.id)}
                      className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition flex items-center"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" /> Vào Chi Tiết Lớp Học →
                    </button>
                  )}

                  <button
                    onClick={() => onOpenAddSession(activeTodayClass.id)}
                    className="px-4 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs border border-emerald-300 shadow-2xs transition flex items-center"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-600" /> + Thêm Buổi / Nhập Điểm
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-gradient-to-r from-pink-100 via-rose-50 to-purple-100 text-pink-950 shadow-sm border-2 border-pink-300 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-white/80 text-pink-500 flex items-center justify-center text-3xl mx-auto shadow-xs border border-pink-200">
                👑
              </div>
              <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                "Hiện không có lớp, nghỉ ngơi đi nhé công chúa"
              </h3>
              <p className="text-xs font-semibold text-pink-800 max-w-md mx-auto">
                Khung giờ hiện tại không có ca dạy nào, hãy dành thời gian nghỉ ngơi thư thái và nạp năng lượng tuyệt vời nhé em! 💖
              </p>
            </div>
          )}

          {/* Greeting Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-200 via-rose-100 to-sky-100 text-pink-950 shadow-xs border-2 border-pink-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black flex items-center">
                <Coffee className="w-5 h-5 mr-2 text-pink-600" /> Xin Chào Giáo Viên: {currentUser?.displayName || 'Ms. Vy'}!
              </h3>
              <p className="text-xs text-pink-900 font-medium">
                Chúc bạn có một ngày giảng dạy đầy năng lượng và truyền cảm hứng cho các học viên!
              </p>
            </div>

            <button
              onClick={() => onOpenAddSession()}
              className="px-5 py-3 rounded-2xl bg-pink-400 text-white font-extrabold text-xs hover:bg-pink-500 shadow-xs transition shrink-0 flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> + Thêm buổi học
            </button>
          </div>

          {/* Assigned Classes Grid With Alternating Soft Pastel Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClasses.map((cls, idx) => {
              const themes = [
                {
                  bg: 'bg-gradient-to-br from-pink-100/90 via-pink-50 to-rose-100/80 border-pink-200 hover:border-pink-400 hover:bg-pink-100/80',
                  badge: 'bg-pink-400 text-white',
                  title: 'text-pink-950 dark:text-pink-300 group-hover:text-pink-600 underline decoration-pink-300',
                  btn: 'bg-pink-400 hover:bg-pink-500 text-white',
                },
                {
                  bg: 'bg-gradient-to-br from-amber-100/90 via-amber-50 to-yellow-100/80 border-amber-200 hover:border-amber-400 hover:bg-amber-100/80',
                  badge: 'bg-amber-500 text-white',
                  title: 'text-amber-950 dark:text-amber-300 group-hover:text-amber-700 underline decoration-amber-300',
                  btn: 'bg-amber-500 hover:bg-amber-600 text-white',
                },
                {
                  bg: 'bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-teal-100/80 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/80',
                  badge: 'bg-emerald-500 text-white',
                  title: 'text-emerald-950 dark:text-emerald-300 group-hover:text-emerald-700 underline decoration-emerald-300',
                  btn: 'bg-emerald-500 hover:bg-emerald-600 text-white',
                },
                {
                  bg: 'bg-gradient-to-br from-sky-100/90 via-sky-50 to-blue-100/80 border-sky-200 hover:border-sky-400 hover:bg-sky-100/80',
                  badge: 'bg-sky-500 text-white',
                  title: 'text-sky-950 dark:text-sky-300 group-hover:text-sky-700 underline decoration-sky-300',
                  btn: 'bg-sky-500 hover:bg-sky-600 text-white',
                },
                {
                  bg: 'bg-gradient-to-br from-purple-100/90 via-purple-50 to-indigo-100/80 border-purple-200 hover:border-purple-400 hover:bg-purple-100/80',
                  badge: 'bg-purple-500 text-white',
                  title: 'text-purple-950 dark:text-purple-300 group-hover:text-purple-700 underline decoration-purple-300',
                  btn: 'bg-purple-500 hover:bg-purple-600 text-white',
                },
              ];

              const t = themes[idx % themes.length];

              return (
                <div
                  key={cls.id}
                  onClick={() => setInspectedClassId(cls.id)}
                  className={`p-5 rounded-3xl border transition cursor-pointer space-y-3 shadow-xs group ${t.bg}`}
                >
                  <div className="flex items-center justify-between border-b border-pink-100/60 pb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${t.badge}`}>
                      {cls.code}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{cls.schedule}</span>
                  </div>

                  <div>
                    <h4 className={`font-extrabold text-sm transition ${t.title}`}>
                      {cls.className}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">Giáo trình: {cls.courseName}</p>
                  </div>

                  <div className="pt-2 border-t border-pink-100/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:translate-x-1 transition flex items-center">
                      Mở Xem Chi Tiết Lớp →
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddSession(cls.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center shadow-2xs ${t.btn}`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Thêm Buổi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HOMEWORK GRADING QUEUE FOR TEACHER */}
      {activeTab === 'grading' && (
        <HomeworkGradingWidget
          currentUser={currentUser}
          students={students}
          classes={assignedClasses}
          onRefreshData={onRefreshData}
          targetSubmissionId={targetSubmissionId}
        />
      )}

      {/* TAB 3: WEEKLY TIMETABLE FOR TEACHER */}
      {activeTab === 'schedule' && (
        <WeeklyTimetable
          classes={assignedClasses}
          students={students}
          sessions={sessions}
          onOpenAddSession={onOpenAddSession}
          onSelectClass={(cls) => setInspectedClassId(cls.id)}
          onSelectStudent={(std) => setInspectedStudentId(std.id)}
        />
      )}

      {/* TAB 4: ALL ASSIGNED CLASSES LIST */}
      {activeTab === 'all_classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-pink-500" /> Danh Sách Tất Cả Các Lớp Do Bạn Phụ Trách ({assignedClasses.length} Lớp)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setInspectedClassId(cls.id)}
                className="p-5 rounded-3xl border border-pink-100 bg-pink-50/30 hover:bg-pink-100/50 hover:border-pink-300 transition cursor-pointer space-y-3 shadow-xs group"
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
                  <p className="text-xs text-slate-500 mt-0.5">Giáo trình: {cls.courseName}</p>
                </div>

                <div className="pt-2 border-t border-pink-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-600 group-hover:translate-x-1 transition flex items-center">
                    Mở Xem Chi Tiết Lớp →
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

      {/* TAB 5: TEACHER REVENUE / SALARY REPORT */}
      {activeTab === 'revenue' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6 animate-fadeIn">
          
          {/* Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-100 via-teal-50 to-sky-100 text-emerald-950 border-2 border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-emerald-600 animate-pulse" />
                <h3 className="text-lg font-black text-emerald-950 dark:text-white">
                  Bảng Thống Kê Thu Nhập / Lương Giảng Dạy
                </h3>
              </div>
              <p className="text-xs text-emerald-900 font-medium">
                Thu nhập được tính bằng Bậc lương mỗi buổi học x Số buổi dạy hoàn thành trong tháng
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* MONTH SELECTOR FOR TEACHER (CURRENT MONTH & PREVIOUS MONTH ONLY) */}
              <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-emerald-300 shadow-2xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Kỳ Lương:</span>
                <select
                  value={teacherSelectedMonth}
                  onChange={(e) => setTeacherSelectedMonth(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-xs font-black text-emerald-950 dark:text-white px-3 py-1 rounded-xl border border-emerald-200 focus:outline-none cursor-pointer"
                >
                  <option value={monthOptions.currKey}>Tháng Hiện Tại ({monthOptions.currLabel})</option>
                  <option value={monthOptions.prevKey}>Tháng Trước ({monthOptions.prevLabel})</option>
                </select>
              </div>

              <button
                onClick={() => setIsAllSessionsRevenueModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center shrink-0 cursor-pointer"
              >
                <Eye className="w-4 h-4 mr-1.5" /> 🔍 Xem Chi Tiết Các Buổi Đã Tính Lương
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          {(() => {
            const teacherClassesMap = new Map(assignedClasses.map((c) => [c.id, c]));
            const monthTeacherSessions = (sessions || []).filter(
              (s) => s && s.date && s.date.startsWith(teacherSelectedMonth) && teacherClassesMap.has(s.classId)
            );
            
            let totalSalary = 0;
            const classSalaryList = assignedClasses.map((cls) => {
              const clsMonthSessions = (sessions || []).filter(
                (s) => s && s.classId === cls.id && s.date && s.date.startsWith(teacherSelectedMonth)
              );
              const rate = cls.teacherPayRatePerSession || 150000;
              const salary = clsMonthSessions.length * rate;
              totalSalary += salary;
              return {
                classObj: cls,
                sessionCount: clsMonthSessions.length,
                rate,
                totalSalary: salary,
                sessionList: clsMonthSessions,
              };
            });

            return (
              <div className="space-y-6">
                
                {/* 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-100 text-emerald-950 border-2 border-emerald-300 space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-black uppercase text-emerald-900">
                      💰 Lương Dạy (Tháng {teacherSelectedMonth.split('-')[1]})
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
                      {formatVND(totalSalary)}
                    </h4>
                    <p className="text-[10px] text-emerald-800 font-semibold">
                      Tích lũy từ ca dạy trong kỳ {teacherSelectedMonth.split('-').reverse().join('/')}
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 text-sky-950 border-2 border-sky-300 space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-extrabold uppercase text-sky-900">
                      📚 Buổi Dạy Hoàn Thành
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-sky-950 font-mono">
                      {monthTeacherSessions.length} Buổi
                    </h4>
                    <p className="text-[10px] text-sky-800 font-semibold">
                      Tính trong kỳ {teacherSelectedMonth.split('-').reverse().join('/')}
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-gradient-to-r from-pink-100 via-rose-50 to-purple-100 text-pink-950 border-2 border-pink-300 space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-extrabold uppercase text-pink-900">
                      🎓 Số Lớp Đang Phụ Trách
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-pink-950 font-mono">
                      {assignedClasses.length} Lớp
                    </h4>
                    <p className="text-[10px] text-pink-800 font-semibold">
                      Danh sách lớp học được phân công
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown per Class */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    📋 Bảng Thống Kê Thu Nhập Chi Tiết Theo Từng Lớp Học:
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classSalaryList.map((item) => (
                      <div
                        key={item.classObj.id}
                        className="p-5 rounded-3xl border border-pink-200/80 bg-gradient-to-br from-white via-pink-50/40 to-slate-50 dark:from-slate-800 dark:to-slate-800/80 space-y-3 shadow-2xs hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-400 text-white uppercase">
                            {item.classObj.code}
                          </span>
                          <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Bậc lương: {formatVND(item.rate)} / buổi
                          </span>
                        </div>

                        <div>
                          <h5 className="font-black text-sm text-slate-900 dark:text-white">
                            {item.classObj.className}
                          </h5>
                          <p className="text-xs text-slate-500 mt-0.5">Giáo trình: {item.classObj.courseName} • Lịch: {item.classObj.schedule}</p>
                        </div>

                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-pink-100 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-slate-500 font-bold block">Số buổi đã dạy:</span>
                            <span className="text-sm font-black text-pink-600 font-mono">{item.sessionCount} Buổi</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 font-bold block">Tổng tiền lớp này:</span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                              +{formatVND(item.totalSalary)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedClassForRevenueDetails(item.classObj)}
                          className="w-full py-2.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition border border-pink-300 flex items-center justify-center cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-pink-700" /> Bấm Xem Chi Tiết Các Buổi Đã Tính Lương →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* TAB 6: AI STUDIO PORTAL FOR TEACHERS */}
      {activeTab === 'ai_studio' && (
        <AiStudioPortal currentUser={currentUser} />
      )}

      {/* MODAL 1: PER CLASS DETAILED SESSIONS SALARY BREAKDOWN */}
      {selectedClassForRevenueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-emerald-300 p-6 sm:p-7 space-y-5 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClassForRevenueDetails(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-emerald-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg">
                💰
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  Chi Tiết Lương Lớp: {selectedClassForRevenueDetails.className}
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  Bậc lương: <strong className="text-emerald-600">{formatVND(selectedClassForRevenueDetails.teacherPayRatePerSession || 150000)} / buổi</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const classSesList = (sessions || []).filter(
                  (s) => s && s.classId === selectedClassForRevenueDetails.id && s.date && s.date.startsWith(teacherSelectedMonth)
                );
                const rate = selectedClassForRevenueDetails.teacherPayRatePerSession || 150000;

                if (classSesList.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic p-4 text-center">Chưa có buổi học nào được ghi nhận cho lớp này trong kỳ {teacherSelectedMonth.split('-').reverse().join('/')}.</p>
                  );
                }

                return classSesList.map((ses) => (
                  <div
                    key={ses.id}
                    className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/80 border border-emerald-200/80 flex items-center justify-between text-xs font-semibold"
                  >
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-900 dark:text-white block">
                        {selectedClassForRevenueDetails.className} - Buổi #{ses.sessionNumber}
                      </span>
                      <span className="text-slate-500 font-medium block">
                        🗓️ Ngày dạy: <strong className="text-pink-600">{ses.date}</strong>
                        {ses.isChargedAbsenceSession && (
                          <span className="ml-2 text-[10px] font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300">
                            ⚠️ Lớp nghỉ tính phí
                          </span>
                        )}
                      </span>
                    </div>

                    <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-sm shrink-0">
                      +{formatVND(rate)}
                    </span>
                  </div>
                ));
              })()}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedClassForRevenueDetails(null)}
                className="px-6 py-2 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ALL SESSIONS SALARY BREAKDOWN FOR TEACHER */}
      {isAllSessionsRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-emerald-300 p-6 sm:p-7 space-y-5 relative text-slate-800 dark:text-white max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAllSessionsRevenueModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-emerald-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-lg">
                📜
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  Danh Sách Chi Tiết Tất Cả Buổi Dạy Đã Tính Lương
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  Giáo viên: <strong>{currentUser?.displayName || 'Ms. Vy'}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const teacherClassesMap = new Map(assignedClasses.map((c) => [c.id, c]));
                const teacherSessions = (sessions || []).filter(
                  (s) => s && s.date && s.date.startsWith(teacherSelectedMonth) && teacherClassesMap.has(s.classId)
                );

                if (teacherSessions.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic p-4 text-center">Chưa có buổi học nào được ghi nhận trong kỳ {teacherSelectedMonth.split('-').reverse().join('/')}.</p>
                  );
                }

                return teacherSessions.map((ses) => {
                  const cls = teacherClassesMap.get(ses.classId);
                  const rate = cls?.teacherPayRatePerSession || 150000;

                  return (
                    <div
                      key={ses.id}
                      className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-slate-50 dark:from-slate-800 dark:to-slate-800 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                    >
                      <div className="space-y-1">
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          📌 Lớp: {cls?.className || ses.className} - Buổi #{ses.sessionNumber}
                        </span>
                        <div className="flex items-center space-x-2 text-slate-500 font-semibold">
                          <span>🗓️ Ngày dạy: <strong className="text-pink-600">{ses.date}</strong></span>
                          {ses.isChargedAbsenceSession && (
                            <span className="text-[10px] font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300">
                              ⚠️ Lớp nghỉ tính phí
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium block">Mức lương buổi này:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono text-base">
                          +{formatVND(rate)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsAllSessionsRevenueModalOpen(false)}
                className="px-6 py-2 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
