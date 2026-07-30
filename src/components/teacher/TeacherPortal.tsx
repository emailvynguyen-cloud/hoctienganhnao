import React, { useState, useEffect } from 'react';
import { Class, Student, Session, User as UserType } from '../../types';
import { WeeklyTimetable } from '../common/WeeklyTimetable';
import { ClassDetailsView } from '../admin/ClassDetailsView';
import { StudentPortal } from '../student/StudentPortal';
import { HomeworkGradingWidget } from '../admin/HomeworkGradingWidget';
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
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'today' | 'grading' | 'schedule' | 'all_classes'>('today');

  useEffect(() => {
    if (targetSubmissionId) {
      setActiveTab('grading');
    }
  }, [targetSubmissionId]);

  // Sub-View Inspection State (Keeps Teacher Portal Context Intact)
  const [inspectedClass, setInspectedClass] = useState<Class | null>(null);
  const [inspectedStudent, setInspectedStudent] = useState<Student | null>(null);

  // STRICT TEACHER SCOPING: Filter classes strictly assigned to this teacher
  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const assignedClasses = (classes || []).filter((c) => {
    if (!currentUser || isSuperOrAdmin) return true;
    return c.teacherId === currentUser.uid || (c.teacherName && c.teacherName === currentUser.displayName);
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
  useEffect(() => {
    if (onSetSubViewNavigation) {
      if (inspectedStudent) {
        onSetSubViewNavigation(
          true,
          () => setInspectedStudent(null),
          () => {
            setInspectedStudent(null);
            setInspectedClass(null);
            setActiveTab('today');
          }
        );
      } else if (inspectedClass) {
        onSetSubViewNavigation(
          true,
          () => setInspectedClass(null),
          () => {
            setInspectedClass(null);
            setActiveTab('today');
          }
        );
      } else {
        onSetSubViewNavigation(false);
      }
    }
  }, [inspectedStudent, inspectedClass, onSetSubViewNavigation]);

  // IF INSPECTING A STUDENT LEARNING PAGE FROM TEACHER PORTAL (TEACHER PORTAL CONTEXT INTACT)
  if (inspectedStudent) {
    const isEnrolledInTeacherClass = isSuperOrAdmin || assignedClasses.some(
      (c) => inspectedStudent.classIds && inspectedStudent.classIds.includes(c.id)
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
            onClick={() => setInspectedStudent(null)}
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
            onClick={() => setInspectedStudent(null)}
            className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Giáo Viên
          </button>

          <div className="text-center">
            <span className="text-xs font-black text-pink-950 dark:text-slate-200 block">
              Đang Xem Trang Học Tập Học Viên: <strong className="text-pink-600 underline">{inspectedStudent.name}</strong>
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              (Bạn vẫn đang ở Teacher Management Portal Context)
            </span>
          </div>

          <button
            onClick={() => {
              setInspectedStudent(null);
              setInspectedClass(null);
              setActiveTab('today');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition flex items-center shrink-0 border border-slate-300"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home
          </button>
        </div>

        <StudentPortal
          currentStudent={inspectedStudent}
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
  if (inspectedClass) {
    const isAssigned = isSuperOrAdmin || assignedClasses.some((c) => c.id === inspectedClass.id);

    if (!isAssigned) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-rose-950">Quyền Truy Cập Bị Giới Hạn</h3>
          <p className="text-xs text-rose-800 font-medium">
            Bạn không có quyền quản lý hoặc xem dữ liệu của lớp học này. Vui lòng quay về trang chủ Giáo Viên của bạn.
          </p>
          <button
            onClick={() => setInspectedClass(null)}
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
            onClick={() => setInspectedClass(null)}
            className="px-3.5 py-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-extrabold text-xs transition flex items-center shrink-0 border border-pink-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Bảng Giáo Viên
          </button>
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
            Đang Xem Chi Tiết Lớp: {inspectedClass.className}
          </span>
          <button
            onClick={() => {
              setInspectedClass(null);
              setActiveTab('today');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center shrink-0"
          >
            <Home className="w-3.5 h-3.5 mr-1" /> Home
          </button>
        </div>

        <ClassDetailsView
          selectedClass={inspectedClass}
          students={students}
          sessions={sessions}
          homeworkSubmissions={StorageEngine.getHomeworkSubmissions()}
          onBack={() => setInspectedClass(null)}
          onOpenAddSession={onOpenAddSession}
          onOpenEditSession={(session) => onOpenAddSession(session.classId, session)}
          onOpenPublicStudentLink={(hash) => {
            const foundStd = students.find((s) => s.publicHash === hash);
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
                      onClick={() => setInspectedClass(activeTodayClass)}
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
                  onClick={() => setInspectedClass(cls)}
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
                onClick={() => setInspectedClass(cls)}
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

    </div>
  );
};
