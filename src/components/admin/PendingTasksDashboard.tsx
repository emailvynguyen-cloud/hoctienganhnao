import React from 'react';
import { Class, Student, Session, User } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Bell, Clock, AlertCircle, BookOpen, CheckCircle2, UserCheck, ChevronRight, ExternalLink, Trash2 } from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface PendingTasksDashboardProps {
  classes: Class[];
  students: Student[];
  sessions: Session[];
  allUsers?: User[];
  currentUser?: User | null;
  onOpenAddSession?: (classId?: string, editingSession?: Session) => void;
  onInspectClass?: (classId: string) => void;
}

export interface PendingTaskItem {
  id: string;
  type: 'unrecorded_session' | 'missing_quizlet';
  classId: string;
  className: string;
  scheduleTimeStr: string;
  endTimeStr: string;
  overdueText?: string;
  missingStudents?: string[];
}

export interface TeacherPendingGroup {
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  tasks: PendingTaskItem[];
}

// ----------------------------------------------------------------------
// HELPER: PARSE SCHEDULE & CHECK IF TODAY MATCHES & END TIME PASSED
// ----------------------------------------------------------------------
function getTodayScheduleInfo(scheduleStr: string = '') {
  const now = new Date();
  const todayDayIdx = now.getDay(); // 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7

  const dayPatterns: { idx: number; pattern: RegExp }[] = [
    { idx: 1, pattern: /T2|THỨ 2|THỨ HAI/i },
    { idx: 2, pattern: /T3|THỨ 3|THỨ BA/i },
    { idx: 3, pattern: /T4|THỨ 4|THỨ TƯ/i },
    { idx: 4, pattern: /T5|THỨ 5|THỨ NĂM/i },
    { idx: 5, pattern: /T6|THỨ 6|THỨ SÁU/i },
    { idx: 6, pattern: /T7|THỨ 7|THỨ BẢY/i },
    { idx: 0, pattern: /CN|CHỦ NHẬT/i },
  ];

  const todayMatch = dayPatterns.find((p) => p.idx === todayDayIdx);
  const isScheduledToday = todayMatch ? todayMatch.pattern.test(scheduleStr) : false;

  // Extract time slot (e.g. "18:00 - 19:30")
  const rangeMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  const startTimeStr = rangeMatch ? rangeMatch[1].padStart(5, '0') : '18:00';
  const endTimeStr = rangeMatch ? rangeMatch[2].padStart(5, '0') : '19:30';

  // Check if end time has passed today
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHH}:${currentMM}`;

  const isEndTimePassed = isScheduledToday && currentTimeStr >= endTimeStr;

  // Overdue calculation
  let overdueText = '';
  if (isEndTimePassed) {
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const endMinutes = endH * 60 + endM;
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const diffMin = curMinutes - endMinutes;
    if (diffMin > 60) {
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      overdueText = `Quá hạn ${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    } else if (diffMin > 0) {
      overdueText = `Quá hạn ${diffMin} phút`;
    } else {
      overdueText = 'Đã hết giờ học';
    }
  }

  return {
    isScheduledToday,
    startTimeStr,
    endTimeStr,
    isEndTimePassed,
    overdueText,
  };
}

export const PendingTasksDashboard: React.FC<PendingTasksDashboardProps> = ({
  classes = [],
  students = [],
  sessions = [],
  allUsers = [],
  currentUser,
  onOpenAddSession,
  onInspectClass,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const [dismissedTaskIds, setDismissedTaskIds] = React.useState<string[]>(() => StorageEngine.getDismissedPendingTaskIds());

  const handleDismissTask = (taskId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ qua vĩnh viễn công việc này khỏi danh sách cần xử lý?')) {
      StorageEngine.dismissPendingTaskId(taskId);
      setDismissedTaskIds((prev) => [...prev, taskId]);
    }
  };

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. CALCULATE TODAY SUMMARY METRICS
  const todayClassesInfo = classes.map((cls) => {
    const sched = getTodayScheduleInfo(cls.schedule);
    const recordedTodaySession = sessions.find((s) => s.classId === cls.id && s.date === todayISO);
    return {
      cls,
      sched,
      recordedTodaySession,
    };
  });

  const scheduledTodayClasses = todayClassesInfo.filter((i) => i.sched.isScheduledToday);
  const totalScheduledToday = scheduledTodayClasses.length;
  const totalRecordedToday = scheduledTodayClasses.filter((i) => !!i.recordedTodaySession).length;
  const totalUnrecordedToday = scheduledTodayClasses.filter((i) => !i.recordedTodaySession && i.sched.isEndTimePassed).length;

  // 2. COMPUTE INDEPENDENT PENDING TASKS GROUPED BY TEACHER
  const teacherGroupsMap: Record<string, TeacherPendingGroup> = {};

  // Initialize teacher groups from classes
  classes.forEach((cls) => {
    const teacherName = cls.teacherName || 'Giáo viên';
    const teacherId = cls.teacherId || teacherName;

    if (!teacherGroupsMap[teacherId]) {
      const userObj = allUsers.find((u) => u.displayName === teacherName || u.uid === teacherId);
      teacherGroupsMap[teacherId] = {
        teacherId,
        teacherName,
        teacherAvatar: userObj?.avatarUrl,
        tasks: [],
      };
    }
  });

  // Evaluate scheduled classes whose END TIME HAS PASSED today
  scheduledTodayClasses.forEach(({ cls, sched, recordedTodaySession }) => {
    const teacherName = cls.teacherName || 'Giáo viên';
    const teacherId = cls.teacherId || teacherName;
    const group = teacherGroupsMap[teacherId];

    if (!group) return;

    // INDEPENDENT CONDITION A: UNRECORDED SESSION (If end time passed & session not recorded today)
    const unrecordedTaskId = `unrecorded_${cls.id}_${todayISO}`;
    if (sched.isEndTimePassed && !recordedTodaySession && !dismissedTaskIds.includes(unrecordedTaskId)) {
      group.tasks.push({
        id: unrecordedTaskId,
        type: 'unrecorded_session',
        classId: cls.id,
        className: cls.className,
        scheduleTimeStr: `${sched.startTimeStr} - ${sched.endTimeStr}`,
        endTimeStr: sched.endTimeStr,
        overdueText: sched.overdueText,
      });
    }

    // INDEPENDENT CONDITION B: MISSING QUIZLET (If end time passed, check missing Quizlet for students in class - skip if excused or charged absence session)
    const quizletTaskId = `quizlet_${cls.id}_${todayISO}`;
    if (
      sched.isEndTimePassed &&
      (!recordedTodaySession || (!recordedTodaySession.isExcusedAbsenceSession && !recordedTodaySession.isChargedAbsenceSession)) &&
      !dismissedTaskIds.includes(quizletTaskId)
    ) {
      const classStudents = students.filter((s) => s && s.classIds && s.classIds.includes(cls.id));
      const targetSession = recordedTodaySession || sessions.find((s) => s.classId === cls.id && !s.isExcusedAbsenceSession && !s.isChargedAbsenceSession);

      const missingQuizletStudentNames: string[] = [];

      classStudents.forEach((std) => {
        const sessionQuizlet = targetSession?.quizletUrl;
        const fbObj = targetSession?.studentFeedbacks?.[std.id];
        const studentFbUrl = fbObj?.materialUrl;
        const studentFbMaterials = fbObj?.materials || [];

        const hasSessionQuizlet = !!sessionQuizlet && sessionQuizlet.trim().length > 0;
        const hasFbUrlQuizlet = !!studentFbUrl && studentFbUrl.toLowerCase().includes('quizlet');
        const hasFbMaterialsQuizlet = studentFbMaterials.some(
          (m) => (m.url && m.url.toLowerCase().includes('quizlet')) || (m.title && m.title.toLowerCase().includes('quizlet'))
        );
        const hasStudentResourceQuizlet = (std.resourceLinks || []).some(
          (r) => (r.url && r.url.toLowerCase().includes('quizlet')) || (r.title && r.title.toLowerCase().includes('quizlet'))
        );

        const isQuizletCompleted = hasSessionQuizlet || hasFbUrlQuizlet || hasFbMaterialsQuizlet || hasStudentResourceQuizlet;

        if (!isQuizletCompleted) {
          missingQuizletStudentNames.push(std.name);
        }
      });

      if (missingQuizletStudentNames.length > 0) {
        group.tasks.push({
          id: quizletTaskId,
          type: 'missing_quizlet',
          classId: cls.id,
          className: cls.className,
          scheduleTimeStr: `${sched.startTimeStr} - ${sched.endTimeStr}`,
          endTimeStr: sched.endTimeStr,
          missingStudents: missingQuizletStudentNames,
        });
      }
    }
  });

  // Filter ONLY teachers who have at least 1 pending task (totalPendingTasks > 0)
  const activeTeacherGroups = Object.values(teacherGroupsMap).filter((g) => g.tasks.length > 0);
  const totalTeachersWithPending = activeTeacherGroups.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 3. TODAY SUMMARY OVERVIEW BAR ("TỔNG QUAN HÔM NAY") */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-2xl shadow-2xs">
              📋
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                CÔNG VIỆC CẦN XỬ LÝ (TODAY DASHBOARD)
              </h2>
              <p className="text-xs text-rose-100 font-medium">
                Tự động tổng hợp và kiểm tra độc lập lịch học & tình trạng Quizlet theo thời gian thực
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-xs font-bold shrink-0 self-start sm:self-center">
            📅 Hôm nay: {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
          <div className="bg-white/15 backdrop-blur-xs p-4 rounded-2xl border border-white/20 space-y-1">
            <span className="text-[11px] font-bold text-rose-100 block uppercase">
              Tổng Buổi Học Hôm Nay
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white block">
              {totalScheduledToday} buổi
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-xs p-4 rounded-2xl border border-white/20 space-y-1">
            <span className="text-[11px] font-bold text-emerald-200 block uppercase">
              Số Buổi Đã Nhập
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-100 block">
              {totalRecordedToday} buổi
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-xs p-4 rounded-2xl border border-white/20 space-y-1">
            <span className="text-[11px] font-bold text-rose-200 block uppercase">
              Số Buổi Chưa Nhập
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-100 block">
              {totalUnrecordedToday} buổi
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-xs p-4 rounded-2xl border border-white/20 space-y-1">
            <span className="text-[11px] font-bold text-amber-200 block uppercase">
              GV Còn Việc Xử Lý
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-100 block">
              {totalTeachersWithPending} GV
            </span>
          </div>
        </div>
      </div>

      {/* 4. TEACHER CARDS GRID */}
      {activeTeacherGroups.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-slate-800 space-y-3 shadow-2xs">
          <span className="text-4xl">🎉</span>
          <h3 className="text-lg font-black text-emerald-950 dark:text-emerald-300">
            Tuyệt Vời! Không Có Công Việc Nào Tồn Đọng Hôm Nay
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            Toàn bộ giáo viên đã hoàn thành nhập buổi học và thêm Quizlet đầy đủ cho học viên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTeacherGroups.map((group) => (
            <div
              key={group.teacherId}
              className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200/90 dark:border-slate-800 p-6 space-y-4 shadow-sm hover:shadow-md transition duration-200"
            >
              {/* TEACHER CARD HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div className="flex items-center space-x-3">
                  <img
                    src={resolveAvatarUrl(group.teacherAvatar || '')}
                    alt={group.teacherName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className="w-11 h-11 rounded-2xl object-cover border border-rose-200 dark:border-slate-700 shadow-2xs"
                  />
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center">
                      👩‍🏫 {group.teacherName}
                    </h3>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-extrabold block mt-0.5">
                      Còn {group.tasks.length} công việc cần xử lý
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black border border-rose-200">
                  {group.tasks.length} Việc
                </span>
              </div>

              {/* PENDING TASKS LIST */}
              <div className="space-y-3">
                {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border space-y-2 text-xs transition duration-150 ${
                      task.type === 'unrecorded_session'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black">
                      <span className="flex items-center space-x-1.5">
                        <span className="text-sm">{task.type === 'unrecorded_session' ? '🔴' : '🟠'}</span>
                        <span className="uppercase tracking-wider">
                          {task.type === 'unrecorded_session' ? 'Chưa Nhập Buổi Học' : 'Chưa Thêm Quizlet'}
                        </span>
                      </span>

                      <div className="flex items-center space-x-2">
                        {task.type === 'unrecorded_session' && onOpenAddSession && (
                          <button
                            type="button"
                            onClick={() => onOpenAddSession(task.classId)}
                            className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer flex items-center shrink-0"
                          >
                            + Nhập Buổi Ngay ↗
                          </button>
                        )}

                        {task.type === 'missing_quizlet' && onInspectClass && (
                          <button
                            type="button"
                            onClick={() => onInspectClass(task.classId)}
                            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer flex items-center shrink-0"
                          >
                            Chỉnh Sửa Lớp ↗
                          </button>
                        )}

                        {/* ONLY SUPER ADMIN HAS PERMISSION TO DISMISS TASK PERMANENTLY */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissTask(task.id);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-700 font-extrabold text-[11px] transition shrink-0 cursor-pointer shadow-2xs border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                            title="Chỉ Super Admin: Bỏ qua vĩnh viễn công việc này khỏi danh sách cần xử lý"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-500 hover:text-white" /> 🗑 Bỏ qua
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 font-medium">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        • {task.scheduleTimeStr} - Lớp: <span className="underline">{task.className}</span>
                      </p>

                      {task.type === 'unrecorded_session' && task.overdueText && (
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-rose-200/80 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 font-extrabold text-[11px]">
                          ⏰ {task.overdueText}
                        </span>
                      )}

                      {task.type === 'missing_quizlet' && task.missingStudents && task.missingStudents.length > 0 && (
                        <div className="pt-1.5 border-t border-amber-200/60 dark:border-amber-900/60 space-y-1">
                          <span className="font-bold text-amber-900 dark:text-amber-300">
                            Chưa thêm Quizlet cho các học viên:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-800 dark:text-slate-200 font-semibold pl-1">
                            {task.missingStudents.map((stdName, sIdx) => (
                              <li key={sIdx}>- {stdName}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
