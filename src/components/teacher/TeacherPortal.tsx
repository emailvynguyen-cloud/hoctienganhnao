import React, { useState, useEffect } from 'react';
import { Class, Student, Session, User as UserType } from '../../types';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from '../admin/ClassDetailsView';
import { StudentPortal } from '../student/StudentPortal';
import { HomeworkGradingWidget } from '../admin/HomeworkGradingWidget';
import { AiStudioPortal } from '../admin/AiStudioPortal';
import { AdminLearningHub } from '../admin/learning/AdminLearningHub';
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
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { formatVND } from '../../lib/vietqr';
import { calculateTeacherPenaltiesAndRevenue, TeacherPenaltyItem } from '../../lib/teacherPenaltyEngine';

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
  const [activeTab, setActiveTab] = useState<'today' | 'pending_tasks' | 'grading' | 'schedule' | 'all_classes' | 'revenue' | 'ai_studio' | 'learning_hub'>('today');
  const [selectedClassIdForRevenueDetails, setSelectedClassIdForRevenueDetails] = useState<string | null>(null);
  const selectedClassForRevenueDetails = selectedClassIdForRevenueDetails
    ? (classes || []).find((c) => c && c.id === selectedClassIdForRevenueDetails) || null
    : null;
  const [isAllSessionsRevenueModalOpen, setIsAllSessionsRevenueModalOpen] = useState<boolean>(false);

  // REVENUE DATE RANGE FILTER STATE
  const [revenueDatePreset, setRevenueDatePreset] = useState<'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

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

  useEffect(() => {
    const syncTabFromUrl = () => {
      setInspectedClassId(null);
      setInspectedStudentId(null);
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
          setActiveTab(tabParam as any);
        } else if (window.location.pathname === '/teacher/students') {
          setActiveTab('all_classes');
        }
      }
    };

    syncTabFromUrl();

    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('navigation_tab_change', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('navigation_tab_change', syncTabFromUrl);
    };
  }, []);

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

  // SINGLE SOURCE OF TRUTH: TEACHER PENDING UNRECORDED SESSIONS (NO OTHER TEACHER DATA, NO QUIZLET)
  const teacherPendingTasks = React.useMemo(() => {
    const currentTeacherId = currentUser?.uid || currentUser?.displayName || 'u_teacher';
    const summary = calculateTeacherPenaltiesAndRevenue(
      currentTeacherId,
      assignedClasses,
      sessions
    );

    return summary.penalties
      .filter((item) => !item.isRecorded)
      .map((item) => ({
        id: item.id,
        classId: item.classId,
        className: item.className,
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        dateISO: item.dateISO,
        scheduleTimeStr: item.scheduleTimeStr,
        dueDeadlineStr: item.dueDeadlineStr,
        overdueDays: item.overdueDays,
        penaltyAmount: item.penaltyAmount,
        isOverdue: item.overdueDays > 0,
      }));
  }, [currentUser, assignedClasses, sessions]);

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

  const handleSelectTab = (tab: typeof activeTab) => {
    setInspectedClassId(null);
    setInspectedStudentId(null);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      
      {/* Super Admin Teacher Preview Switcher */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs text-slate-800 dark:text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm block">
                Chế Độ Xem Giao Diện Giáo Viên (Super Admin Preview)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Bạn đang trải nghiệm giao diện Teacher Portal với tư cách Super Admin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <label className="font-medium text-xs text-slate-600 dark:text-slate-300">Giáo viên:</label>
            <select
              value={selectedTeacherPreviewId}
              onChange={(e) => setSelectedTeacherPreviewId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="u_super_admin">Ms. Vy (Lớp Cá Nhân Ms. Vy)</option>
              <option value="all">Tất Cả Các Lớp Trong Trung Tâm</option>
              {otherTeachersList.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.displayName} ({t.email || 'Giáo viên'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Teacher Portal Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-x-auto">
        <button
          onClick={() => handleSelectTab('today')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 border border-transparent cursor-pointer ${
            activeTab === 'today'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Lịch Dạy Hôm Nay
        </button>

        <button
          onClick={() => handleSelectTab('pending_tasks')}
          className={`h-11 px-4 rounded-xl text-sm font-bold transition-all duration-150 shrink-0 flex items-center border border-transparent cursor-pointer ${
            activeTab === 'pending_tasks'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />
          📋 Công Việc Cần Xử Lý
          {teacherPendingTasks.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-2xs">
              {teacherPendingTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleSelectTab('grading')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 flex items-center border border-transparent cursor-pointer ${
            activeTab === 'grading'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4 mr-1.5" /> Bài Tập Cần Feedback
        </button>
        <button
          onClick={() => handleSelectTab('schedule')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 border border-transparent cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Thời Khóa Biểu Tuần
        </button>

        <button
          onClick={() => handleSelectTab('all_classes')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 border border-transparent cursor-pointer ${
            activeTab === 'all_classes'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Lớp Phụ Trách ({assignedClasses.length})
        </button>

        <button
          onClick={() => handleSelectTab('revenue')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 flex items-center border border-transparent cursor-pointer ${
            activeTab === 'revenue'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 mr-1.5" /> Doanh Thu Lương Dạy
        </button>

        <button
          onClick={() => handleSelectTab('learning_hub')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 flex items-center border border-transparent cursor-pointer ${
            activeTab === 'learning_hub'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1.5" /> Learning Hub (Ôn Luyện)
        </button>

        <button
          onClick={() => handleSelectTab('ai_studio')}
          className={`h-11 px-4 rounded-xl text-sm font-medium transition-all duration-150 shrink-0 flex items-center border border-transparent cursor-pointer ${
            activeTab === 'ai_studio'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> AI Studio Dạy Học
        </button>
      </div>

      {/* TAB LEARNING HUB */}
      {activeTab === 'learning_hub' && (
        <AdminLearningHub currentUser={currentUser} />
      )}

      {/* TAB CÔNG VIỆC CẦN XỬ LÝ (GIÁO VIÊN PENDING TASKS) */}
      {activeTab === 'pending_tasks' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6 animate-fadeIn">
          
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-6 h-6 text-amber-200 animate-bounce shrink-0" />
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  📋 CÔNG VIỆC CẦN XỬ LÝ CỦA GIÁO VIÊN
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
                Chỉ hiển thị các buổi học thuộc các lớp bạn phụ trách đã diễn ra nhưng CHƯA ĐƯỢC NHẬP BUỔI. Nhập buổi ngay để tránh tích lũy tiền phạt!
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-extrabold text-sm shrink-0">
              ⚠️ Đang có {teacherPendingTasks.length} buổi chưa nhập
            </div>
          </div>

          {teacherPendingTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherPendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-5 rounded-3xl border transition space-y-3 shadow-xs relative ${
                    task.isOverdue
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 ring-2 ring-rose-300/50'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-pink-500 text-white">
                      {task.className}
                    </span>

                    {task.isOverdue ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> 🔴 QUÁ HẠN
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 uppercase tracking-wider">
                        🟡 Chưa nhập buổi
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      🗓️ {task.dateISO.split('-').reverse().join('/')}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      Giờ học: {task.scheduleTimeStr}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <div className="text-slate-500 font-medium">
                      Hạn nhập buổi: <strong className="text-slate-800 dark:text-slate-200 font-mono">{task.dueDeadlineStr}</strong>
                    </div>

                    {task.isOverdue && (
                      <div className="pt-1 text-rose-700 dark:text-rose-400 font-bold border-t border-dashed border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                        <span>⚠️ Quá hạn: {task.overdueDays} ngày</span>
                        <span className="font-mono text-rose-600 font-black">-{formatVND(task.penaltyAmount)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenAddSession(task.classId)}
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" /> [Nhập Buổi Học Ngay]
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-3xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-base">Tuyệt Vời! Không Có Công Việc Cần Xử Lý Tồn Đọng</h4>
              <p className="text-xs font-medium text-emerald-700">
                Tất cả các buổi học của bạn đã được ghi nhận đầy đủ đúng hạn.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 1: TODAY'S CLASSES & SESSIONS */}
      {activeTab === 'today' && (
        <div className="space-y-6">

          {/* TOP BANNER: CÔNG VIỆC CẦN XỬ LÝ NẾU CÓ */}
          {teacherPendingTasks.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white shadow-md space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <AlertTriangle className="w-6 h-6 text-amber-200 animate-bounce shrink-0" />
                  <div>
                    <h3 className="font-black text-base tracking-tight">
                      📋 CÔNG VIỆC CẦN XỬ LÝ ({teacherPendingTasks.length} buổi chưa nhập)
                    </h3>
                    <p className="text-xs text-amber-100 font-medium">
                      Buổi học đã diễn ra nhưng chưa được nhập. Nhập buổi ngay để dừng phát sinh tiền phạt!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pending_tasks')}
                  className="px-4 py-2 rounded-xl bg-white text-rose-950 font-black text-xs hover:bg-amber-100 transition cursor-pointer shrink-0 shadow-xs"
                >
                  Xem Tất Cả Tasks →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teacherPendingTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{task.className}</span>
                      {task.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-950">
                          🔴 QUÁ HẠN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950">
                          🟡 Chưa nhập buổi
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-amber-100 font-medium">
                      🗓️ {task.dateISO.split('-').reverse().join('/')} • {task.scheduleTimeStr}
                    </p>

                    <div className="text-[11px] text-white/90">
                      Hạn nhập: <strong>{task.dueDeadlineStr}</strong>
                    </div>

                    {task.isOverdue && (
                      <div className="text-[11px] text-amber-200 font-bold bg-black/20 p-1.5 rounded-lg">
                        ⚠️ Quá hạn: {task.overdueDays} ngày • Tiền phạt: -{formatVND(task.penaltyAmount)}
                      </div>
                    )}

                    <button
                      onClick={() => onOpenAddSession(task.classId)}
                      className="w-full py-2 rounded-xl bg-white text-rose-950 font-black text-xs hover:bg-amber-100 transition cursor-pointer shadow-xs"
                    >
                      [Nhập buổi học]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* TAB 3: WEEKLY TIMETABLE FOR TEACHER (SCOPED STRICTLY TO TEACHER'S ASSIGNED CLASSES) */}
      {activeTab === 'schedule' && (
        <WeeklyTimetable
          currentUser={currentUser}
          classes={assignedClasses}
          students={students}
          sessions={sessions}
          onOpenAddSession={onOpenAddSession}
          onSelectClass={(cls) => setInspectedClassId(cls.id)}
          onSelectStudent={(std) => setInspectedStudentId(std.id)}
        />
      )}
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6 animate-fadeIn">
          
          {/* Header */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-100 via-teal-50 to-sky-100 dark:from-emerald-950/60 dark:to-slate-800 text-emerald-950 border border-emerald-300 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-emerald-600 animate-pulse shrink-0" />
                <h3 className="text-xl sm:text-2xl font-bold text-emerald-950 dark:text-white tracking-tight">
                  💰 Doanh Thu & Thu Nhập Giảng Dạy
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 font-normal leading-relaxed">
                Công thức: <strong className="font-mono">Thực nhận = Doanh thu - Tiền phạt</strong> (Trừ 10.000đ/ngày nếu trễ hạn nhập buổi 24h)
              </p>
            </div>

            {/* DATE RANGE PRESET FILTER BAR */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-slate-700 text-xs font-bold shadow-2xs">
                <button
                  onClick={() => setRevenueDatePreset('today')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenueDatePreset === 'today'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setRevenueDatePreset('this_week')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenueDatePreset === 'this_week'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  Tuần này
                </button>
                <button
                  onClick={() => setRevenueDatePreset('this_month')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenueDatePreset === 'this_month'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  Tháng này
                </button>
                <button
                  onClick={() => setRevenueDatePreset('last_month')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenueDatePreset === 'last_month'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  Tháng trước
                </button>
                <button
                  onClick={() => setRevenueDatePreset('custom')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    revenueDatePreset === 'custom'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                  }`}
                >
                  Tùy chọn
                </button>
              </div>

              {revenueDatePreset === 'custom' && (
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-emerald-300">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs p-1 rounded border border-slate-300 dark:bg-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">đến</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs p-1 rounded border border-slate-300 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* CALCULATE STATS AND PENALTIES */}
          {(() => {
            const currentTeacherId = currentUser?.uid || currentUser?.displayName || 'u_teacher';
            
            // Derive date range from preset
            const getDateRange = () => {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();

              if (revenueDatePreset === 'today') {
                const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                return { startDate: todayStr, endDate: todayStr };
              }
              if (revenueDatePreset === 'this_week') {
                const currentDay = now.getDay();
                const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
                const monday = new Date(now);
                monday.setDate(now.getDate() - distanceToMonday);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                return {
                  startDate: `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`,
                  endDate: `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`,
                };
              }
              if (revenueDatePreset === 'this_month') {
                const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                return { startDate: startStr, endDate: endStr };
              }
              if (revenueDatePreset === 'last_month') {
                const lastMonthDate = new Date(year, month - 1, 1);
                const lmYear = lastMonthDate.getFullYear();
                const lmMonth = lastMonthDate.getMonth();
                const startStr = `${lmYear}-${String(lmMonth + 1).padStart(2, '0')}-01`;
                const lastDay = new Date(lmYear, lmMonth + 1, 0).getDate();
                const endStr = `${lmYear}-${String(lmMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                return { startDate: startStr, endDate: endStr };
              }
              return { startDate: customStartDate, endDate: customEndDate };
            };

            const dRange = getDateRange();
            const summary = calculateTeacherPenaltiesAndRevenue(
              currentTeacherId,
              assignedClasses,
              sessions,
              dRange.startDate,
              dRange.endDate
            );

            return (
              <div className="space-y-6">
                
                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 text-sky-950 border border-sky-300 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900">
                      📚 Tổng Số Buổi Dạy
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-bold text-sky-950 font-mono tracking-tight">
                      {summary.totalSessionsCount} Buổi
                    </h4>
                    <p className="text-xs text-sky-800 font-medium">
                      Buổi dạy thực tế được ghi nhận
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-100 text-emerald-950 border border-emerald-300 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      💰 Tổng Doanh Thu
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-bold text-emerald-950 font-mono tracking-tight">
                      +{formatVND(summary.grossRevenue)}
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Tính theo bậc lương chuẩn
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 text-rose-950 border border-rose-300 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      ⚠️ Tiền Phạt (Trễ Hạn Nhập)
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-bold text-rose-700 font-mono tracking-tight">
                      -{formatVND(summary.totalPenalty)}
                    </h4>
                    <p className="text-xs text-rose-800 font-medium">
                      Trừ 10.000đ/ngày nếu trễ hạn 24h
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-100 text-amber-950 border border-amber-300 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      💵 THỰC NHẬN (LƯƠNG RÒNG)
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-bold text-amber-950 font-mono tracking-tight">
                      {formatVND(summary.netRevenue)}
                    </h4>
                    <p className="text-xs text-amber-800 font-medium">
                      Doanh Thu - Tiền Phạt
                    </p>
                  </div>
                </div>

                {/* AREA: CHI TIẾT TIỀN PHẠT */}
                <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-slate-800/80 border border-rose-200 dark:border-rose-900/60 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-900/40 pb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <h4 className="font-extrabold text-sm text-rose-950 dark:text-rose-200 uppercase tracking-wider">
                        ⚠️ CHI TIẾT TIỀN PHẠT TRỄ HẠN NHẬP BUỔI HỌC ({summary.penalties.length} khoản)
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-3 py-1 rounded-xl border border-rose-300">
                      Tổng tiền phạt: -{formatVND(summary.totalPenalty)}
                    </span>
                  </div>

                  {summary.penalties.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-rose-100/80 dark:bg-slate-900 text-rose-950 dark:text-rose-200 border-b border-rose-200">
                            <th className="p-3 font-extrabold">Ngày Dạy</th>
                            <th className="p-3 font-extrabold">Lớp Học</th>
                            <th className="p-3 font-extrabold">Buổi Học</th>
                            <th className="p-3 font-extrabold">Hạn Nhập</th>
                            <th className="p-3 font-extrabold">Nhập Lúc</th>
                            <th className="p-3 font-extrabold text-center">Trễ</th>
                            <th className="p-3 font-extrabold text-right">Tiền Phạt</th>
                            <th className="p-3 font-extrabold text-center">Trạng Thái</th>
                            <th className="p-3 font-extrabold text-center">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100 dark:divide-slate-700">
                          {summary.penalties.map((item) => (
                            <tr
                              key={item.id}
                              className={`hover:bg-rose-100/40 dark:hover:bg-slate-800 transition ${
                                item.status === 'ongoing' ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                              }`}
                            >
                              <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {item.dateISO.split('-').reverse().join('/')}
                              </td>
                              <td className="p-3 font-black text-rose-900 dark:text-rose-300 whitespace-nowrap">
                                {item.className}
                              </td>
                              <td className="p-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.scheduleTimeStr}
                              </td>
                              <td className="p-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.dueDeadlineStr}
                              </td>
                              <td className="p-3 font-medium whitespace-nowrap">
                                {item.isRecorded ? (
                                  <span className="text-emerald-700 font-bold">{item.recordedTimeStr}</span>
                                ) : (
                                  <span className="text-rose-600 font-black">Chưa nhập</span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-amber-700 text-center whitespace-nowrap">
                                {item.overdueDays} ngày
                              </td>
                              <td className="p-3 font-mono font-bold text-rose-700 text-right whitespace-nowrap">
                                -{formatVND(item.penaltyAmount)}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {item.status === 'ongoing' && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                    🟡 Đang phát sinh
                                  </span>
                                )}
                                {item.status === 'completed' && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    🟢 Đã hoàn tất
                                  </span>
                                )}
                                {item.status === 'waived' && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                                    ⚪ Đã miễn
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {!item.isRecorded && (
                                  <button
                                    onClick={() => onOpenAddSession(item.classId)}
                                    className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] transition shadow-xs cursor-pointer flex items-center justify-center mx-auto"
                                    title="Click để nhập buổi học ngay và dừng phát sinh tiền phạt"
                                  >
                                    <PlusCircle className="w-3 h-3 mr-1" /> Nhập Buổi Ngay
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-rose-100 text-xs text-emerald-700 font-bold flex items-center justify-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Tuyệt vời! Giáo viên không có khoản phạt nào trong khoảng thời gian này.</span>
                    </div>
                  )}
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
              onClick={() => setSelectedClassIdForRevenueDetails(null)}
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
                  Bậc lương: <strong className="text-emerald-600">{formatVND(typeof selectedClassForRevenueDetails.teacherPayRatePerSession === 'number' ? selectedClassForRevenueDetails.teacherPayRatePerSession : 150000)} / buổi</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const classSesList = (sessions || []).filter(
                  (s) => s && s.classId === selectedClassForRevenueDetails.id && s.date && s.date.startsWith(teacherSelectedMonth)
                );
                const rate = typeof selectedClassForRevenueDetails.teacherPayRatePerSession === 'number' ? selectedClassForRevenueDetails.teacherPayRatePerSession : 150000;

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
                onClick={() => setSelectedClassIdForRevenueDetails(null)}
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
                const teacherClassesMap = new Map<string, Class>(assignedClasses.map((c) => [c.id, c]));
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
                  const rate = typeof cls?.teacherPayRatePerSession === 'number' ? cls.teacherPayRatePerSession : 150000;

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
